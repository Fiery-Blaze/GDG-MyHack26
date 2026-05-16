from app.relations.base import Relation, register


@register
class OwnsRelation(Relation):
    """A pet owner's ownership of an animal."""

    source_label = "PetOwner"
    target_label = "Animal"
    rel_type = "OWNS"
    source_id_field = "name"
    target_id_field = "microchip_id"

    default_status = "active"
    # Ownership ends when the animal is transferred to another owner or deceased.
    allowed_transitions = {"active": ["transferred", "deceased"]}
