import datetime
import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Body, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from db.database import get_db
from db.models import LostFoundPost, LostFoundMatch, Message, User, AuditLog
from db.audit import audit
from utils.auth import get_current_user, get_current_user_optional

lost_found_router = APIRouter(prefix="/api/lost-found", tags=["Lost & Found Pet Registry"])

# Helper: Haversine distance in kilometers
def haversine_distance(lat1: Optional[float], lon1: Optional[float], lat2: Optional[float], lon2: Optional[float]) -> float:
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 999.0
    try:
        R = 6371.0  # Earth radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c
    except Exception:
        return 999.0

# Helper: Text word similarity score between 0.0 and 1.0
def text_similarity(str1: Optional[str], str2: Optional[str]) -> float:
    if not str1 or not str2:
        return 0.2
    w1 = set(str1.lower().replace('/', ' ').replace('-', ' ').split())
    w2 = set(str2.lower().replace('/', ' ').replace('-', ' ').split())
    if not w1 or not w2:
        return 0.0
    intersection = w1.intersection(w2)
    union = w1.union(w2)
    return len(intersection) / len(union)

# Helper: Calculate smart match score between two posts
def calculate_match_score(post1: LostFoundPost, post2: LostFoundPost) -> float:
    # 1. Distance score (max 15 km)
    dist = haversine_distance(post1.lat, post1.lng, post2.lat, post2.lng)
    dist_score = max(0.0, 1.0 - (dist / 15.0)) if dist <= 15.0 else 0.0

    # 2. Text/Breed/Colour similarity
    text1 = f"{post1.breed or ''} {post1.colour_markings or ''} {post1.dog_name or ''}"
    text2 = f"{post2.breed or ''} {post2.colour_markings or ''} {post2.dog_name or ''}"
    txt_score = text_similarity(text1, text2)

    # 3. Date window similarity (max 30 days)
    d1 = post1.event_date or post1.created_at or datetime.datetime.utcnow()
    d2 = post2.event_date or post2.created_at or datetime.datetime.utcnow()
    days_diff = abs((d1 - d2).days)
    time_score = max(0.0, 1.0 - (days_diff / 30.0)) if days_diff <= 30 else 0.0

    # Weighted composite score
    total = (dist_score * 0.45) + (txt_score * 0.35) + (time_score * 0.20)
    return round(total * 100.0, 1)

def format_post_dict(post: LostFoundPost, db: Session, viewer_user: Optional[User] = None) -> dict:
    owner = db.query(User).filter(User.id == post.owner_id).first() if post.owner_id else None
    owner_name = owner.full_name or owner.username if owner else "Anonymous Citizen"
    
    # Check if viewer can see phone number
    can_see_phone = False
    if viewer_user:
        if viewer_user.role in ["ngo_staff", "admin", "govt_official"]:
            can_see_phone = True
        elif viewer_user.id == post.owner_id:
            can_see_phone = True
        else:
            # Check if there is a confirmed match involving viewer's posts
            viewer_posts = db.query(LostFoundPost.id).filter(LostFoundPost.owner_id == viewer_user.id).subquery()
            confirmed_match = db.query(LostFoundMatch).filter(
                LostFoundMatch.status == "confirmed",
                or_(
                    and_(LostFoundMatch.post_a == post.id, LostFoundMatch.post_b.in_(viewer_posts)),
                    and_(LostFoundMatch.post_b == post.id, LostFoundMatch.post_a.in_(viewer_posts))
                )
            ).first()
            if confirmed_match:
                can_see_phone = True

    phone_display = (owner.phone if owner else None) if can_see_phone else "Hidden until match confirmed"

    # Get matches for this post
    matches_q = db.query(LostFoundMatch).filter(
        or_(LostFoundMatch.post_a == post.id, LostFoundMatch.post_b == post.id)
    ).all()

    matches_list = []
    for m in matches_q:
        other_id = m.post_b if m.post_a == post.id else m.post_a
        other_post = db.query(LostFoundPost).filter(LostFoundPost.id == other_id).first()
        if other_post:
            matches_list.append({
                "match_id": m.id,
                "score": m.score,
                "status": m.status,
                "matched_post_id": other_post.id,
                "kind": other_post.kind,
                "dog_name": other_post.dog_name,
                "breed": other_post.breed,
                "photo": other_post.photo,
                "address": other_post.address,
                "event_date": other_post.event_date.isoformat() if other_post.event_date else None
            })

    # Message count
    msg_count = db.query(Message).filter(Message.post_id == post.id).count()

    return {
        "id": post.id,
        "kind": post.kind,
        "owner_id": post.owner_id,
        "owner_name": owner_name,
        "owner_phone": phone_display,
        "phone_hidden": not can_see_phone,
        "dog_name": post.dog_name or ("Lost Pet" if post.kind == "lost" else "Found Pet"),
        "breed": post.breed or "Indian Pariah / Desi",
        "colour_markings": post.colour_markings or "Not specified",
        "age_sex": post.age_sex or "Unknown",
        "collar_microchip": post.collar_microchip or "None",
        "photo": post.photo or "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop",
        "lat": post.lat or 12.9716,
        "lng": post.lng or 77.5946,
        "address": post.address or "Bengaluru",
        "city": post.city or "Bengaluru",
        "state": post.state or "Karnataka",
        "event_date": post.event_date.isoformat() if post.event_date else post.created_at.isoformat(),
        "reward": post.reward or None,
        "contact_pref": post.contact_pref or "in_app",
        "status": post.status or "open",
        "expires_at": post.expires_at.isoformat() if post.expires_at else None,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "matches_count": len(matches_list),
        "matches": matches_list,
        "messages_count": msg_count
    }


