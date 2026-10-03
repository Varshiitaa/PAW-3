import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_lost_found_flow():
    print("--- STARTING LOST & FOUND API INTEGRATION TEST ---")
    session = requests.Session()

    # 1. Register & Login User A (Pet Owner)
    ts = int(time.time())
    user_a_email = f"owner_{ts}@example.com"
    user_a_pass = "OwnerPass123!"
    
    signup_a = session.post(f"{BASE_URL}/api/auth/signup", json={
        "username": f"owner_{ts}",
        "email": user_a_email,
        "password": user_a_pass,
        "full_name": "Rohan Gupta",
        "phone": "+91 98765 11111",
        "city": "Bengaluru",
        "role": "citizen"
    })
    print("User A Signup:", signup_a.status_code)
    assert signup_a.status_code in [200, 201]

    login_a = session.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": user_a_email, "password": user_a_pass})
    print("User A Login Status:", login_a.status_code)
    assert login_a.status_code == 200
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Register & Login User B (Finder)
    user_b_email = f"finder_{ts}@example.com"
    user_b_pass = "FinderPass123!"

    signup_b = session.post(f"{BASE_URL}/api/auth/signup", json={
        "username": f"finder_{ts}",
        "email": user_b_email,
        "password": user_b_pass,
        "full_name": "Anita Roy",
        "phone": "+91 98765 22222",
        "city": "Bengaluru",
        "role": "citizen"
    })
    print("User B Signup:", signup_b.status_code)
    assert signup_b.status_code in [200, 201]

    login_b = session.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": user_b_email, "password": user_b_pass})
    assert login_b.status_code == 200
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. User A Posts Lost Dog
    lost_payload = {
        "kind": "lost",
        "dog_name": "Bruno",
        "breed": "Beagle / Desi Mix",
        "colour_markings": "Tricolor Brown Black White, Blue Collar",
        "age_sex": "2 Years / Male",
        "collar_microchip": "Blue nylon collar with bell",
        "photo": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop",
        "lat": 12.9716,
        "lng": 77.6412,
        "address": "100ft Road, Indiranagar, Bengaluru",
        "city": "Bengaluru",
        "reward": "₹5,000",
        "contact_pref": "in_app"
    }

    create_lost_res = requests.post(f"{BASE_URL}/api/lost-found/", json=lost_payload, headers=headers_a)
    print("Create Lost Post Code:", create_lost_res.status_code)
    print("Create Lost Post Response:", json.dumps(create_lost_res.json(), indent=2))
    assert create_lost_res.status_code == 201
    lost_post = create_lost_res.json()
    lost_id = lost_post["id"]

    # 4. User B Posts Found Dog Nearby
    found_payload = {
        "kind": "found",
        "breed": "Beagle / Desi Mix",
        "colour_markings": "Tricolor brown black white",
        "age_sex": "Young Male",
        "collar_microchip": "Has blue collar",
        "photo": "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400&auto=format&fit=crop",
        "lat": 12.9725,
        "lng": 77.6420,
        "address": "12th Main, Indiranagar, Bengaluru",
        "city": "Bengaluru",
        "contact_pref": "in_app"
    }

    create_found_res = requests.post(f"{BASE_URL}/api/lost-found/", json=found_payload, headers=headers_b)
    print("Create Found Post Code:", create_found_res.status_code)
    print("Create Found Post Response:", json.dumps(create_found_res.json(), indent=2))
    assert create_found_res.status_code == 201
    found_post = create_found_res.json()
    found_id = found_post["id"]

    # 5. Check Smart Matching
    print("Matches on Found Post:", len(found_post["matches"]))
    assert len(found_post["matches"]) >= 1
    
    # Find match corresponding to lost_id
    target_match = next((m for m in found_post["matches"] if m["matched_post_id"] == lost_id), found_post["matches"][0])
    match_id = target_match["match_id"]
    print(f"Smart Match ID {match_id} Score: {target_match['score']}%")

    # 6. Check Phone Privacy before Match Confirmation
    get_lost_unauth = requests.get(f"{BASE_URL}/api/lost-found/{lost_id}")
    print("Unauth Lost Post Phone:", get_lost_unauth.json()["owner_phone"])
    assert get_lost_unauth.json()["phone_hidden"] is True
    assert get_lost_unauth.json()["owner_phone"] == "Hidden until match confirmed"

    # 7. User B Sends In-App Message to User A
    msg_payload = {"body": "Hi Rohan! I spotted a tricolor Beagle with a blue collar near 12th Main Indiranagar!"}
    send_msg_res = requests.post(f"{BASE_URL}/api/lost-found/posts/{lost_id}/messages", json=msg_payload, headers=headers_b)
    print("Send Message Code:", send_msg_res.status_code)
    print("Send Message Response:", json.dumps(send_msg_res.json(), indent=2))
    assert send_msg_res.status_code == 200

    # 8. User A Reads Messages
    get_msgs_res = requests.get(f"{BASE_URL}/api/lost-found/posts/{lost_id}/messages", headers=headers_a)
    print("Get Messages Response:", json.dumps(get_msgs_res.json(), indent=2))
    assert len(get_msgs_res.json()) >= 1

    # 9. User A Confirms Match
    confirm_res = requests.post(f"{BASE_URL}/api/lost-found/matches/{match_id}/confirm", headers=headers_a)
    print("Confirm Match Response:", json.dumps(confirm_res.json(), indent=2))
    assert confirm_res.status_code == 200

    # 10. Check Phone Privacy AFTER Match Confirmation
    get_lost_auth_a = requests.get(f"{BASE_URL}/api/lost-found/{lost_id}", headers=headers_a)
    get_lost_auth_b = requests.get(f"{BASE_URL}/api/lost-found/{lost_id}", headers=headers_b)
    print("Owner A viewing own phone:", get_lost_auth_a.json()["owner_phone"])
    print("Matched Finder B viewing owner phone:", get_lost_auth_b.json()["owner_phone"])
    assert get_lost_auth_b.json()["phone_hidden"] is False
    assert get_lost_auth_b.json()["owner_phone"] == "+91 98765 11111"

    # 11. User A Marks Reunited
    reunited_res = requests.patch(f"{BASE_URL}/api/lost-found/{lost_id}", json={"status": "reunited"}, headers=headers_a)
    print("Mark Reunited Response:", json.dumps(reunited_res.json(), indent=2))
    assert reunited_res.status_code == 200
    assert reunited_res.json()["status"] == "reunited"

    print("--- LOST & FOUND INTEGRATION TEST PASSED SUCCESSFULLY ---")

if __name__ == "__main__":
    test_lost_found_flow()
