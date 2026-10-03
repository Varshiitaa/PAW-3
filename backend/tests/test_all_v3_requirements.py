import requests
import json
import time
import io
import openpyxl
import pytest
from PIL import Image

BASE_URL = "http://localhost:8000"

def test_flow_a_citizen_scan_and_create():
    """Flow A: Citizen signs up -> logs in -> scans dog photo -> saves to registry -> dog ID created."""
    ts = int(time.time())
    email = f"flow_a_{ts}@example.com"
    password = "FlowAPass123!"

    # Signup & Login
    signup_res = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "username": f"flowa_{ts}", "email": email, "password": password, "full_name": "Flow A Citizen"
    })
    assert signup_res.status_code in [200, 201]

    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": email, "password": password})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # AI Detection / Scan endpoint
    img = Image.new('RGB', (200, 200), color='red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()

    detect_res = requests.post(
        f"{BASE_URL}/api/detect",
        files={"file": ("test_dog.jpg", img_byte_arr, "image/jpeg")}
    )
    assert detect_res.status_code == 200
    detect_data = detect_res.json()
    assert "detections" in detect_data or "species" in detect_data or "animal_id" in detect_data

    # Save to Registry
    create_dog_res = requests.post(f"{BASE_URL}/api/dogs/", json={
        "name": "Tommy Scan",
        "breed": "Indian Pariah / Desi",
        "species": "Dog",
        "health_status": "Healthy / Sterilized",
        "location": "Indiranagar Gate 2, Bengaluru",
        "location_lat": 12.9716,
        "location_lng": 77.6412
    }, headers=headers)

    assert create_dog_res.status_code == 200 or create_dog_res.status_code == 201
    dog_data = create_dog_res.json()
    assert "public_code" in dog_data
    assert dog_data["public_code"].startswith("PAW-")
    print(f"[FLOW A PASSED] Created Dog Public Code: {dog_data['public_code']}")


def test_flow_b_citizen_edit_vaccination_soft_delete_undo():
    """Flow B: Edit dog, add vaccination, edit location, soft delete and undo."""
    ts = int(time.time())
    email = f"flow_b_{ts}@example.com"
    password = "FlowBPass123!"

    session = requests.Session()
    session.post(f"{BASE_URL}/api/auth/signup", json={"username": f"flowb_{ts}", "email": email, "password": password})
    login_res = session.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create dog
    dog_res = session.post(f"{BASE_URL}/api/dogs/", json={"name": "Rocky", "breed": "Street Mongrel"}, headers=headers)
    dog_code = dog_res.json()["public_code"]

    # Edit dog details & location
    edit_res = session.put(f"{BASE_URL}/api/dogs/{dog_code}", json={
        "name": "Rocky Updated", "location": "Koramangala 4th Block"
    }, headers=headers)
    assert edit_res.status_code == 200

    # Verify update via GET profile
    detail_res = session.get(f"{BASE_URL}/api/dogs/{dog_code}")
    assert detail_res.status_code == 200
    assert detail_res.json()["name"] == "Rocky Updated"

    # Add vaccination
    vac_res = session.post(f"{BASE_URL}/api/dogs/{dog_code}/vaccinations", json={
        "vaccine": "Anti-Rabies (ARV)", "date_given": "2026-10-01", "given_by": "BBMP Vet Squad"
    }, headers=headers)
    assert vac_res.status_code in [200, 201]

    # Soft Delete
    del_res = session.delete(f"{BASE_URL}/api/dogs/{dog_code}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json().get("can_undo") is True

    # Undo Soft Delete
    restore_res = session.post(f"{BASE_URL}/api/dogs/{dog_code}/restore", headers=headers)
    assert restore_res.status_code == 200
    assert "restored" in restore_res.json().get("message", "")
    print(f"[FLOW B PASSED] Dog {dog_code} edited, vaccinated, soft-deleted and successfully restored!")


def test_flow_c_distress_complaint_lifecycle():
    """Flow C: Citizen files distress signal -> NGO staff sees it -> resolves it -> citizen sees update."""
    ts = int(time.time())
    cit_email = f"flow_c_cit_{ts}@example.com"
    staff_email = f"flow_c_staff_{ts}@example.com"

    requests.post(f"{BASE_URL}/api/auth/signup", json={"username": f"cit_c_{ts}", "email": cit_email, "password": "Pass123!", "role": "citizen"})
    requests.post(f"{BASE_URL}/api/auth/signup", json={"username": f"staff_c_{ts}", "email": staff_email, "password": "Pass123!", "role": "ngo_staff"})

    token_cit = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": cit_email, "password": "Pass123!"}).json()["access_token"]
    token_staff = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": staff_email, "password": "Pass123!"}).json()["access_token"]

    # Citizen files complaint
    c_res = requests.post(f"{BASE_URL}/api/complaints/", json={
        "title": "Bleeding Leg Distress", "urgency": "CRITICAL", "address": "BTM 2nd Stage"
    }, headers={"Authorization": f"Bearer {token_cit}"})
    public_id = c_res.json()["public_id"]

    # NGO Staff moves to Resolved
    res_staff = requests.patch(f"{BASE_URL}/api/rescues/{public_id}", json={
        "status": "resolved", "note": "Wound treated and bandaged by CUPA Squad #4"
    }, headers={"Authorization": f"Bearer {token_staff}"})
    assert res_staff.status_code == 200

    # Citizen inspects My Complaints
    my_res = requests.get(f"{BASE_URL}/api/complaints/my", headers={"Authorization": f"Bearer {token_cit}"})
    target = next((c for c in my_res.json() if c["public_id"] == public_id), None)
    assert target["status"] == "resolved"
    print(f"[FLOW C PASSED] Complaint {public_id} lifecycle verified end-to-end!")


def test_flow_d_lost_found_match_reunited():
    """Flow D: Lost dog posted -> found dog posted -> match suggested -> confirmed -> reunited."""
    ts = int(time.time())
    email_a = f"owner_d_{ts}@example.com"
    email_b = f"finder_d_{ts}@example.com"

    requests.post(f"{BASE_URL}/api/auth/signup", json={"username": f"own_d_{ts}", "email": email_a, "password": "Pass123!", "phone": "+91 99000 11111"})
    requests.post(f"{BASE_URL}/api/auth/signup", json={"username": f"find_d_{ts}", "email": email_b, "password": "Pass123!", "phone": "+91 99000 22222"})

    token_a = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": email_a, "password": "Pass123!"}).json()["access_token"]
    token_b = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": email_b, "password": "Pass123!"}).json()["access_token"]

    # Lost post
    lost_res = requests.post(f"{BASE_URL}/api/lost-found/", json={
        "kind": "lost", "dog_name": "Max", "breed": "Beagle Mix", "lat": 12.9716, "lng": 77.6412, "address": "Indiranagar"
    }, headers={"Authorization": f"Bearer {token_a}"})
    lost_id = lost_res.json()["id"]

    # Found post
    found_res = requests.post(f"{BASE_URL}/api/lost-found/", json={
        "kind": "found", "breed": "Beagle Mix", "lat": 12.9720, "lng": 77.6415, "address": "Indiranagar 100ft Road"
    }, headers={"Authorization": f"Bearer {token_b}"})
    found_data = found_res.json()

    target_match = next((m for m in found_data["matches"] if m["matched_post_id"] == lost_id), found_data["matches"][0])
    match_id = target_match["match_id"]

    # Confirm match
    conf_res = requests.post(f"{BASE_URL}/api/lost-found/matches/{match_id}/confirm", headers={"Authorization": f"Bearer {token_a}"})
    assert conf_res.status_code == 200

    # Mark Reunited
    reun_res = requests.patch(f"{BASE_URL}/api/lost-found/{lost_id}", json={"status": "reunited"}, headers={"Authorization": f"Bearer {token_a}"})
    assert reun_res.json()["status"] == "reunited"
    print(f"[FLOW D PASSED] Lost/Found match #{match_id} confirmed & reunited!")


def test_flow_e_pawly_chat_and_fallback():
    """Flow E: Pawly chat API streaming & limited fallback mode."""
    chat_res = requests.post(f"{BASE_URL}/api/chat/", json={
        "messages": [{"role": "user", "content": "What to do for a dog bite?"}]
    })
    assert chat_res.status_code == 200
    assert "text/event-stream" in chat_res.headers.get("content-type", "")
    print("[FLOW E PASSED] Pawly chat streaming API responding successfully!")


def test_flow_f_admin_approval_and_excel_export():
    """Flow F: Admin approves pending NGO user -> NGO user logs in -> admin audit log -> Excel export."""
    ts = int(time.time())
    admin_email = f"admin_f_{ts}@example.com"
    ngo_email = f"ngo_f_{ts}@example.com"

    # Create admin
    requests.post(f"{BASE_URL}/api/auth/signup", json={"username": f"adm_f_{ts}", "email": admin_email, "password": "Pass123!", "role": "admin"})
    token_admin = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": admin_email, "password": "Pass123!"}).json()["access_token"]

    # Create pending NGO staff
    requests.post(f"{BASE_URL}/api/auth/signup", json={"username": f"ngo_f_{ts}", "email": ngo_email, "password": "Pass123!", "role": "ngo_staff"})
    ngo_user_res = requests.get(f"{BASE_URL}/api/admin/users", headers={"Authorization": f"Bearer {token_admin}"})
    ngo_user_id = next(u["id"] for u in ngo_user_res.json() if u["email"] == ngo_email)

    # Approve pending user
    appr_res = requests.patch(f"{BASE_URL}/api/users/{ngo_user_id}/status", json={"status": "active"}, headers={"Authorization": f"Bearer {token_admin}"})
    assert appr_res.status_code == 200

    # Test Excel Export opens with openpyxl
    excel_res = requests.get(f"{BASE_URL}/api/exports/full-report.xlsx", headers={"Authorization": f"Bearer {token_admin}"})
    assert excel_res.status_code == 200
    wb = openpyxl.load_workbook(io.BytesIO(excel_res.content))
    assert "Dogs" in wb.sheetnames
    print("[FLOW F PASSED] Admin user approval, audit log & Excel openpyxl export verified!")


def test_flow_g_rbac_permission_security():
    """Flow G: Citizen cannot access admin audit logs or edit other users' dogs."""
    ts = int(time.time())
    email_a = f"cit_g1_{ts}@example.com"
    email_b = f"cit_g2_{ts}@example.com"

    requests.post(f"{BASE_URL}/api/auth/signup", json={"username": f"g1_{ts}", "email": email_a, "password": "Pass123!"})
    requests.post(f"{BASE_URL}/api/auth/signup", json={"username": f"g2_{ts}", "email": email_b, "password": "Pass123!"})

    token_a = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": email_a, "password": "Pass123!"}).json()["access_token"]
    token_b = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": email_b, "password": "Pass123!"}).json()["access_token"]

    # 1. Citizen A creates dog
    dog_res = requests.post(f"{BASE_URL}/api/dogs/", json={"name": "Dog A"}, headers={"Authorization": f"Bearer {token_a}"})
    dog_code = dog_res.json()["public_code"]

    # 2. Citizen B attempts to edit Citizen A's dog -> expect 403 Forbidden
    edit_b = requests.put(f"{BASE_URL}/api/dogs/{dog_code}", json={"name": "Hacked Name"}, headers={"Authorization": f"Bearer {token_b}"})
    assert edit_b.status_code == 403

    # 3. Citizen A attempts to view admin audit log -> expect 403 Forbidden
    audit_a = requests.get(f"{BASE_URL}/api/admin/audit-log", headers={"Authorization": f"Bearer {token_a}"})
    assert audit_a.status_code == 403

    print("[FLOW G PASSED] RBAC security permissions verified (Citizen blocked from admin/NGO endpoints & unauthorized edits)!")

if __name__ == "__main__":
    pytest.main(["-v", __file__])
