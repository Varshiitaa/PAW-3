import os
import datetime
import jwt
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Body, Cookie
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User, Organisation
from db.audit import audit
from utils.auth import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    decode_token, get_current_user, check_login_rate_limit, SECRET_KEY, ALGORITHM
)

auth_router = APIRouter(prefix="/api", tags=["Authentication & User Management"])

# Pydantic Schemas
class SignupSchema(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "citizen"  # citizen | volunteer | ngo_staff | govt_official
    organisation_name: Optional[str] = None
    organisation_type: Optional[str] = "NGO"
    city: Optional[str] = "Bengaluru"
    state: Optional[str] = "Karnataka"

class LoginSchema(BaseModel):
    username_or_email: str
    password: str

class ProfileUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str


@auth_router.post("/auth/signup")
def signup(payload: SignupSchema, request: Request, response: Response, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    clean_username = payload.username.lower().strip()

    # Check duplicate email
    if db.query(User).filter(func.lower(User.email) == clean_email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    # Check duplicate username
    if db.query(User).filter(func.lower(User.username) == clean_username).first():
        raise HTTPException(status_code=400, detail="This username is already taken.")

    # Organisation Handling for Non-Citizens
    org_id = None
    user_status = "active" if payload.role == "citizen" else "pending"

    if payload.role in ["volunteer", "ngo_staff", "govt_official"]:
        if payload.organisation_name:
            existing_org = db.query(Organisation).filter(Organisation.name == payload.organisation_name).first()
            if not existing_org:
                new_org = Organisation(
                    name=payload.organisation_name,
                    type=payload.organisation_type or "NGO",
                    city=payload.city or "Bengaluru",
                    state=payload.state or "Karnataka",
                    verified=False
                )
                db.add(new_org)
                db.commit()
                db.refresh(new_org)
                org_id = new_org.id
            else:
                org_id = existing_org.id

    hashed = hash_password(payload.password)
    user = User(
        email=clean_email,
        username=clean_username,
        password_hash=hashed,
        hashed_password=hashed,
        full_name=payload.full_name or payload.username,
        phone=payload.phone,
        role=payload.role or "citizen",
        organisation_id=org_id,
        city=payload.city or "Bengaluru",
        state=payload.state or "Karnataka",
        status=user_status,
        created_at=datetime.datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log
    audit(
        db=db,
        actor_id=user.id,
        action="signup",
        entity_type="user",
        entity_id=user.id,
        before=None,
        after={"email": user.email, "username": user.username, "role": user.role, "status": user.status}
    )

    access_token = create_access_token({"sub": str(user.id), "role": user.role, "status": user.status})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Set httpOnly cookie for refresh token
    response.set_cookie(
        key="streetpaw_refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600
    )

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "status": user.status,
            "organisation_id": user.organisation_id,
            "city": user.city
        }
    }


@auth_router.post("/auth/login")
def login(payload: LoginSchema, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_login_rate_limit(client_ip, payload.username_or_email)

    query_val = payload.username_or_email.lower().strip()
    # Lookup user by username or email (case-insensitive)
    user = db.query(User).filter(
        (func.lower(User.username) == query_val) | (func.lower(User.email) == query_val)
    ).first()

    if not user or not verify_password(payload.password, user.password_hash or user.hashed_password or ""):
        raise HTTPException(status_code=401, detail="Invalid username/email or password.")

    if user.status == "suspended":
        raise HTTPException(status_code=403, detail="Your account has been suspended by an administrator.")

    # Update last login
    user.last_login = datetime.datetime.utcnow()
    db.commit()

    # Audit log
    audit(
        db=db,
        actor_id=user.id,
        action="login",
        entity_type="user",
        entity_id=user.id,
        before=None,
        after={"email": user.email, "role": user.role, "last_login": str(user.last_login)}
    )

    access_token = create_access_token({"sub": str(user.id), "role": user.role, "status": user.status})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    response.set_cookie(
        key="streetpaw_refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600
    )

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "status": user.status,
            "organisation_id": user.organisation_id,
            "city": user.city
        }
    }


@auth_router.post("/auth/logout")
def logout(response: Response, current_user: Optional[User] = Depends(get_current_user)):
    if current_user:
        audit(db=None, actor_id=current_user.id, action="logout", entity_type="user", entity_id=current_user.id)
    response.delete_cookie(key="streetpaw_refresh_token")
    return {"success": True, "message": "Logged out successfully."}


@auth_router.post("/auth/refresh")
def refresh_token_endpoint(
    request: Request,
    response: Response,
    streetpaw_refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    token = streetpaw_refresh_token or request.cookies.get("streetpaw_refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token missing.")

    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type.")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or user.status == "suspended":
        raise HTTPException(status_code=401, detail="User account inactive or suspended.")

    new_access_token = create_access_token({"sub": str(user.id), "role": user.role, "status": user.status})
    return {
        "success": True,
        "access_token": new_access_token,
        "token_type": "bearer"
    }


@auth_router.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org_name = None
    if current_user.organisation_id:
        org = db.query(Organisation).filter(Organisation.id == current_user.organisation_id).first()
        if org:
            org_name = org.name

    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role,
        "status": current_user.status,
        "organisation_id": current_user.organisation_id,
        "organisation_name": org_name,
        "city": current_user.city,
        "state": current_user.state,
        "created_at": current_user.created_at.strftime("%Y-%m-%d") if current_user.created_at else None
    }


@auth_router.patch("/users/me")
def update_profile(
    payload: ProfileUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    before_state = {"full_name": current_user.full_name, "phone": current_user.phone, "city": current_user.city}

    if payload.full_name is not None: current_user.full_name = payload.full_name
    if payload.phone is not None: current_user.phone = payload.phone
    if payload.city is not None: current_user.city = payload.city
    if payload.state is not None: current_user.state = payload.state

    db.commit()
    db.refresh(current_user)

    audit(
        db=db,
        actor_id=current_user.id,
        action="update_profile",
        entity_type="user",
        entity_id=current_user.id,
        before=before_state,
        after={"full_name": current_user.full_name, "phone": current_user.phone, "city": current_user.city}
    )

    return {"success": True, "user": current_user}


@auth_router.post("/auth/forgot-password")
def forgot_password(payload: ForgotPasswordSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return {"success": True, "message": "If an account exists, a password reset link has been sent."}

    # Generate password reset token
    reset_token = jwt.encode(
        {"sub": str(user.id), "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=15), "type": "reset"},
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    print(f"\n========================================================")
    print(f" [DEV SMTP SIMULATOR] PASSWORD RESET LINK FOR {user.email}:")
    print(f" {reset_url}")
    print(f"========================================================\n")

    return {"success": True, "message": "Password reset token generated and logged to console in dev mode."}


@auth_router.post("/auth/reset-password")
def reset_password(payload: ResetPasswordSchema, db: Session = Depends(get_db)):
    try:
        data = decode_token(payload.token)
        if data.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token type.")
        user_id = data.get("sub")
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        new_hash = hash_password(payload.new_password)
        user.password_hash = new_hash
        user.hashed_password = new_hash
        db.commit()

        audit(db=db, actor_id=user.id, action="reset_password", entity_type="user", entity_id=user.id)
        return {"success": True, "message": "Password updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Password reset failed: {str(e)}")
