from __future__ import annotations
from typing import ClassVar, TYPE_CHECKING
from pydantic import BaseModel

if TYPE_CHECKING:
    from neo4j import AsyncSession


class Relation(BaseModel):
    """
    Base class for all typed graph relationships.

    Subclasses declare source/target node labels, the relationship type name,
    and which node property is the identifier for each side. The base provides
    create / merge / delete / query_from_source / query_from_target — agents
    call these instead of writing raw Cypher for edge operations.

    For complex queries that aggregate across multiple relation types, use the
    class-level constants (rel_type, source_label, target_label, etc.) as
    string references inside hand-written Cypher rather than duplicating magic
    strings.
    """

    source_label: ClassVar[str]
    target_label: ClassVar[str]
    rel_type: ClassVar[str]
    source_id_field: ClassVar[str] = "id"
    target_id_field: ClassVar[str] = "id"

    source_id: str
    target_id: str

    @classmethod
    def _edge_props(cls, instance: Relation) -> dict:
        return instance.model_dump(exclude={"source_id", "target_id"})

    @classmethod
    async def create(cls, source_id: str, target_id: str, session: AsyncSession, **props) -> Relation:
        inst = cls(source_id=source_id, target_id=target_id, **props)
        await session.run(
            f"MATCH (a:{cls.source_label} {{{cls.source_id_field}: $sid}})"
            f" MATCH (b:{cls.target_label} {{{cls.target_id_field}: $tid}})"
            f" CREATE (a)-[r:{cls.rel_type}]->(b) SET r = $props",
            sid=source_id,
            tid=target_id,
            props=cls._edge_props(inst),
        )
        return inst

    @classmethod
    async def merge(cls, source_id: str, target_id: str, session: AsyncSession, **props) -> Relation:
        """Upsert — creates the edge if absent, overwrites properties if present."""
        inst = cls(source_id=source_id, target_id=target_id, **props)
        await session.run(
            f"MATCH (a:{cls.source_label} {{{cls.source_id_field}: $sid}})"
            f" MATCH (b:{cls.target_label} {{{cls.target_id_field}: $tid}})"
            f" MERGE (a)-[r:{cls.rel_type}]->(b)"
            f" SET r = $props",
            sid=source_id,
            tid=target_id,
            props=cls._edge_props(inst),
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
