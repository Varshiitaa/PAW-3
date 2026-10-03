import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_ngo_portal_e2e():
    print("=== STARTING NGO PORTAL END-TO-END DISPATCH TEST ===")
    ts = int(time.time())

    # 1. Citizen Signup & Login
    cit_email = f"citizen_{ts}@example.com"
    cit_pass = "CitPass123!"
    
    signup_cit = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "username": f"cit_{ts}",
        "email": cit_email,
        "password": cit_pass,
        "full_name": "Vikram Aditya",
        "phone": "+91 99000 12345",
        "role": "citizen"
    })
    print("1. Citizen Signup Code:", signup_cit.status_code)

    login_cit = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": cit_email, "password": cit_pass})
    token_cit = login_cit.json()["access_token"]
    headers_cit = {"Authorization": f"Bearer {token_cit}"}
    print("1. Citizen Login Successful")

    # 2. Citizen files a Distress Signal Complaint
    complaint_payload = {
        "title": "Severe Paw Fracture",
        "issue_type": "Trauma & Fracture",
        "urgency": "CRITICAL",
        "description": "Stray dog hit by vehicle near Hosur Road Flyover, active bleeding.",
        "address": "Hosur Road Flyover Slip Road, BTM Layout, Bengaluru",
        "city": "Bengaluru",
        "lat": 12.9124,
        "lng": 77.5712,
        "photo_url": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&auto=format&fit=crop"
    }

    create_res = requests.post(f"{BASE_URL}/api/complaints/", json=complaint_payload, headers=headers_cit)
    print("2. Citizen Files Complaint Code:", create_res.status_code)
    complaint_data = create_res.json()
    public_id = complaint_data["public_id"]
    print(f"2. Created Complaint Public ID: {public_id}, Initial Status: {complaint_data['status']}")

    # 3. NGO Staff Signup & Login
    staff_email = f"staff_{ts}@example.com"
    staff_pass = "StaffPass123!"

    signup_staff = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "username": f"staff_{ts}",
        "email": staff_email,
        "password": staff_pass,
        "full_name": "Dr. Ananya Roy (CUPA Vet)",
        "phone": "+91 98888 55555",
        "role": "ngo_staff"
    })
    print("3. NGO Staff Signup Code:", signup_staff.status_code)

    login_staff = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": staff_email, "password": staff_pass})
    token_staff = login_staff.json()["access_token"]
    headers_staff = {"Authorization": f"Bearer {token_staff}"}
    print("3. NGO Staff Login Successful")

    # 4. NGO Staff Views Complaints Desk
    list_res = requests.get(f"{BASE_URL}/api/rescues/", headers=headers_staff)
    print("4. Staff Sees Complaints List Code:", list_res.status_code)
    all_complaints = list_res.json()
    found_in_list = next((c for c in all_complaints if c["public_id"] == public_id), None)
    print(f"4. Staff Found Complaint in List: {found_in_list['public_id']} with status '{found_in_list['status']}'")
    assert found_in_list is not None

    # 5. NGO Staff Drags / Changes Status to 'Team Dispatched' with Note
    update_res = requests.patch(f"{BASE_URL}/api/rescues/{public_id}", json={
        "status": "team_dispatched",
        "note": "CUPA Ambulance #4 dispatched with Vet Officer Dr. Ananya. ETA 12 mins."
    }, headers=headers_staff)
    print("5. Staff Updates Status Code:", update_res.status_code)
    print("5. Staff Update Response:", json.dumps(update_res.json(), indent=2))
    assert update_res.status_code == 200

    # 6. Citizen Checks 'My Complaints' View
    my_complaints_res = requests.get(f"{BASE_URL}/api/complaints/my", headers=headers_cit)
    print("6. Citizen Views 'My Complaints' Code:", my_complaints_res.status_code)
    my_list = my_complaints_res.json()
    my_target = next((c for c in my_list if c["public_id"] == public_id), None)
    print(f"6. Citizen Instantly Sees Updated Status: '{my_target['status']}'")
    print("6. Complaint Timeline Events:", json.dumps(my_target["events"], indent=2))
    assert my_target["status"] == "team_dispatched"
    assert len(my_target["events"]) >= 2

    print("=== NGO PORTAL E2E DISPATCH TEST PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_ngo_portal_e2e()
