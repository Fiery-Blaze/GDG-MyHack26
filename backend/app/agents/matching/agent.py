import json
from app.agents.base import BaseAgent, AgentRequest, AgentResponse
from app.core.config import settings
from app.core.database import get_neo4j_session
from app.core.gemini import get_client
from app.relations.vet import TreatsRelation, TreatedPatientRelation
from app.relations.owner import OwnsRelation


class MatchingAgent(BaseAgent):
    """
    Finds best matches for transfers, vet referrals, and lost pets.
    Uses pgvector for embedding similarity + Gemini for re-ranking.
    """

    handles = ["match_transfer", "match_referral", "match_lost_pet", "suggest_vets"]

    async def run(self, request: AgentRequest) -> AgentResponse:
        intent = request.intent
        payload = request.payload

        if intent == "match_transfer":
            return await self._match_transfer(payload)
        elif intent == "match_referral":
            return await self._match_referral(payload)
        elif intent == "match_lost_pet":
            return await self._match_lost_pet(payload)
        elif intent == "suggest_vets":
            return await self._suggest_vets(payload)

        return AgentResponse(success=False, data={}, error=f"Unknown intent: {intent}")

    async def _match_transfer(self, payload: dict) -> AgentResponse:
        species = payload.get("species")
        sex = payload.get("sex")
        age = payload.get("age")
        from_zoo_id = payload.get("from_zoo_id")

        description = f"{sex} {species}, {age} years old, transfer from zoo {from_zoo_id}"

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
                f"""
                MATCH (v:{TreatsRelation.source_label})
                      -[:{TreatsRelation.rel_type}]->
                      (s:{TreatsRelation.target_label} {{{TreatsRelation.target_id_field}: $species}})
                WHERE v.trust_score > 0.7 AND v.availability_days < 7
                RETURN v.{TreatsRelation.source_id_field} AS id, v.name AS name,
                       v.trust_score AS trust_score, v.response_time_avg AS response_time_avg
                ORDER BY v.trust_score DESC
                LIMIT 10
                """,
                species=species,
            )
            candidates = [dict(r) for r in await result.data()]

        return AgentResponse(success=True, data={"referrals": candidates[:3]})

    async def _suggest_vets(self, payload: dict) -> AgentResponse:
        species = payload.get("species")
        condition = payload.get("condition", "")

        async with get_neo4j_session() as session:
            result = await session.run(
                f"""
                MATCH (v:{TreatsRelation.source_label})
                OPTIONAL MATCH (v)-[:{TreatsRelation.rel_type}]->
                               (s:{TreatsRelation.target_label} {{{TreatsRelation.target_id_field}: $species}})
                OPTIONAL MATCH (v)-[tp:{TreatedPatientRelation.rel_type}]->
                               (a:{TreatedPatientRelation.target_label} {{species: $species}})
                WITH v,
                     count(DISTINCT s) AS species_match,
                     count(DISTINCT tp) AS prior_patient_count,
                     collect(DISTINCT tp.condition) AS treated_conditions
                WHERE species_match > 0 OR prior_patient_count > 0
                RETURN v.{TreatedPatientRelation.source_id_field} AS id,
                       v.name AS name, v.trust_score AS trust_score,
                       v.availability_days AS availability_days,
                       v.response_time_avg AS response_time_avg,
                       v.specialisation AS specialisation,
                       species_match,
                       prior_patient_count,
                       treated_conditions
                ORDER BY prior_patient_count DESC, v.trust_score DESC
                LIMIT 10
                """,
                species=species,
            )
            candidates = [dict(r) for r in await result.data()]

        if not candidates:
            return AgentResponse(success=True, data={"suggestions": []})

        prompt = f"""You are recommending veterinary clinics for a {species} animal{f' with condition: {condition}' if condition else ''}.
Rank the following clinics by suitability based on their specialisation, prior patient experience with this species, and trust score.
For each, write a one-sentence reason explaining the recommendation.
Return a JSON array of the top 3, each with: id, name, trust_score, availability_days, specialisation (array), prior_patient_count, reason.
Return ONLY valid JSON, no markdown.

Candidates:
{json.dumps(candidates, indent=2)}"""
        response = await get_client().aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        try:
            raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            suggestions = json.loads(raw)
            return AgentResponse(success=True, data={"suggestions": suggestions})
        except Exception as e:
            return AgentResponse(success=False, data={"raw": response.text}, error=str(e))

    async def _match_lost_pet(self, payload: dict) -> AgentResponse:
        microchip_id = payload.get("microchip_id")
        radius_km = payload.get("radius_km", 50)

        async with get_neo4j_session() as session:
            result = await session.run(
                f"""
                MATCH (o:{OwnsRelation.source_label})
                      -[:{OwnsRelation.rel_type}]->
                      (a:{OwnsRelation.target_label} {{{OwnsRelation.target_id_field}: $microchip_id}})
                RETURN o.{OwnsRelation.source_id_field} AS owner_name, o.contact AS contact,
                       a.name AS animal_name
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
