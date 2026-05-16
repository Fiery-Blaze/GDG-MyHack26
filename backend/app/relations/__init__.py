from app.relations.base import Relation, RelationRegistry, relation_registry, register  # noqa: F401

# Import all domain modules so their @register decorators fire at startup.
import app.relations.vet  # noqa: F401
import app.relations.animal  # noqa: F401
import app.relations.owner  # noqa: F401
