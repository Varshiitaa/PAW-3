import datetime
import sqlite3
import os
from sqlalchemy.orm import Session
from db.database import engine, Base, SessionLocal
from db.models import Dog, Complaint, DogProfile, RescueCase, User, Organisation

def run_migration():
    print("[MIGRATION] Starting database schema creation & data migration...")
    
    # 0. Add missing columns to legacy SQLite tables if needed
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    db_file = os.path.join(backend_dir, "streetpaw.db")
    if os.path.exists(db_file):
        conn = sqlite3.connect(db_file)
        cur = conn.cursor()
        
        # Check users columns
        cur.execute("PRAGMA table_info(users)")
        u_cols = [r[1] for r in cur.fetchall()]
        if 'username' not in u_cols:
            cur.execute("ALTER TABLE users ADD COLUMN username TEXT")
            print("[MIGRATION] Added `username` column to `users` table.")
        if 'password_hash' not in u_cols:
            cur.execute("ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT 'pbkdf2:sha256:demo_hash'")
            print("[MIGRATION] Added `password_hash` column to `users` table.")
        if 'organisation_id' not in u_cols:
            cur.execute("ALTER TABLE users ADD COLUMN organisation_id INTEGER")
            print("[MIGRATION] Added `organisation_id` column to `users` table.")
        if 'city' not in u_cols:
            cur.execute("ALTER TABLE users ADD COLUMN city TEXT DEFAULT 'Bengaluru'")
            print("[MIGRATION] Added `city` column to `users` table.")
        if 'state' not in u_cols:
            cur.execute("ALTER TABLE users ADD COLUMN state TEXT DEFAULT 'Karnataka'")
            print("[MIGRATION] Added `state` column to `users` table.")
        if 'status' not in u_cols:
            cur.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'")
            print("[MIGRATION] Added `status` column to `users` table.")
        if 'last_login' not in u_cols:
            cur.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP")
            print("[MIGRATION] Added `last_login` column to `users` table.")

        conn.commit()
        conn.close()

    # Create all tables defined in Base.metadata
    Base.metadata.create_all(bind=engine)
    print("[MIGRATION] All SQLAlchemy tables created/updated successfully.")

    db: Session = SessionLocal()
    try:
        # 1. Migrate legacy dog_profiles -> dogs table
        profiles = db.query(DogProfile).all()
        print(f"[MIGRATION] Found {len(profiles)} legacy dog_profiles to sync.")
        
        dogs_created = 0
        for p in profiles:
            existing = db.query(Dog).filter(Dog.animal_id == p.animal_id).first()
            if not existing:
                code_idx = p.id if p.id else (dogs_created + 1)
                public_code = f"PAW-{code_idx:04d}"
                
                while db.query(Dog).filter(Dog.public_code == public_code).first():
                    code_idx += 1
                    public_code = f"PAW-{code_idx:04d}"

                new_dog = Dog(
                    public_code=public_code,
                    animal_id=p.animal_id,
                    name=f"Stray Dog {p.animal_id}",
                    species=p.species or "Dog",
                    breed=p.breed or "Indian Pariah / Desi",
                    breed_source="human",
                    health_status=p.health_status or "Healthy / Sterilized",
                    disease_name=p.disease_name or "Normal",
                    disease_confidence=p.disease_confidence or 0.0,
                    status="active_care",
                    image_url=p.image_url,
                    primary_photo=p.image_url,
                    location=p.location or "DSU Campus Gate 2, Bengaluru",
                    location_lat=p.location_lat or 12.9081,
                    location_lng=p.location_lng or 77.5653,
                    created_at=p.created_at or datetime.datetime.utcnow()
                )
                db.add(new_dog)
                dogs_created += 1

        db.commit()
        print(f"[MIGRATION] Successfully migrated {dogs_created} dog_profiles into `dogs` table.")

        # 2. Migrate legacy rescue_cases -> complaints table
        rescues = db.query(RescueCase).all()
        print(f"[MIGRATION] Found {len(rescues)} legacy rescue_cases to sync.")
        
        complaints_created = 0
        for r in rescues:
            cid = r.ticket_id or f"RSC-{r.id}"
            existing = db.query(Complaint).filter(Complaint.public_id == cid).first()
            if not existing:
                public_id = f"CMP-{r.id:04d}" if r.id else f"CMP-{complaints_created+1:04d}"
                while db.query(Complaint).filter(Complaint.public_id == public_id).first():
                    r_id_val = (r.id or 0) + complaints_created + 1
                    public_id = f"CMP-{r_id_val:04d}"

                raw_status = (r.status or "PENDING DISPATCH").upper()
                if "PENDING" in raw_status: status_val = "reported"
                elif "EN ROUTE" in raw_status: status_val = "team_dispatched"
                elif "ADMITTED" in raw_status: status_val = "in_progress"
                elif "RESOLVED" in raw_status: status_val = "resolved"
                else: status_val = "reported"

                new_complaint = Complaint(
                    public_id=public_id,
                    issue_type=r.title or "Emergency Rescue Signal",
                    urgency=r.severity or "HIGH",
                    description=r.description or r.title,
                    photo=r.photo_url,
                    lat=r.latitude or 12.9124,
                    lng=r.longitude or 77.5712,
                    address=r.landmark or "Emergency Spot",
                    city="Bengaluru",
                    state="Karnataka",
                    status=status_val,
                    created_at=r.created_at or datetime.datetime.utcnow()
                )
                db.add(new_complaint)
                complaints_created += 1

        db.commit()
        print(f"[MIGRATION] Successfully migrated {complaints_created} rescue_cases into `complaints` table.")
    except Exception as e:
        print(f"[MIGRATION ERROR] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
