import json
from datetime import datetime, timezone
from app.agents.base import BaseAgent, AgentRequest, AgentResponse
from app.core.config import settings
from app.core.database import get_pg_pool, get_neo4j_session
from app.core.gemini import get_client

_REQUIRED_FIELDS = {"microchip_id", "species"}


class AnimalImportAgent(BaseAgent):
    """
    Imports animals into PostgreSQL and Neo4j.
    Every record is validated by Gemini before writing — invalid records are
    skipped and returned with reasons rather than raising an error.
    """

    handles = ["import_animal", "import_animals_csv"]

    async def run(self, request: AgentRequest) -> AgentResponse:
        if request.intent == "import_animal":
            return await self._import_single(request.payload)
        elif request.intent == "import_animals_csv":
            return await self._import_batch(request.payload)
        return AgentResponse(success=False, data={}, error=f"Unknown intent: {request.intent}")

    # ------------------------------------------------------------------
    # Single import
    # ------------------------------------------------------------------

    async def _import_single(self, payload: dict) -> AgentResponse:
        missing = _REQUIRED_FIELDS - payload.keys()
        if missing:
            return AgentResponse(success=False, data={}, error=f"Missing required fields: {missing}")

        validations = await self._validate_with_llm([payload])
        v = validations[0]

        if not v["valid"]:
            return AgentResponse(
                success=False,
                data={"validation": v},
                error="Record failed LLM validation. See data.validation.issues for details.",
            )

        animal_id = await self._write_animal(payload)
        return AgentResponse(
            success=True,
            data={
                "animal_id": animal_id,
                "microchip_id": payload["microchip_id"],
                "validation": v,
            },
        )

    # ------------------------------------------------------------------
    # Batch import (CSV parsed client-side, sent as list of dicts)
    # ------------------------------------------------------------------

    async def _import_batch(self, payload: dict) -> AgentResponse:
        animals: list[dict] = payload.get("animals", [])
        if not animals:
            return AgentResponse(success=False, data={}, error="No animals provided.")

        validations = await self._validate_with_llm(animals)

        imported, skipped = [], []
        for i, animal in enumerate(animals):
            v = validations[i] if i < len(validations) else {"valid": False, "issues": ["No validation result"], "warnings": [], "notes": ""}

            missing = _REQUIRED_FIELDS - animal.keys()
            if missing:
                v["valid"] = False
                v.setdefault("issues", []).append(f"Missing required fields: {missing}")

            if not v["valid"]:
                skipped.append({"record": animal, "validation": v})
                continue

            try:
                animal_id = await self._write_animal(animal)
                imported.append({
                    "animal_id": animal_id,
                    "microchip_id": animal["microchip_id"],
                    "validation": v,
                })
            except Exception as e:
                skipped.append({"record": animal, "validation": v, "error": str(e)})

        return AgentResponse(
            success=True,
            data={
                "imported_count": len(imported),
                "skipped_count": len(skipped),
                "imported": imported,
                "skipped": skipped,
            },
        )

    # ------------------------------------------------------------------
    # LLM validation
    # ------------------------------------------------------------------

    async def _validate_with_llm(self, animals: list[dict]) -> list[dict]:
        prompt = f"""You are a wildlife data quality validator. Review these animal records.

For each record assess:
1. Is the species a real, recognisable animal (common name or scientific name)?
2. Is the age biologically plausible for that species?
3. Is the sex value valid (male / female / unknown or similar)?
4. Does the microchip_id look like a real identifier (not blank, not obviously placeholder text like "test" or "xxx")?
5. Are any required fields (microchip_id, species) missing or clearly nonsensical?

Return a JSON array — one object per animal, same order as input:
{{
  "index": <0-based int>,
  "valid": <true = safe to import, false = record should be rejected>,
  "issues": [<strings — blocking problems>],
  "warnings": [<strings — concerns that don't block import>],
  "notes": "<one-sentence plain-English summary>"
}}

Return ONLY valid JSON, no markdown.

Animals:
{json.dumps(animals, indent=2)}"""

        response = await get_client().aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        results = json.loads(raw)
        # Ensure the list is in index order and has the right length
        results.sort(key=lambda r: r.get("index", 0))
        return results

    # ------------------------------------------------------------------
    # Write a single validated animal to PostgreSQL + Neo4j
    # ------------------------------------------------------------------

    async def _write_animal(self, animal: dict) -> int:
        pool = await get_pg_pool()
        async with pool.acquire() as conn:
            animal_id = await conn.fetchval(
                """
                INSERT INTO animals
                    (microchip_id, name, species, sex, age, zoo_id, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (microchip_id) DO UPDATE
                    SET name = EXCLUDED.name,
                        species = EXCLUDED.species,
                        sex = EXCLUDED.sex,
                        age = EXCLUDED.age,
                        zoo_id = EXCLUDED.zoo_id
                RETURNING id
                """,
                animal["microchip_id"],
                animal.get("name"),
                animal["species"],
                animal.get("sex"),
                float(animal["age"]) if animal.get("age") not in (None, "") else None,
                animal.get("zoo_id"),
                datetime.now(timezone.utc),
            )

        async with get_neo4j_session() as session:
            await session.run(
                """
                MERGE (a:Animal {microchip_id: $microchip_id})
                SET a.name = $name,
                    a.species = $species,
                    a.sex = $sex,
                    a.age = $age,
                    a.zoo_id = $zoo_id
                """,
                microchip_id=animal["microchip_id"],
                name=animal.get("name"),
                species=animal["species"],
                sex=animal.get("sex"),
                age=float(animal["age"]) if animal.get("age") not in (None, "") else None,
                zoo_id=animal.get("zoo_id"),
            )

        return animal_id
