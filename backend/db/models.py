import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, JSON
)
from sqlalchemy.orm import relationship
from .database import Base

class Organisation(Base):
    __tablename__ = "organisations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "NGO" | "SHG" | "GOVT"
    city = Column(String, index=True, default="Bengaluru")
    state = Column(String, default="Karnataka")
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=False, default="pbkdf2:sha256:demo_hash")
    hashed_password = Column(String, nullable=True, default="pbkdf2:sha256:demo_hash")  # Legacy compatibility
    full_name = Column(String, nullable=True)
    role = Column(String, default="citizen", index=True)  # citizen | volunteer | ngo_staff | govt_official | admin
    organisation_id = Column(Integer, ForeignKey("organisations.id"), nullable=True)
    city = Column(String, index=True, default="Bengaluru")
    state = Column(String, default="Karnataka")
    status = Column(String, default="active", index=True)  # pending | active | suspended
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    last_login = Column(DateTime, nullable=True)

    organisation = relationship("Organisation")


class Dog(Base):
    __tablename__ = "dogs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    public_code = Column(String, unique=True, index=True, nullable=False)  # e.g. PAW-0001
    animal_id = Column(String, index=True, nullable=True)  # Legacy alias e.g. "DOG-1082"
    name = Column(String, nullable=True)
    sex = Column(String, default="unknown")  # male | female | unknown
    approx_age = Column(String, nullable=True)
    colour_markings = Column(String, nullable=True)
    species = Column(String, default="Dog")
    breed = Column(String, default="Indian Pariah / Desi")
    breed_source = Column(String, default="human")  # ai | human
    temperament = Column(String, nullable=True)
    sterilised = Column(String, default="unknown")  # yes | no | unknown
    health_status = Column(String, default="Healthy / Sterilized")
    disease_name = Column(String, nullable=True)
    disease_confidence = Column(Float, default=0.0)
    ear_notch = Column(Boolean, default=False)
    status = Column(String, default="active_care", index=True)  # active_care | under_observation | rescue_clinic | adopted | deceased | unknown
    primary_photo = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    location = Column(String, default="DSU Campus Gate 2, Bengaluru")
    location_lat = Column(Float, nullable=True, index=True)
    location_lng = Column(Float, nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete timestamp
    deleted_by = Column(Integer, ForeignKey("users.id"), nullable=True)


class DogProfile(Base):
    """Legacy model mapping to dog_profiles table for backwards compatibility"""
    __tablename__ = "dog_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    animal_id = Column(String, unique=True, index=True, nullable=False)
    species = Column(String, default="Dog")
    breed = Column(String, default="Indian Pariah / Desi")
    health_status = Column(String, default="Healthy / Sterilized")
    disease_name = Column(String, nullable=True)
    disease_confidence = Column(Float, default=0.0)
    location = Column(String, default="DSU Campus Gate 2, Bengaluru")
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class DogPhoto(Base):
    __tablename__ = "dog_photos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    path = Column(Text, nullable=False)
    thumbnail_path = Column(Text, nullable=True)
    taken_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class DogLocation(Base):
    __tablename__ = "dog_locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    lat = Column(Float, nullable=False, index=True)
    lng = Column(Float, nullable=False, index=True)
    address = Column(String, nullable=True)
    area = Column(String, nullable=True)
    city = Column(String, default="Bengaluru", index=True)
    state = Column(String, default="Karnataka")
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    note = Column(Text, nullable=True)


class Vaccination(Base):
    __tablename__ = "vaccinations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    vaccine = Column(String, nullable=False)  # rabies | DHPP | other
    date_given = Column(DateTime, nullable=False)
    next_due = Column(DateTime, nullable=True)
    given_by = Column(String, nullable=True)
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class HealthEvent(Base):
    __tablename__ = "health_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    type = Column(String, nullable=False)  # scan | injury | treatment | disease_flag | other
    description = Column(Text, nullable=True)
    source = Column(String, default="human")  # ai_scan | human
    photo = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    public_id = Column(String, unique=True, index=True, nullable=False)  # CMP-0001
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=True)
    issue_type = Column(String, nullable=False, default="Distress Signal")
    urgency = Column(String, default="HIGH")  # CRITICAL | HIGH | MEDIUM | LOW
    description = Column(Text, nullable=True)
    photo = Column(Text, nullable=True)
    lat = Column(Float, nullable=True, index=True)
    lng = Column(Float, nullable=True, index=True)
    address = Column(String, nullable=True)
    city = Column(String, default="Bengaluru", index=True)
    state = Column(String, default="Karnataka")
    status = Column(String, default="reported", index=True)  # reported | acknowledged | team_dispatched | in_progress | resolved | closed | cancelled
    assigned_org_id = Column(Integer, ForeignKey("organisations.id"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)


class RescueCase(Base):
    """Legacy model mapping to rescue_cases table for backwards compatibility"""
    __tablename__ = "rescue_cases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String, default="HIGH")
    status = Column(String, default="PENDING DISPATCH")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    landmark = Column(String, nullable=True)
    photo_url = Column(Text, nullable=True)
    reported_by = Column(String, nullable=True)
    assigned_ngo = Column(String, default="CUPA Rescue Squad #4")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ComplaintEvent(Base):
    __tablename__ = "complaint_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    status = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # Helpline | Vet Hospital | ABC Center | SHG Feeder
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    group_link = Column(String, nullable=True)
    city = Column(String, default="Bengaluru", index=True)
    state = Column(String, default="Karnataka")
    services = Column(JSON, nullable=True)  # JSON list
    hours = Column(String, nullable=True)
    is_24x7 = Column(Boolean, default=False)
    verified = Column(Boolean, default=False)
    last_verified_at = Column(DateTime, nullable=True)
    added_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class LostFoundPost(Base):
    __tablename__ = "lost_found_posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    kind = Column(String, nullable=False)  # lost | found
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    dog_name = Column(String, nullable=True)
    breed = Column(String, nullable=True)
    colour_markings = Column(String, nullable=True)
    age_sex = Column(String, nullable=True)
    collar_microchip = Column(String, nullable=True)
    photo = Column(Text, nullable=True)
    lat = Column(Float, nullable=True, index=True)
    lng = Column(Float, nullable=True, index=True)
    address = Column(String, nullable=True)
    city = Column(String, default="Bengaluru", index=True)
    state = Column(String, default="Karnataka")
    event_date = Column(DateTime, nullable=True)
    reward = Column(String, nullable=True)
    contact_pref = Column(String, nullable=True)
    status = Column(String, default="open", index=True)  # open | matched | reunited | closed
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class LostFoundMatch(Base):
    __tablename__ = "lost_found_matches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_a = Column(Integer, ForeignKey("lost_found_posts.id"), nullable=False)
    post_b = Column(Integer, ForeignKey("lost_found_posts.id"), nullable=False)
    score = Column(Float, nullable=False)
    status = Column(String, default="suggested", index=True)  # suggested | confirmed | rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("lost_found_posts.id"), nullable=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False, index=True)  # create | update | delete | status_change | login
    entity_type = Column(String, nullable=False, index=True)  # dog | complaint | user | organisation
    entity_id = Column(String, nullable=False, index=True)
    before = Column(JSON, nullable=True)
    after = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
