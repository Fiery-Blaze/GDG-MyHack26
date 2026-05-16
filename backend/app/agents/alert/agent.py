from app.agents.base import BaseAgent, AgentRequest, AgentResponse
from app.services.notifications import (
    generate_alert_message,
    get_default_recipients,
    notify_recipients,
)


class AlertAgent(BaseAgent):
    """
    Multi-channel notifications: email (SendGrid) and SMS (Twilio).
    Gemini generates human-readable alert messages from structured event data.
    Actual send logic lives in app.services.notifications (async-safe).
    """

    handles = ["alert_sla_breach", "alert_outbreak", "alert_regulatory"]

    async def run(self, request: AgentRequest) -> AgentResponse:
        intent = request.intent
        payload = request.payload

        if intent == "alert_sla_breach":
            return await self._sla_breach(payload)
        elif intent == "alert_outbreak":
            return await self._zoonotic_outbreak(payload)
        elif intent == "alert_regulatory":
            return await self._regulatory_change(payload)

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
