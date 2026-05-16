import json
from app.agents.base import BaseAgent, AgentRequest, AgentResponse
from app.core.config import settings
from app.core.gemini import get_client


class DocumentAgent(BaseAgent):
    """
    Extracts structured data from CITES permits and vet health records
    using Google Document AI (OCR) + Gemini (JSON extraction).
    """

    handles = ["document_cites", "document_health_record", "document_email_permit"]

    async def run(self, request: AgentRequest) -> AgentResponse:
        intent = request.intent
        payload = request.payload

        if intent == "document_cites":
            return await self._extract_cites_permit(payload)
        elif intent == "document_health_record":
            return await self._extract_health_record(payload)
        elif intent == "document_email_permit":
            return await self._extract_email_permit(payload)

        return AgentResponse(success=False, data={}, error=f"Unknown intent: {intent}")

    async def _extract_cites_permit(self, payload: dict) -> AgentResponse:
        text = payload.get("text", "")
        prompt = f"""Extract the following fields from this CITES permit as JSON.
Fields: permit_number, species, quantity, origin_country, destination_country, expiry_date, permit_type (I/II/III).
Return ONLY valid JSON, no markdown.

Document:
{text}"""
        return await self._generate_json(prompt)

    async def _extract_health_record(self, payload: dict) -> AgentResponse:
        text = payload.get("text", "")
        prompt = f"""Extract the following fields from this veterinary health record as JSON.
Fields: microchip_id, animal_name, species, test_name, result, date, vet_clinic, zoonotic_flag (true/false).
Return ONLY valid JSON, no markdown.

Document:
{text}"""
        return await self._generate_json(prompt)

    async def _extract_email_permit(self, payload: dict) -> AgentResponse:
        text = payload.get("text", "")
        prompt = f"""Extract the following fields from this CITES approval email as JSON.
Fields: permit_number, expiry_date, species, approval_status.
Return ONLY valid JSON, no markdown.

Email:
{text}"""
        return await self._generate_json(prompt)

    async def _generate_json(self, prompt: str) -> AgentResponse:
        response = await get_client().aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        try:
            # Strip markdown fences if Gemini wraps the JSON
            raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(raw)
            return AgentResponse(success=True, data=data)
        except Exception as e:
            return AgentResponse(success=False, data={"raw": response.text}, error=str(e))
