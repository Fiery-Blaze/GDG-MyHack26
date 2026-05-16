from datetime import datetime, timezone
from app.agents.base import BaseAgent, AgentRequest, AgentResponse
from app.core.database import get_pg_pool


class SLAAgent(BaseAgent):
    """
    Predicts transfer delay probability and monitors SLA deadlines.
    Uses a rule-based weighted score as the MVP fallback (swap for XGBoost later).
    """

    handles = ["sla_predict", "sla_check", "sla_monitor"]

    async def run(self, request: AgentRequest) -> AgentResponse:
        intent = request.intent
        payload = request.payload

        if intent == "sla_predict":
            return await self._predict(payload)
        elif intent == "sla_check":
            return await self._check(payload)
        elif intent == "sla_monitor":
            return await self._monitor_all()

        return AgentResponse(success=False, data={}, error=f"Unknown intent: {intent}")

    async def _predict(self, payload: dict) -> AgentResponse:
        score = self._rule_based_score(payload)
        high_risk = score > 0.6
        result = {
            "delay_probability": round(score, 3),
            "high_risk": high_risk,
            "risk_factors": self._explain(payload),
        }
        if high_risk:
            result["mitigations"] = [
                "Expedite permit processing",
                "Consider alternative transport route",
                "Pre-arrange quarantine facilities",
            ]
        return AgentResponse(success=True, data=result)

    def _rule_based_score(self, p: dict) -> float:
        distance_km = p.get("distance_km", 0)
        cites_level = p.get("cites_level", 3)  # I=1, II=2, III=3
        num_permits = p.get("num_permits", 1)
        quarantine_days = p.get("quarantine_days", 7)
        past_delays = p.get("past_delays_on_route", 0)

        distance_weight = min(distance_km / 10000, 1.0) * 0.3
        permits_weight = min(num_permits / 5, 1.0) * 0.2
        cites_weight = (1 if cites_level == 1 else 0.5 if cites_level == 2 else 0.1) * 0.3
        quarantine_weight = min(quarantine_days / 30, 1.0) * 0.1
        delay_weight = min(past_delays / 5, 1.0) * 0.1

        raw = distance_weight + permits_weight + cites_weight + quarantine_weight + delay_weight
        return max(0.05, min(0.95, raw))

    def _explain(self, p: dict) -> list[str]:
        factors = []
        if p.get("distance_km", 0) > 5000:
            factors.append("Long-distance transport")
        if p.get("cites_level") == 1:
            factors.append("CITES Appendix I species — strict permit requirements")
        if p.get("num_permits", 1) > 2:
            factors.append("Multiple permits required")
        if p.get("past_delays_on_route", 0) > 2:
            factors.append("History of delays on this route")
        return factors

    async def _check(self, payload: dict) -> AgentResponse:
        transfer_id = payload.get("transfer_id")
        pool = await get_pg_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM transfers WHERE id = $1", transfer_id
            )
        if not row:
            return AgentResponse(success=False, data={}, error="Transfer not found")
        return AgentResponse(success=True, data=dict(row))

    async def _monitor_all(self) -> AgentResponse:
        now = datetime.now(timezone.utc)
        pool = await get_pg_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, deadline, escalation_count, status
                FROM sla_events
                WHERE status NOT IN ('completed', 'missed')
                AND deadline < NOW() + INTERVAL '1 hour'
                """
            )
        updates = []
        for row in rows:
            record = dict(row)
            if row["deadline"] < now:
                record["new_status"] = "missed"
            else:
                record["new_status"] = "at_risk"
            updates.append(record)
        return AgentResponse(success=True, data={"events": updates, "count": len(updates)})
