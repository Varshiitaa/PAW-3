import sys
import os
import time
import unittest
import uuid
from fastapi.testclient import TestClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from db.database import SessionLocal, engine, Base
from db.models import User, Organisation, Dog, Complaint

client = TestClient(app)

class AuthAndPrivacyTestCase(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()
        self.uid = uuid.uuid4().hex[:6]

    def tearDown(self):
        self.db.close()

    def test_01_signup_citizen_and_duplicate_validation(self):
        email = f"citizen_{self.uid}@streetpaw.ai"
        username = f"citizen_{self.uid}"

        # Signup citizen
        res = client.post("/api/auth/signup", json={
            "email": email,
            "username": username,
            "password": "Password123!",
            "full_name": "Test Citizen",
            "role": "citizen"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["user"]["role"], "citizen")
        self.assertEqual(data["user"]["status"], "active")

        # Duplicate email test
        res_dup_email = client.post("/api/auth/signup", json={
            "email": email,
            "username": f"other_{self.uid}",
            "password": "Password123!"
        })
        self.assertEqual(res_dup_email.status_code, 400)
        self.assertIn("email already exists", res_dup_email.json()["detail"])

        # Duplicate username test
        res_dup_user = client.post("/api/auth/signup", json={
            "email": f"other_{self.uid}@streetpaw.ai",
            "username": username,
            "password": "Password123!"
        })
        self.assertEqual(res_dup_user.status_code, 400)
        self.assertIn("already taken", res_dup_user.json()["detail"])

    def test_02_login_success_and_wrong_password(self):
        username = f"login_user_{self.uid}"
        email = f"login_user_{self.uid}@streetpaw.ai"

        # Create user
        client.post("/api/auth/signup", json={
            "email": email,
            "username": username,
            "password": "Password123!",
            "role": "citizen"
        })

        # Login wrong password
        res_wrong = client.post("/api/auth/login", json={
            "username_or_email": username,
            "password": "WrongPassword!"
        })
        self.assertEqual(res_wrong.status_code, 401)

        # Login correct password
        res_correct = client.post("/api/auth/login", json={
            "username_or_email": username,
            "password": "Password123!"
        })
        self.assertEqual(res_correct.status_code, 200)
        data = res_correct.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["username"], username)

    def test_03_rate_limiting(self):
        rate_user = f"rate_limit_{self.uid}"
        # Trigger 5 failed logins to test rate limit
        for i in range(5):
            client.post("/api/auth/login", json={
                "username_or_email": rate_user,
                "password": "wrong"
            })
        
        # 6th attempt should be rate limited (429)
        res = client.post("/api/auth/login", json={
            "username_or_email": rate_user,
            "password": "wrong"
        })
        self.assertEqual(res.status_code, 429)

    def test_04_pending_organisation_user_blocking(self):
        username = f"ngo_staff_{self.uid}"
        email = f"ngo_staff_{self.uid}@cupa.org"

        # Signup NGO Staff
        res = client.post("/api/auth/signup", json={
            "email": email,
            "username": username,
            "password": "Password123!",
            "full_name": "Pending Staff",
            "role": "ngo_staff",
            "organisation_name": f"Org_{self.uid}"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["status"], "pending")

        # Login as pending staff
        res_login = client.post("/api/auth/login", json={
            "username_or_email": username,
            "password": "Password123!"
        })
        token = res_login.json()["access_token"]

        # Call get me -> Pending status is verified
        res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_me.json()["status"], "pending")

    def test_05_privacy_and_user_visibility_rule(self):
        admin_uname = f"admin_{self.uid}"
        admin_email = f"admin_{self.uid}@streetpaw.ai"

        # Admin signup
        res_admin_signup = client.post("/api/auth/signup", json={
            "email": admin_email,
            "username": admin_uname,
            "password": "AdminPassword123!",
            "role": "admin"
        })
        self.assertEqual(res_admin_signup.status_code, 200)
        admin_token = res_admin_signup.json()["access_token"]

        # Get user profile via public/unauthenticated request
        res_pub = client.get("/api/users/1")
        self.assertEqual(res_pub.status_code, 200)
        self.assertEqual(res_pub.json()["email"], "[Redacted for Privacy]")
        self.assertEqual(res_pub.json()["phone"], "[Redacted for Privacy]")

        # Get user profile via Admin request -> Full details returned
        res_adm = client.get("/api/users/1", headers={"Authorization": f"Bearer {admin_token}"})
        self.assertEqual(res_adm.status_code, 200)
        self.assertNotEqual(res_adm.json()["email"], "[Redacted for Privacy]")

if __name__ == "__main__":
    unittest.main()
