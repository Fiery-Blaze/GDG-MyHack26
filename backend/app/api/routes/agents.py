from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.orchestrator import orchestrator
from app.agents.registry import registry

router = APIRouter(prefix="/agents", tags=["agents"])


class NaturalLanguageRequest(BaseModel):
    message: str
    context: dict | None = None


class DirectRequest(BaseModel):
    intent: str
    payload: dict
    context: dict | None = None


@router.post("/ask")
async def ask(body: NaturalLanguageRequest):
    """Natural language entry point — orchestrator classifies and routes."""
    response = await orchestrator.handle(body.message, context=body.context)
    if not response.success:
        raise HTTPException(status_code=400, detail=response.error)
    return response.to_dict()


@router.post("/run")
async def run_direct(body: DirectRequest):
    """Direct routing — caller specifies the intent explicitly."""
    response = await orchestrator.route(body.intent, body.payload, context=body.context)
    if not response.success:
        raise HTTPException(status_code=400, detail=response.error)
    return response.to_dict()


@router.get("/intents")
async def list_intents():
    """Returns all registered intent keys (useful for the frontend)."""
    return {"intents": registry.all_intents()}


@router.get("/health")
async def agent_health():
    """Returns health status for each registered agent."""
    return await registry.health()
