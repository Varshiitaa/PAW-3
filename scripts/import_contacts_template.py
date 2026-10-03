import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from db.database import engine, Base, SessionLocal
from db.models import Contact

def import_contacts_template():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    template_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'seed', 'contacts.template.json'))
    if not os.path.exists(template_path):
        print(f"[ERROR] Template file not found at {template_path}")
        return

    with open(template_path, 'r', encoding='utf-8') as f:
        contacts_data = json.load(f)

    imported = 0
    for c_data in contacts_data:
        existing = db.query(Contact).filter(Contact.name == c_data["name"]).first()
        if not existing:
            cnt = Contact(
                name=c_data["name"],
                type=c_data.get("type", "Helpline"),
                phone=c_data.get("phone"),
                email=c_data.get("email"),
                website=c_data.get("website"),
                group_link=c_data.get("group_link"),
                city=c_data.get("city", "Bengaluru"),
                state=c_data.get("state", "Karnataka"),
                services=c_data.get("services", []),
                hours=c_data.get("hours"),
                is_24x7=c_data.get("is_24x7", False),
                verified=c_data.get("verified", False),
                added_by=None
            )
            db.add(cnt)
            imported += 1
            
    db.commit()
    db.close()
    print(f"[CONTACTS SEED] Successfully imported {imported} contacts with verified=False.")

if __name__ == "__main__":
    import_contacts_template()
