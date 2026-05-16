from app.agents.base import AgentRequest, AgentResponse
from app.agents.registry import registry
from app.core.config import settings
from app.core.gemini import get_client

# Few-shot examples for intent classification
_INTENT_EXAMPLES = """
Examples:
- "I have a CITES permit PDF" -> document_cites
- "Upload blood test results" -> document_health_record
- "CITES approval email arrived" -> document_email_permit
- "Where should I send this tiger?" -> match_transfer
- "Find a specialist vet for my exotic bird" -> match_referral
- "My dog is lost, microchip 12345" -> match_lost_pet
- "Will this transfer be delayed?" -> sla_predict
- "Is my transfer on track?" -> sla_check
- "Send an alert about avian flu" -> alert_outbreak
- "SLA was missed on transfer 99" -> alert_sla_breach
- "New CITES regulation detected" -> alert_regulatory
- "Add a health record for animal 456" -> health_record
- "Show passport for microchip 789" -> health_passport
- "Sync health records from ZIMS" -> health_sync
"""


class Orchestrator:
    """
    Classifies incoming user requests and routes them to the correct agent
    via the registry. The LLM is only used for classification — all agent
    logic lives in the individual agent modules.
    """

    async def handle(self, user_input: str, context: dict | None = None) -> AgentResponse:
        intent = await self._classify(user_input)

        if intent == "unknown":
            return AgentResponse(
                success=False,
                data={"user_input": user_input},
                error="Could not classify intent. Please be more specific.",
            )

        agent = registry.get(intent)
        if agent is None:
            return AgentResponse(
                success=False,
                data={"intent": intent},
                error=f"No agent registered for intent '{intent}'.",
            )

        request = AgentRequest(intent=intent, payload={"user_input": user_input}, context=context)
        return await agent.run(request)

    async def route(self, intent: str, payload: dict, context: dict | None = None) -> AgentResponse:
        """Direct routing — skip classification when intent is known."""
        agent = registry.get(intent)
        if agent is None:
            return AgentResponse(
                success=False,
                data={"intent": intent},
                error=f"No agent registered for intent '{intent}'.",
            )
        request = AgentRequest(intent=intent, payload=payload, context=context)
        return await agent.run(request)

    async def _classify(self, user_input: str) -> str:
        known_intents = registry.all_intents()
        prompt = f"""Classify the user's message into exactly one of these intents:
{', '.join(known_intents)}

If none match with confidence, return "unknown".
Return ONLY the intent string, nothing else.

{_INTENT_EXAMPLES}

User message: "{user_input}"
Intent:"""
        response = await get_client().aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        intent = response.text.strip().lower().replace('"', "").replace("'", "")
        return intent if intent in known_intents else "unknown"


# Singleton
orchestrator = Orchestrator()
