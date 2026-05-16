from typing import Type
from app.agents.base import BaseAgent


class AgentRegistry:
    """
    Maps intent strings to agent instances. To swap an agent, register a
    different class under the same intent key before the app starts.

    Example:
        registry.register(MyNewDocumentAgent)
    """

    def __init__(self):
        self._registry: dict[str, BaseAgent] = {}

    def register(self, agent_class: Type[BaseAgent]) -> None:
        instance = agent_class()
        for intent in agent_class.handles:
            self._registry[intent] = instance

    def get(self, intent: str) -> BaseAgent | None:
        return self._registry.get(intent)

    def all_intents(self) -> list[str]:
        return list(self._registry.keys())

    async def health(self) -> dict[str, bool]:
        seen: dict[str, bool] = {}
        for intent, agent in self._registry.items():
            name = agent.__class__.__name__
            if name not in seen:
                seen[name] = await agent.health_check()
        return seen


# Singleton — import this everywhere
registry = AgentRegistry()


def register_all_agents() -> None:
    """Import and register every agent. Called once at app startup."""
    from app.agents.document.agent import DocumentAgent
    from app.agents.matching.agent import MatchingAgent
    from app.agents.sla.agent import SLAAgent
    from app.agents.alert.agent import AlertAgent
    from app.agents.health.agent import HealthRecordAgent
    from app.agents.import_animal.agent import AnimalImportAgent

    for agent_class in [DocumentAgent, MatchingAgent, SLAAgent, AlertAgent, HealthRecordAgent, AnimalImportAgent]:
        registry.register(agent_class)
