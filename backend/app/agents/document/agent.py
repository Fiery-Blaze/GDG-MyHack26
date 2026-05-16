import asyncio
import base64
import json
from google.cloud import documentai_v1 as documentai
from app.agents.base import BaseAgent, AgentRequest, AgentResponse
from app.core.config import settings
from app.core.gemini import get_client


def _get_text(element, document: documentai.Document) -> str:
    """Pull the raw text for a DocumentAI layout element from the full document text."""
    text = ""
    for seg in element.text_anchor.text_segments:
        text += document.text[int(seg.start_index): int(seg.end_index)]
    return text.strip()


def _extract_form_fields(document: documentai.Document) -> dict[str, str]:
    fields: dict[str, str] = {}
    for page in document.pages:
        for field in page.form_fields:
            key = _get_text(field.field_name, document)
            value = _get_text(field.field_value, document)
            if key:
                fields[key] = value
    return fields


def _run_form_parser(document_bytes: bytes, mime_type: str) -> tuple[str, dict]:
    """
    Synchronous Document AI call (wrapped in asyncio.to_thread by callers).
    Returns (full_text, form_fields_dict).
    """
    client = documentai.DocumentProcessorServiceClient()
    name = client.processor_path(
        settings.GCP_PROJECT_ID,
        settings.DOCUMENT_AI_LOCATION,
        settings.DOCUMENT_AI_FORM_PARSER_ID,
    )
    result = client.process_document(
        request=documentai.ProcessRequest(
            name=name,
            raw_document=documentai.RawDocument(content=document_bytes, mime_type=mime_type),
        )
    )
    doc = result.document
    return doc.text, _extract_form_fields(doc)


class DocumentAgent(BaseAgent):
    """
    Extracts structured data from CITES permits and vet health records.

    Two extraction paths:
      1. File upload  — payload contains document_base64 + mime_type.
                        Document AI Form Parser runs first (OCR + key-value extraction),
                        then Gemini normalises the output into the target JSON schema.
      2. Text paste   — payload contains text only.
                        Gemini extracts directly (legacy path, no Document AI call).
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

    # ── Document AI helpers ──────────────────────────────────────────────────

    async def _docai_context(self, payload: dict) -> str:
        """
        If the payload has a base64 document, run Form Parser and return a
        combined context string (form fields + raw text) for Gemini.
        Returns an empty string if no document is present.
        """
        doc_b64 = payload.get("document_base64")
        if not doc_b64:
            return ""

        mime_type = payload.get("mime_type", "application/pdf")
        doc_bytes = base64.b64decode(doc_b64)

        full_text, form_fields = await asyncio.to_thread(
            _run_form_parser, doc_bytes, mime_type
        )

        fields_block = "\n".join(f"  {k}: {v}" for k, v in form_fields.items())
        return (
            f"[Document AI extracted form fields]\n{fields_block}\n\n"
            f"[Full document text]\n{full_text}"
        )

    # ── Intent handlers ──────────────────────────────────────────────────────

    async def _extract_cites_permit(self, payload: dict) -> AgentResponse:
        docai_ctx = await self._docai_context(payload)
        source = docai_ctx or payload.get("text", "")
        prompt = f"""Extract the following fields from this CITES permit as JSON.
Fields: permit_number, species, quantity, origin_country, destination_country, expiry_date, permit_type (I/II/III).
Return ONLY valid JSON, no markdown.

Document:
{source}"""
        return await self._generate_json(prompt, used_docai=bool(docai_ctx))

    async def _extract_health_record(self, payload: dict) -> AgentResponse:
        docai_ctx = await self._docai_context(payload)
        source = docai_ctx or payload.get("text", "")
        prompt = f"""Extract the following fields from this veterinary health record as JSON.
Fields: microchip_id, animal_name, species, test_name, result, date, vet_clinic, zoonotic_flag (true/false).
Return ONLY valid JSON, no markdown.

Document:
{source}"""
        return await self._generate_json(prompt, used_docai=bool(docai_ctx))

    async def _extract_email_permit(self, payload: dict) -> AgentResponse:
        text = payload.get("text", "")
        prompt = f"""Extract the following fields from this CITES approval email as JSON.
Fields: permit_number, expiry_date, species, approval_status.
Return ONLY valid JSON, no markdown.

Email:
{text}"""
        return await self._generate_json(prompt, used_docai=False)

    async def _generate_json(self, prompt: str, *, used_docai: bool) -> AgentResponse:
        response = await get_client().aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        try:
            raw = (
                response.text.strip()
                .removeprefix("```json")
                .removeprefix("```")
                .removesuffix("```")
                .strip()
            )
            data = json.loads(raw)
            data["_extraction_method"] = "docai+gemini" if used_docai else "gemini"
            return AgentResponse(success=True, data=data)
        except Exception as e:
            return AgentResponse(
                success=False, data={"raw": response.text}, error=str(e)
            )
