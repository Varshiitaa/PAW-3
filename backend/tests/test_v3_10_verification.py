import requests
import openpyxl
import io
import time

BASE_URL = "http://localhost:8000"

def test_v3_10_all():
    print("=== STARTING V3-10 ADVANCED NGO PORTAL INTEGRATION TEST ===")
    ts = int(time.time())

    # 1. Register & Login Admin
    admin_email = f"admin_{ts}@example.com"
    admin_pass = "AdminPass123!"
    
    signup_admin = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "username": f"admin_{ts}",
        "email": admin_email,
        "password": admin_pass,
        "full_name": "System Admin",
        "role": "admin"
    })
    print("1. Admin Signup Status:", signup_admin.status_code)

    login_admin = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": admin_email, "password": admin_pass})
    token_admin = login_admin.json()["access_token"]
    headers_admin = {"Authorization": f"Bearer {token_admin}"}
    print("1. Admin Login Successful")

    # 2. Register & Login Citizen (Non-Admin)
    cit_email = f"cit_v310_{ts}@example.com"
    cit_pass = "CitPass123!"

    signup_cit = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "username": f"cit_{ts}",
        "email": cit_email,
        "password": cit_pass,
        "full_name": "Citizen User",
        "role": "citizen"
    })
    print("2. Citizen Signup Status:", signup_cit.status_code)

    login_cit = requests.post(f"{BASE_URL}/api/auth/login", json={"username_or_email": cit_email, "password": cit_pass})
    token_cit = login_cit.json()["access_token"]
    headers_cit = {"Authorization": f"Bearer {token_cit}"}
    print("2. Citizen Login Successful")

    # 3. Test Analytics Summary & Charts & Insights Endpoints
    sum_res = requests.get(f"{BASE_URL}/api/analytics/summary", headers=headers_admin)
    print("3. Analytics Summary Code:", sum_res.status_code)
    print("   Summary Data:", sum_res.json())
    assert sum_res.status_code == 200

    charts_res = requests.get(f"{BASE_URL}/api/analytics/charts", headers=headers_admin)
    print("3. Analytics Charts Code:", charts_res.status_code)
    charts_data = charts_res.json()
    print("   Charts Data Keys:", list(charts_data.keys()))
    assert "breed_distribution" in charts_data
    assert "complaints_funnel" in charts_data

    insights_res = requests.get(f"{BASE_URL}/api/analytics/insights", headers=headers_admin)
    print("3. Analytics Insights Code:", insights_res.status_code)
    print("   Computed Insights:", insights_res.json()["insights"])
    assert len(insights_res.json()["insights"]) > 0

    # 4. Test Excel Exports & Verify Workbook Sheets / Headers with openpyxl
    full_report_res = requests.get(f"{BASE_URL}/api/exports/full-report.xlsx", headers=headers_admin)
    print("4. Full Report Excel Export Code:", full_report_res.status_code)
    assert full_report_res.status_code == 200

    wb = openpyxl.load_workbook(io.BytesIO(full_report_res.content))
    sheet_names = wb.sheetnames
    print("4. Excel Workbook Sheet Names:", sheet_names)
    assert "Dogs" in sheet_names
    assert "Complaints" in sheet_names
    assert "Vaccinations" in sheet_names

    ws_dogs = wb["Dogs"]
    headers_dogs = [cell.value for cell in ws_dogs[1]]
    print("   Dogs Sheet Headers:", headers_dogs)
    assert "Public Code" in headers_dogs

    # 5. Test Non-Admin RBAC Audit Log Protection
    audit_unauth = requests.get(f"{BASE_URL}/api/admin/audit-log", headers=headers_cit)
    print("5. Non-Admin (Citizen) Audit Log Code:", audit_unauth.status_code)
    assert audit_unauth.status_code == 403

    audit_admin = requests.get(f"{BASE_URL}/api/admin/audit-log", headers=headers_admin)
    print("5. Admin Audit Log Code:", audit_admin.status_code)
    print("   Audit Log Entries Count:", len(audit_admin.json()))
    assert audit_admin.status_code == 200
    assert len(audit_admin.json()) > 0

    print("=== V3-10 INTEGRATION VERIFICATION TEST PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_v3_10_all()
