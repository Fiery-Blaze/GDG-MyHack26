from app.relations.base import Relation, register


@register
class HasHealthEventRelation(Relation):
    """Links an animal to one of its health record events."""

    source_label = "Animal"
    target_label = "HealthEvent"
    rel_type = "HAS_HEALTH_EVENT"
    source_id_field = "microchip_id"
    target_id_field = "record_id"

    default_status = "active"


# TransferredRelation is intentionally absent: transfers are the source of truth
# in PostgreSQL (transfers table). Neo4j does not maintain Transfer nodes.
