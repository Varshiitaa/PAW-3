import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Body, Query, status
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Contact, User
from db.audit import audit
from utils.auth import get_current_user, require_role

contacts_router = APIRouter(prefix="/api/contacts", tags=["Emergency Contacts & Help Directory"])

# 1. LIST CONTACTS (Filters: type, service, state, city, is_24x7, q)
@contacts_router.get("/")
def list_contacts(
    type: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    is_24x7: Optional[bool] = Query(None),
    verified_only: Optional[bool] = Query(False),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Contact)

    if type:
        query = query.filter(Contact.type == type)

    if state:
        query = query.filter(Contact.state.ilike(f"%{state}%"))

    if city:
        query = query.filter(Contact.city.ilike(f"%{city}%"))

    if is_24x7 is not None:
        query = query.filter(Contact.is_24x7 == is_24x7)

    if verified_only:
        query = query.filter(Contact.verified == True)

    if q:
        pattern = f"%{q}%"
        query = query.filter(
            (Contact.name.ilike(pattern)) |
            (Contact.city.ilike(pattern)) |
            (Contact.phone.ilike(pattern)) |
            (Contact.type.ilike(pattern))
        )

    contacts = query.order_by(Contact.verified.desc(), Contact.name.asc()).all()

    # Filter in memory for JSON service array if specified
    if service:
        service_lower = service.lower()
        filtered = []
        for c in contacts:
            srv_list = c.services or []
            if any(service_lower in s.lower() for s in srv_list):
                filtered.append(c)
        contacts = filtered

    result = []
    for c in contacts:
        result.append({
            "id": c.id,
            "name": c.name,
            "type": c.type,
            "phone": c.phone,
            "email": c.email,
            "website": c.website,
            "group_link": c.group_link,
            "city": c.city or "Bengaluru",
            "state": c.state or "Karnataka",
            "services": c.services or [],
            "hours": c.hours or "Contact for timings",
            "is_24x7": c.is_24x7 or False,
            "verified": c.verified or False,
            "last_verified_at": c.last_verified_at.isoformat() if c.last_verified_at else None,
            "added_by": c.added_by
        })
    return result

# 2. SUGGEST A CONTACT (Any logged in user)
@contacts_router.post("/suggest")
def suggest_contact(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    name = data.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Organization name is required.")

    new_contact = Contact(
        name=name,
        type=data.get("type", "Helpline"),
        phone=data.get("phone"),
        email=data.get("email"),
        website=data.get("website"),
        group_link=data.get("group_link"),
        city=data.get("city", current_user.city or "Bengaluru"),
        state=data.get("state", current_user.state or "Karnataka"),
        services=data.get("services", ["Animal Help"]),
        hours=data.get("hours", "Standard hours"),
        is_24x7=data.get("is_24x7", False),
        verified=False,  # Moderation queue: starts unverified
        added_by=current_user.id
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)

    audit(
        db=db,
        actor_id=current_user.id,
        action="suggest_contact",
        entity_type="contact",
        entity_id=str(new_contact.id),
        before=None,
        after={"name": new_contact.name, "verified": False}
    )

    return {
        "message": "Contact suggested successfully and queued for verification.",
        "contact_id": new_contact.id,
        "verified": False
    }

# 3. ADMIN/NGO CREATE CONTACT
@contacts_router.post("/")
def create_contact_admin(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin", "ngo_staff", "govt_official"]))
):
    name = data.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Name required")

    cnt = Contact(
        name=name,
        type=data.get("type", "Helpline"),
        phone=data.get("phone"),
        email=data.get("email"),
        website=data.get("website"),
        group_link=data.get("group_link"),
        city=data.get("city", "Bengaluru"),
        state=data.get("state", "Karnataka"),
        services=data.get("services", []),
        hours=data.get("hours"),
        is_24x7=data.get("is_24x7", False),
        verified=data.get("verified", True),
        last_verified_at=datetime.datetime.utcnow() if data.get("verified", True) else None,
        added_by=admin_user.id
    )
    db.add(cnt)
    db.commit()
    db.refresh(cnt)

    audit(
        db=db,
        actor_id=admin_user.id,
        action="create_contact",
        entity_type="contact",
        entity_id=str(cnt.id),
        before=None,
        after={"name": cnt.name, "verified": cnt.verified}
    )

    return {"message": "Contact created", "id": cnt.id}

# 4. ADMIN/NGO VERIFY & EDIT CONTACT
@contacts_router.patch("/{contact_id}")
def update_contact_admin(
    contact_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin", "ngo_staff", "govt_official"]))
):
    cnt = db.query(Contact).filter(Contact.id == contact_id).first()
    if not cnt:
        raise HTTPException(status_code=404, detail="Contact not found")

    before_state = {"name": cnt.name, "verified": cnt.verified, "phone": cnt.phone}

    if "name" in data: cnt.name = data["name"]
    if "type" in data: cnt.type = data["type"]
    if "phone" in data: cnt.phone = data["phone"]
    if "email" in data: cnt.email = data["email"]
    if "website" in data: cnt.website = data["website"]
    if "group_link" in data: cnt.group_link = data["group_link"]
    if "city" in data: cnt.city = data["city"]
    if "state" in data: cnt.state = data["state"]
    if "services" in data: cnt.services = data["services"]
    if "hours" in data: cnt.hours = data["hours"]
    if "is_24x7" in data: cnt.is_24x7 = data["is_24x7"]

    if "verified" in data:
        cnt.verified = data["verified"]
        if data["verified"]:
            cnt.last_verified_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(cnt)

    audit(
        db=db,
        actor_id=admin_user.id,
        action="update_contact",
        entity_type="contact",
        entity_id=str(cnt.id),
        before=before_state,
        after={"name": cnt.name, "verified": cnt.verified}
    )

    return {"message": "Contact updated successfully", "id": cnt.id, "verified": cnt.verified}

# 5. DELETE CONTACT
@contacts_router.delete("/{contact_id}")
def delete_contact_admin(
    contact_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin", "ngo_staff", "govt_official"]))
):
    cnt = db.query(Contact).filter(Contact.id == contact_id).first()
    if not cnt:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete(cnt)
    db.commit()

    audit(
        db=db,
        actor_id=admin_user.id,
        action="delete_contact",
        entity_type="contact",
        entity_id=str(contact_id),
        before={"name": cnt.name},
        after={"deleted": True}
    )

    return {"message": f"Contact #{contact_id} deleted."}
