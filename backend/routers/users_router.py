from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User, Complaint, Dog, LostFoundPost
from utils.auth import get_current_user, get_current_user_optional

users_router = APIRouter(prefix="/api/users", tags=["User Privacy & Visibility Directory"])

@users_router.get("/{user_id}")
def get_user_profile_visibility(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    # 1. Admin sees full details
    if current_user and current_user.role == "admin":
        return {
            "id": target_user.id,
            "username": target_user.username,
            "full_name": target_user.full_name,
            "email": target_user.email,
            "phone": target_user.phone,
            "role": target_user.role,
            "organisation_id": target_user.organisation_id,
            "city": target_user.city,
            "status": target_user.status,
            "visibility": "admin_unrestricted"
        }

    # 2. Self sees full details
    if current_user and current_user.id == target_user.id:
        return {
            "id": target_user.id,
            "username": target_user.username,
            "full_name": target_user.full_name,
            "email": target_user.email,
            "phone": target_user.phone,
            "role": target_user.role,
            "organisation_id": target_user.organisation_id,
            "city": target_user.city,
            "status": target_user.status,
            "visibility": "self"
        }

    # 3. NGO / Govt / SHG staff visibility rule:
    # Check if target_user is linked to complaints, dogs, or lost/found handled by current_user's organisation
    if current_user and current_user.role in ["ngo_staff", "govt_official", "volunteer"] and current_user.organisation_id:
        org_id = current_user.organisation_id
        
        # Check linked complaints
        linked_complaint = db.query(Complaint).filter(
            Complaint.reporter_id == target_user.id,
            Complaint.assigned_org_id == org_id
        ).first()

        # Check linked dogs
        linked_dog = db.query(Dog).filter(
            Dog.created_by == target_user.id
        ).first() if not linked_complaint else True

        if linked_complaint or linked_dog:
            return {
                "id": target_user.id,
                "username": target_user.username,
                "full_name": target_user.full_name,
                "email": target_user.email,
                "phone": target_user.phone,
                "role": target_user.role,
                "organisation_id": target_user.organisation_id,
                "city": target_user.city,
                "visibility": "organisation_linked"
            }

# -----------------------------------------------------------------------------
# LIST USERS (Filtered by Role & Privacy Rules)
# -----------------------------------------------------------------------------
@users_router.get("/")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    all_users = db.query(User).order_by(User.created_at.desc()).all()
    results = []

    is_admin = current_user.role == "admin"
    user_org = current_user.organisation_id

    for u in all_users:
        # Calculate activity counts
        dogs_count = db.query(Dog).filter(Dog.created_by == u.id).count()
        complaints_count = db.query(Complaint).filter(Complaint.reporter_id == u.id).count()

        # Check privacy rule
        can_see_contact = False
        if is_admin or u.id == current_user.id:
            can_see_contact = True
        elif user_org and u.organisation_id == user_org:
            can_see_contact = True
        elif user_org:
            # Check linked complaints or dogs
            linked = db.query(Complaint).filter(Complaint.reporter_id == u.id, Complaint.assigned_org_id == user_org).first()
            if linked:
                can_see_contact = True

        results.append({
            "id": u.id,
            "username": u.username or f"user_{u.id}",
            "email": u.email if can_see_contact else "[Redacted for Privacy]",
            "phone": u.phone if can_see_contact else "[Redacted for Privacy]",
            "full_name": u.full_name or u.username or f"User #{u.id}",
            "role": u.role,
            "organisation_id": u.organisation_id,
            "city": u.city or "Bengaluru",
            "state": u.state or "Karnataka",
            "status": u.status or "active",
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "dogs_registered": dogs_count,
            "complaints_raised": complaints_count,
            "can_see_contact": can_see_contact
        })

    return results


# -----------------------------------------------------------------------------
# UPDATE USER STATUS (Approve / Suspend - Admin / NGO Leader)
# -----------------------------------------------------------------------------
@users_router.patch("/{user_id}/status")
def update_user_status(
    user_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "ngo_staff", "govt_official"]:
        raise HTTPException(status_code=403, detail="Permission denied to alter user status.")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    new_status = data.get("status", "").lower()
    if new_status not in ["pending", "active", "suspended"]:
        raise HTTPException(status_code=400, detail="Invalid status value.")

    target_user.status = new_status
    db.commit()
    db.refresh(target_user)

    return {
        "status": "success",
        "user_id": target_user.id,
        "new_status": target_user.status
    }
