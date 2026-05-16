from datetime import datetime, timezone
from app.agents.base import BaseAgent, AgentRequest, AgentResponse
from app.core.database import get_pg_pool, get_neo4j_session
from app.relations.animal import HasHealthEventRelation
from app.services.notifications import (
    generate_alert_message,
    get_default_recipients,
    notify_recipients,
)


class HealthRecordAgent(BaseAgent):
    """
    Maintains universal animal health passports across zoos, vets, and owners.
    Writes to PostgreSQL (records) and Neo4j (graph events).
    """

    handles = ["health_record", "health_passport", "health_sync"]

    async def run(self, request: AgentRequest) -> AgentResponse:
        intent = request.intent
        payload = request.payload

        if intent == "health_record":
            return await self._add_record(payload)
        elif intent == "health_passport":
            return await self._get_passport(payload)
        elif intent == "health_sync":
            return await self._sync(payload)

        return AgentResponse(success=False, data={}, error=f"Unknown intent: {intent}")

    async def _add_record(self, payload: dict) -> AgentResponse:
        required = ["microchip_id", "test_name", "result", "date", "vet_clinic"]
        missing = [f for f in required if f not in payload]
        if missing:
            return AgentResponse(
                success=False, data={}, error=f"Missing fields: {missing}"
            )

        pool = await get_pg_pool()
        async with pool.acquire() as conn:
            record_id = await conn.fetchval(
                """
                INSERT INTO health_records
                    (microchip_id, test_name, result, record_date, vet_clinic, zoonotic_flag, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
                """,
                payload["microchip_id"],
                payload["test_name"],
                payload["result"],
                payload["date"],
                payload["vet_clinic"],
                payload.get("zoonotic_flag", False),
                datetime.now(timezone.utc),
            )

        async with get_neo4j_session() as session:
            # Step 1 — create the HealthEvent node and update the animal's last check date.
            await session.run(
                f"""
                MATCH (a:{HasHealthEventRelation.source_label}
                      {{{HasHealthEventRelation.source_id_field}: $microchip_id}})
                CREATE (h:{HasHealthEventRelation.target_label} {{
                    {HasHealthEventRelation.target_id_field}: $record_id,
                    test_name: $test_name,
                    result: $result,
                    date: $date,
                    zoonotic_flag: $zoonotic_flag
                }})
                SET a.last_health_check = $date
                """,
                microchip_id=payload["microchip_id"],
                record_id=str(record_id),
                test_name=payload["test_name"],
                result=payload["result"],
                date=payload["date"],
                zoonotic_flag=payload.get("zoonotic_flag", False),
            )
            # Step 2 — create the typed, governed edge with relation_id + audit log.
            relation = await HasHealthEventRelation.create(
                source_id=payload["microchip_id"],
                target_id=str(record_id),
                session=session,
                created_by=payload.get("created_by", "system"),
            )

        zoonotic_flag = payload.get("zoonotic_flag", False)
        if zoonotic_flag:
            raw = (
                f"Zoonotic condition recorded for animal {payload['microchip_id']} "
                f"(test: {payload['test_name']}, result: {payload['result']}) "
                f"at {payload['vet_clinic']}. Immediate containment review required."
            )
            message = await generate_alert_message(raw)
            recipients = get_default_recipients()
            await notify_recipients(
                recipients,
                subject=f"[ArkFlow] Zoonotic Flag — {payload['microchip_id']}",
                message=message,
            )

        return AgentResponse(
            success=True,
            data={
                "record_id": record_id,
                "relation_id": relation.relation_id,
                "zoonotic_flag": zoonotic_flag,
            },
        )

    async def _get_passport(self, payload: dict) -> AgentResponse:
        microchip_id = payload.get("microchip_id")
        requester_role = payload.get("requester_role", "owner")

        pool = await get_pg_pool()
        async with pool.acquire() as conn:
            records = await conn.fetch(
                "SELECT * FROM health_records WHERE microchip_id = $1 ORDER BY record_date DESC",
                microchip_id,
            )

        async with get_neo4j_session() as session:
            result = await session.run(
                "MATCH (a:Animal {microchip_id: $microchip_id}) RETURN a",
                microchip_id=microchip_id,
            )
            graph_data = await result.single()

        passport = {
            "microchip_id": microchip_id,
            "health_records": [dict(r) for r in records],
            "transfers": [],
        }
        if graph_data:
            passport["animal"] = dict(graph_data["a"])

        # Scope data by requester role
        if requester_role == "public_health":
            passport = {"microchip_id": microchip_id, "record_count": len(records)}

        return AgentResponse(success=True, data=passport)

    async def _sync(self, payload: dict) -> AgentResponse:
        # Stub: in production, pull from ZIMS/VETport APIs
        return AgentResponse(
            success=True,
            data={"synced": 0, "message": "External sync not yet configured"},
        )
