import sys
import os
import datetime

# Add backend directory to sys.path so backend modules can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from db.database import engine, Base, SessionLocal
from db.models import (
    Organisation, User, Dog, Vaccination, Complaint, Contact, LostFoundPost, LostFoundMatch
)

def seed_demo_data():
    print("=========================================================")
    print("  STREETPAW.AI DEMO SEED SCRIPT (BENGALURU SAMPLE DATA)  ")
    print("=========================================================")
    
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Organisations
        org_data = [
            {"name": "CUPA Animal Trauma & Rescue Shelter", "type": "NGO", "city": "Bengaluru", "contact_email": "help@cupa.org", "contact_phone": "+91 80 2294 7300", "verified": True},
            {"name": "CARE Charlie's Animal Rescue", "type": "NGO", "city": "Bengaluru", "contact_email": "info@charliesrescue.org", "contact_phone": "+91 94839 11110", "verified": True},
            {"name": "DSU Animal Welfare Self-Help Group (SHG)", "type": "SHG", "city": "Bengaluru", "contact_email": "welfare@dsu.edu.in", "contact_phone": "+91 80 4216 1700", "verified": True},
            {"name": "BBMP Animal Birth Control (ABC) Division", "type": "GOVT", "city": "Bengaluru", "contact_email": "abc.vet@bbmp.gov.in", "contact_phone": "+91 80 2222 1188", "verified": True},
        ]
        orgs = []
        for o in org_data:
            existing = db.query(Organisation).filter(Organisation.name == o["name"]).first()
            if not existing:
                org = Organisation(**o)
                db.add(org)
                db.commit()
                db.refresh(org)
                orgs.append(org)
            else:
                orgs.append(existing)

        # 2. Users
        user_data = [
            {"username": "admin_varshita", "email": "admin@streetpaw.ai", "full_name": "Varshita Chauhan", "role": "admin"},
            {"username": "cupa_staff", "email": "dispatch@cupa.org", "full_name": "Dr. Ramesh Kumar", "role": "ngo_staff", "organisation_id": orgs[0].id},
            {"username": "bbmp_officer", "email": "officer@bbmp.gov.in", "full_name": "Suresh V.", "role": "govt_official", "organisation_id": orgs[3].id},
            {"username": "citizen_care", "email": "volunteer@streetpaw.ai", "full_name": "Kavya Sharma", "role": "citizen"},
        ]
        users = []
        for u in user_data:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                usr = User(**u)
                db.add(usr)
                db.commit()
                db.refresh(usr)
                users.append(usr)
            else:
                users.append(existing)

        # 3. 25 Realistic Stray Dogs across Bengaluru Areas
        bengaluru_areas = [
            ("DSU Campus Gate 2", 12.9081, 77.5653),
            ("JP Nagar 6th Phase", 12.9077, 77.5857),
            ("Koramangala 4th Block", 12.9345, 77.6242),
            ("Electronic City Phase 1", 12.8399, 77.6770),
            ("Indiranagar 100ft Road", 12.9784, 77.6408),
            ("Whitefield Main Road", 12.9698, 77.7499),
            ("Yelahanka New Town", 13.0991, 77.5924),
            ("BTM Layout 2nd Stage", 12.9166, 77.6101),
            ("HSR Layout Sector 1", 12.9121, 77.6446),
            ("Jayanagar 4th Block", 12.9299, 77.5824),
            ("MG Road Metro Station", 12.9756, 77.6066),
            ("Hebbal Flyover Junction", 13.0358, 77.5970),
            ("Malleshwaram 8th Cross", 13.0031, 77.5643),
            ("Banashankari 3rd Stage", 12.9250, 77.5468),
            ("Bellandur EcoSpace", 12.9260, 77.6762),
            ("Sarjapur Road Wipro Gate", 12.9080, 77.6840),
            ("Marathahalli Bridge", 12.9569, 77.7011),
            ("KR Puram Railway Station", 13.0012, 77.6965),
            ("Rajajinagar 1st Block", 12.9980, 77.5530),
            ("Domlur Intermediate Ring Road", 12.9609, 77.6387),
            ("Richmond Town Circle", 12.9647, 77.6012),
            ("Ulsoor Lake Promenade", 12.9818, 77.6200),
            ("Basavanagudi Bull Temple Rd", 12.9431, 77.5683),
            ("Frazer Town Mosque Road", 12.9972, 77.6134),
            ("Cantonment Railway Station", 12.9935, 77.5984),
        ]

        dog_breeds = [
            "Indian Pariah / Desi", "Street Mongrel", "Indie Pariah Mix", "Tabby Mix",
            "Indian Hound Mix", "Desi Shepherd Cross", "Indie Short-hair", "Labrador Cross"
        ]
        photos = [
            "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1520087619230-ce89772969f8?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1514984879728-be0aff75a6e8?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1510771463146-e89e6e86560e?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=400&auto=format&fit=crop",
        ]

        created_dogs = []
        for i in range(1, 26):
            public_code = f"PAW-{i:04d}"
            animal_id = f"DOG-{1000 + i}"
            area_name, lat, lng = bengaluru_areas[i - 1]
            breed_name = dog_breeds[i % len(dog_breeds)]
            photo_url = photos[(i - 1) % len(photos)]

            existing_dog = db.query(Dog).filter(Dog.public_code == public_code).first()
            if not existing_dog:
                d = Dog(
                    public_code=public_code,
                    animal_id=animal_id,
                    name=f"Stray {public_code}",
                    sex="male" if i % 2 == 0 else "female",
                    approx_age=f"{1 + (i % 5)} years",
                    colour_markings="Tan & White chest patch" if i % 2 == 0 else "Brown brindle Coat",
                    species="Dog",
                    breed=breed_name,
                    breed_source="ai" if i % 3 == 0 else "human",
                    temperament="Friendly / Community Fed" if i % 2 == 0 else "Timid / Alert",
                    sterilised="yes" if i % 2 == 0 else "no",
                    ear_notch=True if i % 2 == 0 else False,
                    health_status="Healthy / Sterilized" if i % 2 == 0 else "Under Medical Care",
                    disease_name="Normal" if i % 2 == 0 else "Dermatitis Treated",
                    disease_confidence=98.5 if i % 2 == 0 else 85.0,
                    status="active_care",
                    primary_photo=photo_url,
                    image_url=photo_url,
                    location=f"{area_name}, Bengaluru",
                    location_lat=lat,
                    location_lng=lng,
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(days=i)
                )
                db.add(d)
                db.commit()
                db.refresh(d)
                created_dogs.append(d)
            else:
                created_dogs.append(existing_dog)

        print(f"[DEMO SEED] Successfully created/verified {len(created_dogs)} dogs.")

        # 4. Vaccinations for Dogs
        for idx, d in enumerate(created_dogs[:15]):
            v_exist = db.query(Vaccination).filter(Vaccination.dog_id == d.id).first()
            if not v_exist:
                vac = Vaccination(
                    dog_id=d.id,
                    vaccine="rabies" if idx % 2 == 0 else "DHPP",
                    date_given=datetime.datetime.utcnow() - datetime.timedelta(days=30 * (idx + 1)),
                    next_due=datetime.datetime.utcnow() + datetime.timedelta(days=365 - (30 * (idx + 1))),
                    given_by="BBMP Drive Unit #3",
                    notes="Anti-Rabies Drive Tagged"
                )
                db.add(vac)
        db.commit()
        print("[DEMO SEED] Created vaccination records.")

        # 5. 10 Complaints
        complaint_types = [
            ("Hit & Run Trauma", "CRITICAL", "Severe leg fracture near flyover slip road."),
            ("Severe Demodicosis Mange", "HIGH", "Widespread skin loss and hair thinning."),
            ("Bite Wound Scrape", "MEDIUM", "Minor fight injury with localized swelling."),
            ("Stray Pack Feeding Need", "LOW", "Sub-pack requires ARV booster & deworming."),
            ("Puppy Litter Distress", "HIGH", "Litter of 4 stranded near storm drain."),
            ("Deep Scrape & Limping", "HIGH", "Limping heavily near busy intersection."),
            ("Dehydration & Weakness", "MEDIUM", "Lying unresponsive in shade."),
            ("Rabies Vaccination Request", "LOW", "Community request for street dog vaccination."),
            ("Sterilization ABC Drive", "LOW", "Ear notch missing for 2 street dogs."),
            ("Ear Infection & Scratching", "MEDIUM", "Discharge and continuous scratching."),
        ]

        for i in range(1, 11):
            public_id = f"CMP-{i:04d}"
            existing_c = db.query(Complaint).filter(Complaint.public_id == public_id).first()
            if not existing_c:
                itype, urg, desc = complaint_types[i - 1]
                area_name, lat, lng = bengaluru_areas[i - 1]
                cmp = Complaint(
                    public_id=public_id,
                    dog_id=created_dogs[i - 1].id if i <= len(created_dogs) else None,
                    issue_type=itype,
                    urgency=urg,
                    description=desc,
                    photo=photos[i % len(photos)],
                    lat=lat,
                    lng=lng,
                    address=area_name,
                    city="Bengaluru",
                    state="Karnataka",
                    status="reported" if i % 3 == 0 else ("team_dispatched" if i % 3 == 1 else "in_progress"),
                    assigned_org_id=orgs[0].id if i % 2 == 0 else orgs[1].id,
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=i * 2)
                )
                db.add(cmp)
        db.commit()
        print("[DEMO SEED] Successfully created 10 complaints.")

        # 6. 6 Lost & Found Posts
        lost_found_samples = [
            ("lost", "Bruno", "Golden Retriever Mix", "Lost near Koramangala 4th Block Park"),
            ("found", "Unidentified Desi", "Indian Pariah / Desi", "Spotted roaming near DSU Gate 2"),
            ("lost", "Rocky", "Beagle Cross", "Black collar with silver tag lost in BTM"),
            ("found", "Indie Pup", "Street Mongrel", "Found near Indiranagar Metro Station"),
            ("lost", "Simba", "German Shepherd Mix", "Microchipped, missing from HSR Layout"),
            ("found", "White Desi Dog", "Indian breed", "Friendly, sitting at Whitefield Main Rd"),
        ]
        for i, (kind, name, breed, desc) in enumerate(lost_found_samples, 1):
            area_name, lat, lng = bengaluru_areas[i]
            post = LostFoundPost(
                kind=kind,
                dog_name=name,
                breed=breed,
                colour_markings="Tan / Brown" if i % 2 == 0 else "White & Black",
                photo=photos[i % len(photos)],
                lat=lat,
                lng=lng,
                address=area_name,
                city="Bengaluru",
                state="Karnataka",
                status="open",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=i)
            )
            db.add(post)
        db.commit()
        print("[DEMO SEED] Successfully created 6 Lost & Found posts.")

        # 7. Contacts (Left Unverified for Admin Verification Flow)
        contact_samples = [
            {"name": "CUPA Emergency Animal Helpline", "type": "Helpline", "phone": "+91 80 2294 7300", "email": "help@cupa.org", "is_24x7": True, "verified": False},
            {"name": "DSU Animal Welfare & Vet Unit", "type": "Vet Hospital", "phone": "+91 80 4216 1700", "email": "vet@dsu.edu.in", "is_24x7": False, "verified": False},
            {"name": "CARE Charlie's Animal Rescue", "type": "Vet Hospital", "phone": "+91 94839 11110", "email": "care@charlies.org", "is_24x7": True, "verified": False},
            {"name": "BBMP Animal Birth Control (ABC)", "type": "ABC Center", "phone": "+91 80 2222 1188", "email": "abc@bbmp.gov.in", "is_24x7": False, "verified": False},
        ]
        for c in contact_samples:
            c_exist = db.query(Contact).filter(Contact.name == c["name"]).first()
            if not c_exist:
                cnt = Contact(**c)
                db.add(cnt)
        db.commit()
        print("[DEMO SEED] Successfully created contacts (unverified as required).")

        print("=========================================================")
        print("  DEMO SEED COMPLETED SUCCESSFULLY!                      ")
        print("=========================================================")
    except Exception as e:
        print(f"[DEMO SEED ERROR] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
