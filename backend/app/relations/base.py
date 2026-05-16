from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import ClassVar, TYPE_CHECKING
from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from neo4j import AsyncSession


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Relation(BaseModel):
    """
    Base class for all typed graph relationships.

    Every relation instance is individually addressable via relation_id (UUID)
    and has an explicit lifecycle (status). Governance fields (created_by,
    approved_by) record authorship. Every status transition is appended to the
    relation_audit_log PostgreSQL table so history is never lost.

    Subclasses declare:
        - source_label / target_label / rel_type         — graph schema
        - source_id_field / target_id_field              — identifier properties
        - default_status                                  — initial status on create
        - allowed_transitions                             — {from: [allowed_to, ...]}
          An empty dict means no restrictions on transitions.

    For complex aggregation queries, use the class-level constants as string
    references inside hand-written Cypher rather than duplicating magic strings.
    """

    # ── graph schema (ClassVar — not stored as instance fields) ──────────────
    source_label: ClassVar[str]
    target_label: ClassVar[str]
    rel_type: ClassVar[str]
    source_id_field: ClassVar[str] = "id"
    target_id_field: ClassVar[str] = "id"

    # ── lifecycle ─────────────────────────────────────────────────────────────
    default_status: ClassVar[str] = "active"
    # Maps each status to the list of statuses it may transition into.
    # Empty dict = no restrictions enforced by the base class.
    allowed_transitions: ClassVar[dict[str, list[str]]] = {}

    # ── instance fields ───────────────────────────────────────────────────────
    source_id: str
    target_id: str

    relation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = ""           # set to default_status by create(); empty = not yet persisted
    created_by: str = "system"
    approved_by: str | None = None
    created_at: str = Field(default_factory=_now_iso)

    # ── internal helpers ──────────────────────────────────────────────────────

    @classmethod
    def _edge_props(cls, instance: Relation) -> dict:
        """All fields that should be stored as Neo4j edge properties."""
        return instance.model_dump(exclude={"source_id", "target_id"})

    @classmethod
    def _validate_transition(cls, current: str, new: str) -> None:
        if not cls.allowed_transitions:
            return  # no restrictions defined
        allowed = cls.allowed_transitions.get(current, [])
        if new not in allowed:
            raise ValueError(
                f"Transition '{current}' → '{new}' is not allowed for {cls.rel_type}. "
                f"Allowed from '{current}': {allowed}"
            )

    # ── write operations ──────────────────────────────────────────────────────

    @classmethod
    async def create(
        cls,
        source_id: str,
        target_id: str,
        session: AsyncSession,
        created_by: str = "system",
        **props,
    ) -> Relation:
        """
        Create a new relation instance. Always produces a fresh relation_id so
        repeated calls between the same nodes accumulate history rather than
        overwriting it.
        """
        inst = cls(
            source_id=source_id,
            target_id=target_id,
            status=cls.default_status,
            created_by=created_by,
            **props,
        )
        await session.run(
            f"MATCH (a:{cls.source_label} {{{cls.source_id_field}: $sid}})"
            f" MATCH (b:{cls.target_label} {{{cls.target_id_field}: $tid}})"
            f" CREATE (a)-[r:{cls.rel_type}]->(b) SET r = $props",
            sid=source_id,
            tid=target_id,
            props=cls._edge_props(inst),
        )
        await cls._log_transition(
            inst.relation_id, cls.rel_type, None, inst.status, created_by, None
        )
        return inst

    @classmethod
    async def merge(
        cls,
        source_id: str,
        target_id: str,
        session: AsyncSession,
        created_by: str = "system",
        **props,
    ) -> Relation:
        """
        Upsert by source+target. Used for seed data and bulk imports where
        re-running should not duplicate edges. On first write, a fresh
        relation_id and governance fields are set. On subsequent writes only
        non-identity props are updated; the original relation_id is preserved.
        """
        inst = cls(
            source_id=source_id,
            target_id=target_id,
            status=cls.default_status,
            created_by=created_by,
            **props,
        )
        edge_props = cls._edge_props(inst)
        await session.run(
            f"MATCH (a:{cls.source_label} {{{cls.source_id_field}: $sid}})"
            f" MATCH (b:{cls.target_label} {{{cls.target_id_field}: $tid}})"
            f" MERGE (a)-[r:{cls.rel_type}]->(b)"
            f" ON CREATE SET r = $props"
            f" ON MATCH SET r.status = $status, r.created_by = $created_by",
            sid=source_id,
            tid=target_id,
            props=edge_props,
            status=inst.status,
            created_by=created_by,
        )
        return inst

    @classmethod
    async def delete(cls, source_id: str, target_id: str, session: AsyncSession) -> None:
        await session.run(
            f"MATCH (a:{cls.source_label} {{{cls.source_id_field}: $sid}})"
            f" -[r:{cls.rel_type}]->"
            f" (b:{cls.target_label} {{{cls.target_id_field}: $tid}})"
            f" DELETE r",
            sid=source_id,
            tid=target_id,
        )

    # ── lifecycle operations ──────────────────────────────────────────────────

    @classmethod
    async def update_status(
        cls,
        relation_id: str,
        new_status: str,
        actor: str,
        session: AsyncSession,
        reason: str | None = None,
    ) -> None:
        """
        Advance a relation's lifecycle state. Validates the transition against
        allowed_transitions, updates Neo4j, then appends to the audit log.
        """
        result = await session.run(
            f"MATCH ()-[r:{cls.rel_type} {{relation_id: $rid}}]->()"
            f" RETURN r.status AS current_status",
            rid=relation_id,
        )
        row = await result.single()
        if not row:
            raise ValueError(f"Relation '{relation_id}' not found for type {cls.rel_type}.")

        current = row["current_status"]
        cls._validate_transition(current, new_status)

        await session.run(
            f"MATCH ()-[r:{cls.rel_type} {{relation_id: $rid}}]->()"
            f" SET r.status = $status",
            rid=relation_id,
            status=new_status,
        )
        await cls._log_transition(relation_id, cls.rel_type, current, new_status, actor, reason)

    @classmethod
    async def approve(
        cls,
        relation_id: str,
        approver_id: str,
        session: AsyncSession,
    ) -> None:
        """Transition pending → active and record the approver."""
        await cls.update_status(relation_id, "active", approver_id, session)
        await session.run(
            f"MATCH ()-[r:{cls.rel_type} {{relation_id: $rid}}]->()"
            f" SET r.approved_by = $approver",
            rid=relation_id,
            approver=approver_id,
        )

    @classmethod
    async def reject(
        cls,
        relation_id: str,
        actor: str,
        reason: str,
        session: AsyncSession,
    ) -> None:
        """Transition pending → rejected with a mandatory reason."""
        await cls.update_status(relation_id, "rejected", actor, session, reason=reason)

    # ── read operations ───────────────────────────────────────────────────────

    @classmethod
    async def get_by_id(cls, relation_id: str, session: AsyncSession) -> Relation | None:
        """Fetch a specific relation instance by its UUID."""
        result = await session.run(
            f"MATCH (a:{cls.source_label})"
            f" -[r:{cls.rel_type} {{relation_id: $rid}}]->"
            f" (b:{cls.target_label})"
            f" RETURN a.{cls.source_id_field} AS source_id,"
            f"        b.{cls.target_id_field} AS target_id,"
            f"        properties(r) AS props",
            rid=relation_id,
        )
        row = await result.single()
        if not row:
            return None
        return cls(source_id=row["source_id"], target_id=row["target_id"], **(row["props"] or {}))

    @classmethod
    async def query_from_source(cls, source_id: str, session: AsyncSession) -> list[Relation]:
        result = await session.run(
            f"MATCH (a:{cls.source_label} {{{cls.source_id_field}: $sid}})"
            f" -[r:{cls.rel_type}]->"
            f" (b:{cls.target_label})"
            f" RETURN b.{cls.target_id_field} AS target_id, properties(r) AS props",
            sid=source_id,
        )
        rows = await result.data()
        return [
            cls(source_id=source_id, target_id=row["target_id"], **(row["props"] or {}))
            for row in rows
        ]

    @classmethod
    async def query_from_target(cls, target_id: str, session: AsyncSession) -> list[Relation]:
        result = await session.run(
            f"MATCH (a:{cls.source_label})"
            f" -[r:{cls.rel_type}]->"
            f" (b:{cls.target_label} {{{cls.target_id_field}: $tid}})"
            f" RETURN a.{cls.source_id_field} AS source_id, properties(r) AS props",
            tid=target_id,
        )
        rows = await result.data()
        return [
            cls(source_id=row["source_id"], target_id=target_id, **(row["props"] or {}))
            for row in rows
        ]

    # ── audit log ─────────────────────────────────────────────────────────────

    @staticmethod
    async def _log_transition(
        relation_id: str,
        rel_type: str,
        from_status: str | None,
        to_status: str,
        actor: str,
        reason: str | None,
    ) -> None:
        # Imported here to avoid circular imports at module load time.
        from app.core.database import get_pg_pool

        pool = await get_pg_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO relation_audit_log
                    (relation_id, rel_type, from_status, to_status, actor, reason)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                relation_id,
                rel_type,
                from_status,
                to_status,
                actor,
                reason,
            )


# ── registry ──────────────────────────────────────────────────────────────────

class RelationRegistry:
    """Maps rel_type strings to Relation subclasses. Populated via @register."""

    def __init__(self) -> None:
        self._registry: dict[str, type[Relation]] = {}

    def register(self, cls: type[Relation]) -> type[Relation]:
        self._registry[cls.rel_type] = cls
        return cls

    def get(self, rel_type: str) -> type[Relation] | None:
        return self._registry.get(rel_type)

    def all(self) -> dict[str, type[Relation]]:
        return dict(self._registry)

    def __contains__(self, rel_type: str) -> bool:
        return rel_type in self._registry


relation_registry = RelationRegistry()


def register(cls: type[Relation]) -> type[Relation]:
    """Class decorator — registers the relation and returns it unchanged."""
    return relation_registry.register(cls)
