# AUDIT REPORT — StreetPaw.AI Platform

## COMMON RULES v3

### SAFETY
- Work on the current git branch. Do not delete or rename existing files unless asked.
- DO NOT TOUCH the landing hero section with the dog video (markup, styles, behaviour). Confirm at the end it still plays.
- DO NOT change AI model code, weights, or inference functions. Do not break existing API response shapes. Add adapters or new fields only.
- Only change the files this task needs. Before editing, list the files you plan to change. After, list what actually changed.

### DEFINITION OF DONE
- "Done" means it works end to end with a real database, not that the code compiles. A passing `npm run build` is NOT proof of working.
- No mock data, no hard-coded lists, no silent fallbacks to seed data in any feature you touch. If seed data is needed for demos, put it in a clearly named seed script, and never return it when the database is empty.
- For every backend endpoint you add or change, run it for real (curl or pytest) and paste the actual request and response in your final report.
- For every UI flow, state which steps you verified by running the app and which you could not verify. Do not claim anything you did not run.
- At the end, give an honest status table: Working / Partly working / Not working, with reasons. Do not write completion percentages.
- If you hit something you cannot finish, say so plainly and leave a TODO. Do not fake it.

### DATA AND SECURITY
- All writes go through the backend API and are validated server-side.
- Every endpoint added from now on checks the user's role.
- Reporter and owner phone/email are never returned in public list endpoints.
- No secrets in frontend code or in Git. Use .env and provide .env.example.
- Use Alembic (or the project's migration tool) for schema changes. Never drop existing tables or data.

---

## 1. REQUIREMENTS AUDIT SUMMARY TABLE

| # | Requirement | Status | One-Line Reason |
| :-: | :--- | :--- | :--- |
| **1** | User accounts (login, sign-up, user DB for NGOs/Govt/SHGs) | **Fake** | `AuthModal.jsx` line 13 fires `alert()` without backend requests; `users` table has 0 rows and no `/api/auth` endpoints exist. |
| **2** | Scanner identifies animal, breed if dog, disease, with 3 separate buttons | **Partly Working / Hardcoded** | PyTorch models exist on backend `/api/detect`, but `ScanPage.jsx` lines 173-196 returns static hardcoded JSON for buttons 1 & 2. |
| **3** | Help page listing helplines, emails, groups, NGOs | **Fake / Hardcoded** | `HelpContactsPage.jsx` renders a static JavaScript array of 4 phone numbers; no emails, backend API, or DB table exist. |
| **4** | Create / update / delete a dog ID | **Working** | Backend `/api/dogs` POST, PUT, DELETE operate against SQLite `streetpaw.db` and connect to `ScanPage.jsx` and `DogsPage.jsx`. |
| **5** | IDs, history and vaccination recorded and visible to admin | **Fake / Missing** | Dog IDs exist, but vaccination and history are static hardcoded text in `DogsPage.jsx` lines 191-197. No history DB tables or Admin panel exist. |
| **6** | Chatbot with API integration and fallback | **Fake / Hardcoded** | `FloatingChatbot.jsx` lines 18-24 relies on a fake 600ms `setTimeout` with hardcoded keyword responses; no `/api/chat` endpoint exists. |
| **7** | Adding a dog ID asks for location, shows on map, location editable | **Working** | `POST /api/dogs` accepts location/coords, `GET /api/dogs/pins` returns map pins, and `PUT /api/dogs/{id}` allows editing location. |
| **8** | Lost and Found for pets | **Fake / Hardcoded** | `LostFoundPage.jsx` lines 9-16 uses a fake 1200ms `setTimeout` returning a static hardcoded match for `DOG-1082` without calling `/api/animal-id`. |

---

## 2. DATABASE ANALYSIS & STATE
- **Database File**: `backend/streetpaw.db` (SQLite managed via SQLAlchemy).
- **Tables & Row Counts**:
  - `users`: **0 rows** (Columns: `id`, `email`, `hashed_password`, `full_name`, `role`, `phone`, `created_at`).
  - `dog_profiles`: **4 rows** (Columns: `id`, `animal_id`, `species`, `breed`, `health_status`, `disease_name`, `disease_confidence`, `location_lat`, `location_lng`, `image_url`, `created_at`, `location`).
  - `rescue_cases`: **0 rows** (Columns: `id`, `ticket_id`, `title`, `description`, `severity`, `status`, `latitude`, `longitude`, `landmark`, `photo_url`, `reported_by`, `assigned_ngo`, `created_at`).
- **Missing Tables**: No tables exist for `vaccinations`, `medical_history`, `helplines`, `lost_found_pets`, or `chat_logs`.

---

## 3. NGO PORTAL DATA AUDIT
- **Source of Data**: NGO portal (`apps/ngo-portal`) currently reads **local component state only**.
- `NgoDashboardPage.jsx` lines 6-10 uses a static hardcoded array `rescueCases`.
- `ActiveRescuesPage.jsx` lines 6-9 uses a static hardcoded array `activeUnits`.
- Neither page currently calls `fetch('http://localhost:8000/api/rescues')`.

---

## 4. LIST OF BUGS FOUND

1. **`apps/citizen-app/src/components/AuthModal.jsx` (Line 13)**
   - `handleSubmit` triggers JavaScript `alert()` and closes without invoking any backend authentication endpoint or updating session state.
2. **`apps/citizen-app/src/pages/ScanPage.jsx` (Lines 173-196)**
   - `runInference('classification')` and `runInference('breed')` return static hardcoded JSON objects instead of posting `FormData` to `/api/detect`.
3. **`apps/citizen-app/src/pages/DogsPage.jsx` (Lines 35-41)**
   - API fetch error catch block injects static seed fallback data into state instead of displaying an empty or error state.
4. **`apps/citizen-app/src/pages/DogsPage.jsx` (Lines 191-197)**
   - Dog detail modal renders hardcoded fake string chips (`"✓ Up-to-Date (ARV Dose 2)"` and `"Completed (Notched Right Ear)"`) for all dogs regardless of actual database fields.
5. **`apps/citizen-app/src/components/FloatingChatbot.jsx` (Lines 18-24)**
   - Chatbot uses a fake `setTimeout(..., 600)` with local string keyword matching (`userMessage.includes('bleed')`) instead of contacting a backend AI chatbot endpoint.
6. **`apps/citizen-app/src/pages/LostFoundPage.jsx` (Lines 9-16 & 68-73)**
   - Pet Lost & Found search uses a fake `setTimeout(..., 1200)` returning a hardcoded match card for `DOG-1082` with 92.4% similarity without sending image file to `/api/animal-id`.
7. **`apps/ngo-portal/src/pages/NgoDashboardPage.jsx` (Lines 6-10)**
   - Dashboard rescue incident queue uses static local state array instead of fetching live records from `http://localhost:8000/api/rescues`.
8. **`apps/ngo-portal/src/pages/ActiveRescuesPage.jsx` (Lines 6-9)**
   - Active rescue units and driver dispatches are hardcoded in local state array without real-time backend synchronization.

---

## 5. HARD-CODED AND MOCK DATA TO BE REPLACED

1. `apps/citizen-app/src/components/AuthModal.jsx`: Replace `alert()` with `POST /api/auth/login` and `POST /api/auth/signup`.
2. `apps/citizen-app/src/pages/ScanPage.jsx`: Replace static `diagnosisData` objects in `runInference` with live calls to `/api/detect`.
3. `apps/citizen-app/src/pages/HelpContactsPage.jsx`: Replace hardcoded `contacts` array with `GET /api/contacts` endpoint and database model.
4. `apps/citizen-app/src/pages/DogsPage.jsx`: Replace hardcoded vaccination and sterilization text with database fields/tables for medical records.
5. `apps/citizen-app/src/components/FloatingChatbot.jsx`: Replace `setTimeout` keyword response with FastAPI chatbot endpoint `/api/chat` backed by LLM or vector DB.
6. `apps/citizen-app/src/pages/LostFoundPage.jsx`: Replace `setTimeout` and hardcoded `DOG-1082` match card with live `POST /api/animal-id` upload and top match rendering.
7. `apps/ngo-portal/src/pages/NgoDashboardPage.jsx`: Replace hardcoded `rescueCases` array with `GET /api/rescues/` backend API call.
8. `apps/ngo-portal/src/pages/ActiveRescuesPage.jsx`: Replace hardcoded `activeUnits` with backend dispatch queue data.

---

## 6. RECOMMENDED ORDER OF FIXES

1. **Frontend AI Scan Integration (`ScanPage.jsx`)**: Wire the 3 guided buttons directly to backend `/api/detect` and `/api/animal-id` so real PyTorch vision inferences drive the UI instead of hardcoded JSON objects.
2. **User Authentication & Role Management (`AuthModal.jsx`, `backend/routers/auth_router.py`)**: Implement JWT/session auth endpoints (`POST /api/auth/signup`, `POST /api/auth/login`), populate `users` table, and expose user directory endpoint for NGOs/Govt/SHGs.
3. **NGO Portal API Integration (`NgoDashboardPage.jsx`, `ActiveRescuesPage.jsx`)**: Connect NGO portal views to FastAPI backend endpoints (`GET /api/rescues`, `GET /api/dogs`) so SOS distress reports and stray registry records reflect in real time across Citizen App and NGO Portal.
4. **Pet Lost & Found AI Matching (`LostFoundPage.jsx`)**: Connect photo upload form to `POST /api/animal-id` (OSNet cosine similarity) to display genuine visual Re-ID matches from `streetpaw.db`.
5. **Medical & Vaccination History Schema Expansion (`backend/db/models.py`, `DogsPage.jsx`)**: Add `vaccinations` and `medical_history` tables/columns to SQLite DB and replace hardcoded modal labels with dynamic DB data.
6. **AI First-Aid Chatbot Endpoint (`FloatingChatbot.jsx`, `backend/routers/chat_router.py`)**: Create a FastAPI chatbot route (`POST /api/chat`) with first-aid knowledge base or LLM API integration with structured fallback.
7. **Help Contacts Directory Endpoint (`HelpContactsPage.jsx`)**: Create `helplines` database table and backend endpoint `GET /api/contacts` to support dynamic NGO/Helpline management.
8. **Admin Control Panel**: Add dedicated Admin dashboard route for viewing systemic platform analytics, full user registry, and dog medical audit logs.
