from app.relations.base import Relation, register


@register
class HasHealthEventRelation(Relation):
    """Links an animal to one of its health record events."""

    source_label = "Animal"
    target_label = "HealthEvent"
    rel_type = "HAS_HEALTH_EVENT"
    source_id_field = "microchip_id"
    target_id_field = "record_id"


@register
class TransferredRelation(Relation):
    """Records that an animal was involved in a transfer."""

    source_label = "Animal"
    target_label = "Transfer"
    rel_type = "TRANSFERRED"
    source_id_field = "microchip_id"
    target_id_field = "id"
