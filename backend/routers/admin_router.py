from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User, Organisation, AuditLog
from db.audit import audit
from utils.auth import require_role

admin_router = APIRouter(prefix="/api/admin", tags=["Admin Portal Control Center"])

class UserUpdateSchema(BaseModel):
    status: Optional[str] = None  # active | pending | suspended
    role: Optional[str] = None    # citizen | volunteer | ngo_staff | govt_official | admin
    organisation_id: Optional[int] = None

class OrgUpdateSchema(BaseModel):
    verified: Optional[bool] = None
    name: Optional[str] = None
    city: Optional[str] = None


@admin_router.get("/users")
def list_admin_users(
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    organisation_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    if organisation_id:
        query = query.filter(User.organisation_id == organisation_id)

    users = query.order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        org_name = None
        if u.organisation_id:
            org = db.query(Organisation).filter(Organisation.id == u.organisation_id).first()
            if org: org_name = org.name

        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "role": u.role,
            "status": u.status,
            "organisation_id": u.organisation_id,
            "organisation_name": org_name,
            "city": u.city,
            "state": u.state,
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else None
        })
    return result


@admin_router.patch("/users/{user_id}")
def update_user_status_role(
    user_id: int,
    payload: UserUpdateSchema,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    before_state = {"status": user.status, "role": user.role, "organisation_id": user.organisation_id}

    if payload.status is not None:
        user.status = payload.status
    if payload.role is not None:
        user.role = payload.role
    if payload.organisation_id is not None:
        user.organisation_id = payload.organisation_id

    db.commit()
    db.refresh(user)

    audit(
        db=db,
        actor_id=admin_user.id,
        action="update_user_admin",
        entity_type="user",
        entity_id=user.id,
        before=before_state,
        after={"status": user.status, "role": user.role, "organisation_id": user.organisation_id}
    )

    return {"success": True, "message": f"User {user.username} updated successfully.", "user": user}


@admin_router.get("/organisations")
def list_admin_organisations(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    orgs = db.query(Organisation).order_by(Organisation.created_at.desc()).all()
    return orgs


@admin_router.patch("/organisations/{org_id}")
def update_organisation(
    org_id: int,
    payload: OrgUpdateSchema,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found.")

    before_state = {"verified": org.verified, "name": org.name}

    if payload.verified is not None: org.verified = payload.verified
    if payload.name is not None: org.name = payload.name
    if payload.city is not None: org.city = payload.city

    db.commit()
    db.refresh(org)

    audit(
        db=db,
        actor_id=admin_user.id,
        action="update_organisation_admin",
        entity_type="organisation",
        entity_id=org.id,
        before=before_state,
        after={"verified": org.verified, "name": org.name}
    )

    return {"success": True, "message": f"Organisation {org.name} updated.", "organisation": org}


@admin_router.get("/audit-log")
def get_admin_audit_logs(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    actor_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if actor_id:
        query = query.filter(AuditLog.actor_id == actor_id)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    result = []
    for l in logs:
        actor_name = None
        if l.actor_id:
            usr = db.query(User).filter(User.id == l.actor_id).first()
            if usr: actor_name = usr.full_name or usr.username
        result.append({
            "id": l.id,
            "actor_id": l.actor_id,
            "actor_name": actor_name,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "before": l.before,
            "after": l.after,
            "created_at": l.created_at.isoformat() if l.created_at else None
        })
    return result
