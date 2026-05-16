from app.relations.base import Relation, register


@register
class TreatsRelation(Relation):
    """A vet clinic's declared specialisation in a species."""

    source_label = "VetClinic"
    target_label = "Species"
    rel_type = "TREATS"
    source_id_field = "id"
    target_id_field = "name"

    default_status = "active"
    # Specialisation is either active or retired — no intermediate states.
    allowed_transitions = {"active": ["retired"]}


@register
class TreatedPatientRelation(Relation):
    """A historical treatment event — a vet clinic treated a specific animal."""

    source_label = "VetClinic"
    target_label = "Animal"
    rel_type = "TREATED_PATIENT"
    source_id_field = "id"
    target_id_field = "microchip_id"

    default_status = "active"
    # Treatment is recorded then closed; no reversal.
    allowed_transitions = {"active": ["completed"]}

    date: str
    condition: str
    outcome: str
