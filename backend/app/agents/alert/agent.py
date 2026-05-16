import sendgrid
from sendgrid.helpers.mail import Mail
from twilio.rest import Client as TwilioClient
from app.agents.base import BaseAgent, AgentRequest, AgentResponse
from app.core.config import settings
from app.core.gemini import get_client


class AlertAgent(BaseAgent):
    """
    Multi-channel notifications: email (SendGrid), SMS (Twilio), push (Expo stub).
    Gemini generates human-readable alert messages from structured event data.
    """

    handles = ["alert_sla_breach", "alert_outbreak", "alert_regulatory"]

    def __init__(self):
        self._sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        self._twilio = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

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
        recipients = payload.get("recipients", [])
        message = await self._generate_message(
            f"SLA missed for transfer {transfer_id}. Immediate action required."
        )
        sent = []
        for r in recipients:
            if r.get("email"):
                self._send_email(r["email"], "SLA Breach Alert — ArkFlow", message)
                sent.append({"channel": "email", "to": r["email"]})
            if r.get("phone"):
                self._send_sms(r["phone"], message)
                sent.append({"channel": "sms", "to": r["phone"]})
        return AgentResponse(success=True, data={"sent": sent, "message": message})

    async def _zoonotic_outbreak(self, payload: dict) -> AgentResponse:
        disease = payload.get("disease")
        location = payload.get("location")
        species_affected = payload.get("species_affected", [])
        raw = (
            f"{disease} detected near {location}. "
            f"Affects: {', '.join(species_affected)}. "
            "Quarantine affected animals immediately and monitor for symptoms."
        )
        message = await self._generate_message(raw)
        return AgentResponse(success=True, data={"alert_message": message})

    async def _regulatory_change(self, payload: dict) -> AgentResponse:
        change_summary = payload.get("summary", "")
        affected_blueprints = payload.get("affected_blueprint_ids", [])
        message = await self._generate_message(
            f"Regulatory update detected: {change_summary}. "
            f"Affects {len(affected_blueprints)} active transfer(s)."
        )
        return AgentResponse(
            success=True,
            data={"message": message, "affected_blueprints": affected_blueprints},
        )

    async def _generate_message(self, raw: str) -> str:
        prompt = f"Rewrite this alert as a clear, concise 2-sentence notification for a zoo coordinator:\n{raw}"
        response = await get_client().aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        return response.text.strip()

    def _send_email(self, to: str, subject: str, body: str) -> None:
        message = Mail(
            from_email=settings.SENDGRID_FROM_EMAIL,
            to_emails=to,
            subject=subject,
            plain_text_content=body,
        )
        self._sg.send(message)

    def _send_sms(self, to: str, body: str) -> None:
        self._twilio.messages.create(
            body=body,
            from_=settings.TWILIO_FROM_NUMBER,
            to=to,
        )
