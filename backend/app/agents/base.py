from abc import ABC, abstractmethod
from typing import Any


class AgentRequest:
    def __init__(self, intent: str, payload: dict[str, Any], context: dict[str, Any] | None = None):
        self.intent = intent
        self.payload = payload
        self.context = context or {}


class AgentResponse:
    def __init__(self, success: bool, data: dict[str, Any], error: str | None = None):
        self.success = success
        self.data = data
        self.error = error

    def to_dict(self) -> dict:
        return {"success": self.success, "data": self.data, "error": self.error}


class BaseAgent(ABC):
    """
    All agents implement this interface. Swap any agent by registering a new
    class that inherits BaseAgent under the same intent key.
    """

    # Declare which intent strings this agent handles
    handles: list[str] = []

    @abstractmethod
    async def run(self, request: AgentRequest) -> AgentResponse:
        """Execute the agent's primary workflow."""
        ...

    async def health_check(self) -> bool:
        """Return False if the agent's dependencies are unavailable."""
        return True
