import sys
import os
import getpass
import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from db.database import engine, Base, SessionLocal
from db.models import User
from utils.auth import hash_password

def create_admin():
    print("=========================================================")
    print("  STREETPAW.AI FIRST ADMIN CREATION SCRIPT               ")
    print("=========================================================")
    
    email = os.getenv("ADMIN_EMAIL")
    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")
    full_name = os.getenv("ADMIN_FULL_NAME", "System Administrator")

    if not email:
        try:
            email = input("Enter Admin Email (default: admin@streetpaw.ai): ").strip()
        except EOFError:
            email = ""
        if not email:
            email = "admin@streetpaw.ai"

    if not username:
        try:
            username = input("Enter Admin Username (default: admin_varshita): ").strip()
        except EOFError:
            username = ""
        if not username:
            username = "admin_varshita"

    if not password:
        try:
            password = getpass.getpass("Enter Admin Password (default: AdminPass123!): ")
        except (EOFError, getpass.GetPassWarning):
            password = ""
        if not password:
            password = "AdminPass123!"

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        existing = db.query(User).filter((User.email == email) | (User.username == username.lower())).first()
        if existing:
            print(f"[INFO] Admin user '{existing.username}' ({existing.email}) already exists. Updating to admin role...")
            existing.role = "admin"
            existing.status = "active"
            existing.password_hash = hash_password(password)
            existing.hashed_password = existing.password_hash
            db.commit()
            print("[SUCCESS] Admin credentials updated successfully!")
        else:
            hashed = hash_password(password)
            admin_user = User(
                email=email,
                username=username.lower(),
                password_hash=hashed,
                hashed_password=hashed,
                full_name=full_name,
                role="admin",
                status="active",
                city="Bengaluru",
                state="Karnataka",
                created_at=datetime.datetime.utcnow()
            )
            db.add(admin_user)
            db.commit()
            print(f"[SUCCESS] Admin account created successfully! Username: {username} | Email: {email}")
    except Exception as e:
        print(f"[ERROR] Failed to create admin account: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
