from app.agents.base import BaseAgent, AgentRequest, AgentResponse
from app.core.database import get_neo4j_session
from app.services.notifications import (
    generate_alert_message,
    get_default_recipients,
    notify_recipients,
)


class AlertAgent(BaseAgent):
    """
    Multi-channel notifications: email (Gmail) and SMS (Twilio).
    Gemini generates human-readable alert messages from structured event data.
    Also serves the alert_heatmap intent for the AlertCenter map view.
    """

    handles = ["alert_sla_breach", "alert_outbreak", "alert_regulatory", "alert_heatmap"]

    async def run(self, request: AgentRequest) -> AgentResponse:
        intent = request.intent
        payload = request.payload

        if intent == "alert_sla_breach":
            return await self._sla_breach(payload)
        elif intent == "alert_outbreak":
            return await self._zoonotic_outbreak(payload)
        elif intent == "alert_regulatory":
            return await self._regulatory_change(payload)
        elif intent == "alert_heatmap":
            return await self._heatmap_data()

        return AgentResponse(success=False, data={}, error=f"Unknown intent: {intent}")

    async def _sla_breach(self, payload: dict) -> AgentResponse:
        transfer_id = payload.get("transfer_id")
        recipients = payload.get("recipients") or get_default_recipients()
        message = await generate_alert_message(
            f"SLA missed for transfer {transfer_id}. Immediate action required."
        )
        subject = f"[ArkFlow] SLA Breach — Transfer #{transfer_id}"
        sent = await notify_recipients(recipients, subject, message)
        return AgentResponse(success=True, data={"sent": sent, "message": message})

    async def _zoonotic_outbreak(self, payload: dict) -> AgentResponse:
        disease = payload.get("disease")
        location = payload.get("location", "unknown location")
        species_affected = payload.get("species_affected", [])
        microchip_id = payload.get("microchip_id", "")
        recipients = payload.get("recipients") or get_default_recipients()

        raw = (
            f"{disease} detected"
            + (f" in {microchip_id}" if microchip_id else "")
            + f" near {location}. "
            f"Affects: {', '.join(species_affected) if species_affected else 'unknown species'}. "
            "Quarantine affected animals immediately and monitor for symptoms."
        )
        message = await generate_alert_message(raw)
        subject = f"[ArkFlow] Zoonotic Alert — {disease}"
        sent = await notify_recipients(recipients, subject, message)
        return AgentResponse(
            success=True, data={"alert_message": message, "sent": sent}
        )

    async def _heatmap_data(self) -> AgentResponse:
        """
        Returns zoonotic outbreak locations (by zoo) and vet clinic locations
        for the AlertCenter Google Maps heatmap.
        """
        async with get_neo4j_session() as session:
            # Zoonotic events grouped by zoo, weighted by outbreak count
            zoo_result = await session.run(
                """
                MATCH (a:Animal)-[:HAS_HEALTH_EVENT]->(h:HealthEvent)
                WHERE h.zoonotic_flag = true
                WITH a.zoo_id AS zoo_id, count(h) AS outbreak_count
                MATCH (z:Zoo {id: zoo_id})
                WHERE z.lat IS NOT NULL AND z.lng IS NOT NULL
                RETURN z.id AS id, z.name AS name,
                       z.lat AS lat, z.lng AS lng,
                       outbreak_count
                ORDER BY outbreak_count DESC
                """
            )
            zoo_rows = await zoo_result.data()

            # All vet clinics with coordinates
            vet_result = await session.run(
                """
                MATCH (v:VetClinic)
                WHERE v.lat IS NOT NULL AND v.lng IS NOT NULL
                RETURN v.id AS id, v.name AS name,
                       v.lat AS lat, v.lng AS lng,
                       v.trust_score AS trust_score,
                       v.specialisation AS specialisation
                """
            )
            vet_rows = await vet_result.data()

        return AgentResponse(
            success=True,
            data={
                "zoonotic_locations": zoo_rows,
                "vet_clinics": vet_rows,
            },
        )

    async def _regulatory_change(self, payload: dict) -> AgentResponse:
        change_summary = payload.get("summary", "")
        affected_blueprints = payload.get("affected_blueprint_ids", [])
        recipients = payload.get("recipients") or get_default_recipients()
        message = await generate_alert_message(
            f"Regulatory update detected: {change_summary}. "
            f"Affects {len(affected_blueprints)} active transfer(s)."
        )
        subject = "[ArkFlow] Regulatory Change Alert"
        sent = await notify_recipients(recipients, subject, message)
        return AgentResponse(
            success=True,
            data={"message": message, "affected_blueprints": affected_blueprints, "sent": sent},
        )
