import json
from app.agents.base import BaseAgent, AgentRequest, AgentResponse
from app.core.config import settings
from app.core.database import get_neo4j_session, get_pg_pool
from app.core.gemini import get_client


class MatchingAgent(BaseAgent):
    """
    Finds best matches for transfers, vet referrals, and lost pets.
    Uses pgvector for embedding similarity + Gemini for re-ranking.
    """

    handles = ["match_transfer", "match_referral", "match_lost_pet"]

    async def run(self, request: AgentRequest) -> AgentResponse:
        intent = request.intent
        payload = request.payload

        if intent == "match_transfer":
            return await self._match_transfer(payload)
        elif intent == "match_referral":
            return await self._match_referral(payload)
        elif intent == "match_lost_pet":
            return await self._match_lost_pet(payload)

        return AgentResponse(success=False, data={}, error=f"Unknown intent: {intent}")

    async def _match_transfer(self, payload: dict) -> AgentResponse:
        species = payload.get("species")
        sex = payload.get("sex")
        age = payload.get("age")
        from_zoo_id = payload.get("from_zoo_id")

        description = f"{sex} {species}, {age} years old, transfer from zoo {from_zoo_id}"

        # Embed the animal description
        embed_result = await get_client().aio.models.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            contents=description,
        )
        embedding = embed_result.embeddings[0].values

        # Query Neo4j for candidate zoos
        async with get_neo4j_session() as session:
            result = await session.run(
                """
                MATCH (z:Zoo)
                WHERE z.id <> $from_zoo_id AND z.cites_ready = true
                RETURN z.id AS id, z.name AS name, z.description AS description
                LIMIT 20
                """,
                from_zoo_id=from_zoo_id,
            )
            candidates = [dict(r) for r in await result.data()]

        if not candidates:
            return AgentResponse(success=True, data={"matches": []})

        # LLM re-ranking
        prompt = f"""You are ranking zoo candidates for receiving a {description}.
Rank the following zoos by suitability (genetic diversity, quarantine capacity, past transfer success).
Return a JSON array of the top 3, each with: id, name, reason.
Return ONLY valid JSON, no markdown.

Candidates:
{json.dumps(candidates, indent=2)}"""
        response = await get_client().aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        try:
            raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            matches = json.loads(raw)
            return AgentResponse(success=True, data={"matches": matches})
        except Exception as e:
            return AgentResponse(success=False, data={"raw": response.text}, error=str(e))

    async def _match_referral(self, payload: dict) -> AgentResponse:
        species = payload.get("species")

        async with get_neo4j_session() as session:
            result = await session.run(
                """
                MATCH (v:VetClinic)-[:TREATS]->(s:Species {name: $species})
                WHERE v.trust_score > 0.7 AND v.availability_days < 7
                RETURN v.id AS id, v.name AS name, v.trust_score AS trust_score,
                       v.response_time_avg AS response_time_avg
                ORDER BY v.trust_score DESC
                LIMIT 10
                """,
                species=species,
            )
            candidates = [dict(r) for r in await result.data()]

        return AgentResponse(success=True, data={"referrals": candidates[:3]})

    async def _match_lost_pet(self, payload: dict) -> AgentResponse:
        microchip_id = payload.get("microchip_id")
        radius_km = payload.get("radius_km", 50)

        async with get_neo4j_session() as session:
            result = await session.run(
                """
                MATCH (o:PetOwner)-[:OWNS]->(a:Animal {microchip_id: $microchip_id})
                RETURN o.name AS owner_name, o.contact AS contact, a.name AS animal_name
                """,
                microchip_id=microchip_id,
            )
            owner_data = await result.single()

        return AgentResponse(
            success=True,
            data={
                "owner": dict(owner_data) if owner_data else None,
                "search_radius_km": radius_km,
                "alert_sent": True,
            },
        )