# -----------------------------------------------------------------------------
# 1. CREATE LOST OR FOUND POST (Auth Required)
# -----------------------------------------------------------------------------
@lost_found_router.post("/", status_code=status.HTTP_201_CREATED)
def create_lost_found_post(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    kind = data.get("kind", "lost").lower()
    if kind not in ["lost", "found"]:
        raise HTTPException(status_code=400, detail="Invalid kind. Must be 'lost' or 'found'.")

    event_dt = datetime.datetime.utcnow()
    if data.get("event_date"):
        try:
            event_dt = datetime.datetime.fromisoformat(str(data["event_date"]).replace('Z', ''))
        except Exception:
            pass

    expires_dt = datetime.datetime.utcnow() + datetime.timedelta(days=60)

    post = LostFoundPost(
        kind=kind,
        owner_id=current_user.id,
        dog_name=data.get("dog_name"),
        breed=data.get("breed", "Indian Pariah / Desi"),
        colour_markings=data.get("colour_markings"),
        age_sex=data.get("age_sex"),
        collar_microchip=data.get("collar_microchip"),
        photo=data.get("photo"),
        lat=float(data.get("lat", 12.9716)),
        lng=float(data.get("lng", 77.5946)),
        address=data.get("address", "Bengaluru"),
        city=data.get("city", "Bengaluru"),
        state=data.get("state", "Karnataka"),
        event_date=event_dt,
        reward=data.get("reward"),
        contact_pref=data.get("contact_pref", "in_app"),
        status="open",
        expires_at=expires_dt,
        created_at=datetime.datetime.utcnow()
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Smart Matching Algorithm: compare with active opposite posts
    opposite_kind = "found" if kind == "lost" else "lost"
    candidates = db.query(LostFoundPost).filter(
        LostFoundPost.kind == opposite_kind,
        LostFoundPost.status.in_(["open", "matched"])
    ).all()

    new_matches = []
    for candidate in candidates:
        score = calculate_match_score(post, candidate)
        if score >= 35.0:
            match_row = LostFoundMatch(
                post_a=post.id if post.kind == "lost" else candidate.id,
                post_b=candidate.id if post.kind == "lost" else post.id,
                score=score,
                status="suggested"
            )
            db.add(match_row)
            new_matches.append(match_row)

    if new_matches:
        db.commit()

    audit(db, action="create", entity_type="lost_found_post", entity_id=str(post.id), actor_id=current_user.id, after={"kind": kind, "dog_name": post.dog_name})

    return format_post_dict(post, db, current_user)


# -----------------------------------------------------------------------------
# 2. LIST LOST/FOUND POSTS (Public Open Browsing)
# -----------------------------------------------------------------------------
@lost_found_router.get("/")
def list_lost_found_posts(
    kind: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    breed: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Auto-expire check for old open posts
    now = datetime.datetime.utcnow()
    db.query(LostFoundPost).filter(
        LostFoundPost.expires_at < now,
        LostFoundPost.status == "open"
    ).update({"status": "closed"}, synchronize_session=False)
    db.commit()

    query = db.query(LostFoundPost)

    if kind and kind.lower() in ["lost", "found"]:
        query = query.filter(LostFoundPost.kind == kind.lower())

    if status and status != "all":
        query = query.filter(LostFoundPost.status == status)

    if breed:
        query = query.filter(LostFoundPost.breed.ilike(f"%{breed}%"))

    if city or area:
        loc_term = f"%{city or area}%"
        query = query.filter(or_(LostFoundPost.address.ilike(loc_term), LostFoundPost.city.ilike(loc_term)))

    if q:
        st = f"%{q}%"
        query = query.filter(
            or_(
                LostFoundPost.dog_name.ilike(st),
                LostFoundPost.breed.ilike(st),
                LostFoundPost.colour_markings.ilike(st),
                LostFoundPost.address.ilike(st)
            )
        )

    posts = query.order_by(LostFoundPost.created_at.desc()).all()
    return [format_post_dict(p, db, current_user) for p in posts]


# -----------------------------------------------------------------------------
# 3. GET SINGLE POST DETAILS & MATCHES
# -----------------------------------------------------------------------------
@lost_found_router.get("/{post_id}")
def get_lost_found_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    post = db.query(LostFoundPost).filter(LostFoundPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Lost & Found post not found")
    return format_post_dict(post, db, current_user)


# -----------------------------------------------------------------------------
# 4. UPDATE POST (Owner or Admin/NGO)
# -----------------------------------------------------------------------------
@lost_found_router.patch("/{post_id}")
@lost_found_router.put("/{post_id}")
def update_lost_found_post(
    post_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(LostFoundPost).filter(LostFoundPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if current_user.role not in ["admin", "ngo_staff", "govt_official"] and post.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied to edit this post.")

    before_state = {"status": post.status, "dog_name": post.dog_name}

    if "dog_name" in data: post.dog_name = data["dog_name"]
    if "breed" in data: post.breed = data["breed"]
    if "colour_markings" in data: post.colour_markings = data["colour_markings"]
    if "age_sex" in data: post.age_sex = data["age_sex"]
    if "collar_microchip" in data: post.collar_microchip = data["collar_microchip"]
    if "photo" in data: post.photo = data["photo"]
    if "address" in data: post.address = data["address"]
    if "lat" in data: post.lat = float(data["lat"])
    if "lng" in data: post.lng = float(data["lng"])
    if "reward" in data: post.reward = data["reward"]
    if "status" in data:
        st = data["status"].lower()
        if st in ["open", "matched", "reunited", "closed"]:
            post.status = st

    db.commit()
    db.refresh(post)

    audit(db, action="update", entity_type="lost_found_post", entity_id=str(post.id), actor_id=current_user.id, before=before_state, after={"status": post.status, "dog_name": post.dog_name})

    return format_post_dict(post, db, current_user)


# -----------------------------------------------------------------------------
# 5. DELETE POST (Owner or Admin/NGO)
# -----------------------------------------------------------------------------
@lost_found_router.delete("/{post_id}")
def delete_lost_found_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(LostFoundPost).filter(LostFoundPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if current_user.role not in ["admin", "ngo_staff", "govt_official"] and post.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied to delete this post.")

    # Remove matches & messages
    db.query(LostFoundMatch).filter(or_(LostFoundMatch.post_a == post.id, LostFoundMatch.post_b == post.id)).delete(synchronize_session=False)
    db.query(Message).filter(Message.post_id == post.id).delete(synchronize_session=False)
    db.delete(post)
    db.commit()

    audit(db, action="delete", entity_type="lost_found_post", entity_id=str(post_id), actor_id=current_user.id)

    return {"status": "success", "message": f"Post #{post_id} deleted successfully."}


# -----------------------------------------------------------------------------
# 6. CONFIRM OR REJECT MATCH
# -----------------------------------------------------------------------------
@lost_found_router.post("/matches/{match_id}/confirm")
def confirm_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    match = db.query(LostFoundMatch).filter(LostFoundMatch.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    post_a = db.query(LostFoundPost).filter(LostFoundPost.id == match.post_a).first()
    post_b = db.query(LostFoundPost).filter(LostFoundPost.id == match.post_b).first()

    if current_user.role not in ["admin", "ngo_staff"] and current_user.id not in [post_a.owner_id, post_b.owner_id]:
        raise HTTPException(status_code=403, detail="Only owners of matched posts can confirm.")

    match.status = "confirmed"
    if post_a: post_a.status = "matched"
    if post_b: post_b.status = "matched"

    db.commit()

    audit(db, action="confirm_match", entity_type="lost_found_match", entity_id=str(match_id), actor_id=current_user.id)

    return {"status": "success", "message": "Match confirmed! Phone details unlocked for both parties.", "match_id": match_id}


@lost_found_router.post("/matches/{match_id}/reject")
def reject_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    match = db.query(LostFoundMatch).filter(LostFoundMatch.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    match.status = "rejected"
    db.commit()
    return {"status": "success", "message": "Match rejected.", "match_id": match_id}


# -----------------------------------------------------------------------------
# 7. IN-APP MESSAGING (GET & POST)
# -----------------------------------------------------------------------------
@lost_found_router.get("/posts/{post_id}/messages")
def get_post_messages(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(LostFoundPost).filter(LostFoundPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # If owner or admin/NGO, see all messages for post; otherwise see messages involving user
    if current_user.role in ["admin", "ngo_staff"] or current_user.id == post.owner_id:
        msgs = db.query(Message).filter(Message.post_id == post_id).order_by(Message.created_at.asc()).all()
    else:
        msgs = db.query(Message).filter(
            Message.post_id == post_id,
            or_(Message.sender_id == current_user.id, Message.recipient_id == current_user.id)
        ).order_by(Message.created_at.asc()).all()

    result = []
    for m in msgs:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        result.append({
            "id": m.id,
            "post_id": m.post_id,
            "sender_id": m.sender_id,
            "sender_name": (sender.full_name or sender.username) if sender else "User",
            "recipient_id": m.recipient_id,
            "body": m.body,
            "created_at": m.created_at.isoformat()
        })
    return result


@lost_found_router.post("/posts/{post_id}/messages")
def send_post_message(
    post_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    body_text = data.get("body", "").strip()
    if not body_text:
        raise HTTPException(status_code=400, detail="Message body cannot be empty.")

    post = db.query(LostFoundPost).filter(LostFoundPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    recipient_id = post.owner_id
    if current_user.id == post.owner_id:
        # If post owner is replying, send to target recipient or latest inquirer
        recipient_id = data.get("recipient_id")
        if not recipient_id:
            last_msg = db.query(Message).filter(
                Message.post_id == post_id,
                Message.sender_id != current_user.id
            ).order_by(Message.created_at.desc()).first()
            if last_msg:
                recipient_id = last_msg.sender_id

    msg = Message(
        post_id=post_id,
        sender_id=current_user.id,
        recipient_id=recipient_id,
        body=body_text,
        created_at=datetime.datetime.utcnow()
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "post_id": msg.post_id,
        "sender_id": msg.sender_id,
        "sender_name": current_user.full_name or current_user.username,
        "recipient_id": msg.recipient_id,
        "body": msg.body,
        "created_at": msg.created_at.isoformat()
    }


# -----------------------------------------------------------------------------
# 8. REPORT POST FOR MODERATION
# -----------------------------------------------------------------------------
@lost_found_router.post("/posts/{post_id}/report")
def report_post(
    post_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(LostFoundPost).filter(LostFoundPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    reason = data.get("reason", "Suspicious or fake post")
    audit(
        db,
        action="report_lost_found_post",
        entity_type="lost_found_post",
        entity_id=str(post_id),
        actor_id=current_user.id,
        after={"reason": reason, "dog_name": post.dog_name, "kind": post.kind}
    )

    return {"status": "success", "message": "Post reported to NGO safety team for review."}
