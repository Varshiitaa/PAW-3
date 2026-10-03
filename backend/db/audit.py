import datetime
from sqlalchemy.orm import Session
from .models import AuditLog

def audit(db: Session, actor_id: int, action: str, entity_type: str, entity_id: str, before: dict = None, after: dict = None):
    """
    Helper function used by all future write endpoints to log systemic data changes.
    """
    try:
        log_entry = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            before=before,
            after=after,
            created_at=datetime.datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
        return log_entry
    except Exception as e:
        print(f"[AUDIT LOG WARNING] Failed to record audit log: {e}")
        db.rollback()
        return None
