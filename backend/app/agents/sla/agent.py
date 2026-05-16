from datetime import datetime, timezone
from app.agents.base import BaseAgent, AgentRequest, AgentResponse
from app.core.database import get_pg_pool
from app.services.notifications import (
    generate_alert_message,
    get_default_recipients,
    notify_recipients,
)


class SLAAgent(BaseAgent):
    """
    Predicts transfer delay probability and monitors SLA deadlines.
    Uses a rule-based weighted score as the MVP fallback (swap for XGBoost later).
    On breach detection: updates sla_events in DB, then dispatches email/SMS alerts.
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
            return await self._monitor_all(payload)

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

    async def _monitor_all(self, payload: dict) -> AgentResponse:
        now = datetime.now(timezone.utc)
        recipients = payload.get("recipients") or get_default_recipients()

        pool = await get_pg_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, transfer_id, deadline, escalation_count, status
                FROM sla_events
                WHERE status NOT IN ('completed', 'missed')
                AND deadline < NOW() + INTERVAL '1 hour'
                """
            )

        notified = []
        skipped = []

        for row in rows:
            new_status = "missed" if row["deadline"] < now else "at_risk"

            async with pool.acquire() as conn:
                # Only update + notify if notified_at is still NULL (first alert only)
                updated = await conn.fetchval(
                    """
                    UPDATE sla_events
                    SET status           = $1,
                        escalation_count = escalation_count + 1,
                        notified_at      = NOW()
                    WHERE id = $2 AND notified_at IS NULL
                    RETURNING id
                    """,
                    new_status,
                    row["id"],
                )

            if updated is None:
                skipped.append({"sla_event_id": row["id"], "reason": "already_notified"})
                continue

            # Generate an AI-polished alert message and send it
            raw = (
                f"SLA {new_status} for transfer #{row['transfer_id']}. "
                f"Deadline was {row['deadline'].isoformat()}. "
                f"Escalation count: {row['escalation_count'] + 1}."
            )
            message = await generate_alert_message(raw)
            subject = f"[ArkFlow] SLA {new_status.upper()} — Transfer #{row['transfer_id']}"
            sent = await notify_recipients(recipients, subject, message)
            notified.append({
                "sla_event_id": row["id"],
                "transfer_id": row["transfer_id"],
                "new_status": new_status,
                "sent": sent,
            })

        return AgentResponse(
            success=True,
            data={
                "notified": notified,
                "skipped": skipped,
                "total_checked": len(rows),
            },
        )
