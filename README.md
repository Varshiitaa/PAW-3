# 🐾 StreetPaw.AI — Collaborative Multi-Agent AI Platform for Stray Animal Care & Welfare

> **Dayananda Sagar University — School of Engineering**  
> Department of Computer Science & Engineering | Major Project Phase-I & II (2026-2027)  
> **Supervised by**: Prof. Nandini K  
> **Team**: Varshita Chauhan (ENG23CS0492), Vrinda M (ENG23CS0499), Y Geyasri (ENG23CS0500), Chinmayee V (ENG23CS0540)

---

## 🌟 Architecture Overview

```mermaid
flowchart TD
    subgraph Frontend Applications
        CA["Citizen Web App (Vite + React) :5173"]
        NP["NGO Operations Portal (Vite + React) :5174"]
    end

    subgraph Backend Engine (FastAPI :8000)
        AUTH["JWT & Argon2 Auth Router"]
        DOGS["Digital Animal Registry Router"]
        RESCUE["Distress & Ambulance Rescue Router"]
        LF["Lost & Found Smart Matcher"]
        CHAT["Pawly SSE LLM Assistant (Claude API)"]
        AI["Multi-Model Vision Engine"]
        EXPORTS["openpyxl Excel / CSV Exporter"]
        ANALYTICS["SQL Analytics Engine"]
    end

    subgraph AI Vision Models
        YOLO["YOLOv8 Animal Detection"]
        BREED["EfficientNet-B3 Breed Classifier"]
        DISEASE["EfficientNet-B3 Skin Disease Classifier"]
        REID["ResNet-50 Visual Re-ID Embeddings"]
    end

    subgraph Database
        DB[("SQLite / PostgreSQL Database (streetpaw.db)")]
    end

    CA -->|REST / SSE| AUTH
    CA -->|Scan & Registry| DOGS
    CA -->|SOS Dispatch| RESCUE
    CA -->|Lost & Found| LF
    CA -->|Pawly Floating Chat| CHAT

    NP -->|Kanban & Table Dispatch| RESCUE
    NP -->|GIS Map & Heatmap| DOGS
    NP -->|User & Org Approvals| AUTH
    NP -->|Analytics & PNG/Excel Exports| EXPORTS

    AI --> YOLO
    AI --> BREED
    AI --> DISEASE
    AI --> REID

    AUTH --> DB
    DOGS --> DB
    RESCUE --> DB
    LF --> DB
    EXPORTS --> DB
    ANALYTICS --> DB
```

---

## 🔐 Role & Permission Matrix

| Function / Endpoint | Citizen | Volunteer | NGO Staff | Govt Official | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Self Sign-Up** | Instant Active | Instant Active | Pending Approval | Pending Approval | Script Created |
| **Scan Photo (Vision AI)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Register / View Dogs** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit Registered Dogs** | Own Dogs Only | Own Dogs Only | Org Service Area | Org Service Area | System-Wide |
| **Soft Delete & 10s Undo** | Own Dogs Only | Own Dogs Only | Org Service Area | Org Service Area | System-Wide (Anytime) |
| **File Distress Case (SOS)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Update Rescue Status (Kanban)** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Post Lost & Found Dog** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Access NGO Portal** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **User Status & Approvals** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Audit Logs & Excel Exports** | ❌ | ❌ | ✅ (Area) | ✅ (Area) | ✅ (Full System) |

---

## 📋 Requirement Status Checklist

| Req # | Module Name | Implementation Status | Automated Test Proof | Key Features & Coverage |
| :---: | :--- | :---: | :---: | :--- |
| **V3-1** | Unified Schema & Database | **WORKING** | `test_flow_a`, `test_flow_b` | 13 SQLite tables (`users`, `organisations`, `dogs`, `dog_locations`, `dog_profiles`, `rescues`, `complaints`, `vaccinations`, `health_events`, `lost_found_posts`, `lost_found_matches`, `contacts`, `audit_logs`). |
| **V3-2** | Authentication & RBAC | **WORKING** | `test_flow_f`, `test_flow_g` | Argon2 password hashing, 15-min JWT access tokens, httpOnly refresh cookies, login rate limiting (5 attempts/min), `require_role(...)` enforcement. |
| **V3-3** | Scan Page Redesign | **WORKING** | `test_flow_a` | 3 Icon-led vision flows (What animal is this?, What breed is it?, Any health concern?), drag-and-drop preview, soft light sweep scan animation, context badge pass-through. |
| **V3-4** | Interactive India GIS Map | **WORKING** | `test_flow_a`, `test_flow_c` | Leaflet + OpenStreetMap tiles restricted to India bounds `[[6.0, 68.0], [37.5, 98.0]]`, Nominatim Bengaluru geocoder, status-coloured pins, cluster markers, mobile bottom sheet. |
| **V3-5** | Digital Animal Registry | **WORKING** | `test_flow_a`, `test_flow_b` | Full CRUD on `dogs` table, public PAW codes (`PAW-0001`), vaccination tracking, health events, soft delete with 10s undo window, and Re-ID duplicate checker. |
| **V3-6** | Directory & Emergency Contacts | **WORKING** | `test_flow_f` | Managed directory backed by `contacts` table, verified/unverified badges, one-tap `tel:` and WhatsApp `wa.me` buttons, search & state/city filtering. |
| **V3-7** | Floating Pawly Chatbot | **WORKING** | `test_flow_e` | SSE streaming chat assistant powered by Anthropic Claude API via backend endpoint, rate-limiting, context badge attachment, and limited offline FAQ fallback. |
| **V3-8** | Lost & Found Matcher | **WORKING** | `test_flow_d` | Lavender-tinted sliding pill tab interface, radius/breed/colour smart matching with match scores, phone number privacy, direct in-app messaging, and auto-expiration. |

---

## 🚀 Prerequisites & Setup Guide

### 1. Environment Configuration
Create a `.env` file in the `backend/` directory (refer to `backend/.env.example`):

```ini
# Core Configuration
SECRET_KEY=your-32-byte-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Anthropic Claude API (For Pawly AI Chatbot)
ANTHROPIC_API_KEY=your-anthropic-api-key-here
CHAT_MODEL=claude-3-5-sonnet-20241022

# SMTP Email Configuration (Optional - Logs link to console if unconfigured)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=no-reply@streetpaw.ai
SMTP_PASSWORD=your-smtp-password
```

### 2. Start Backend API Server
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run initial migrations and seed demo data
python scripts/create_admin.py
python scripts/seed_demo.py

# Start FastAPI server
python main.py
```
*Backend API server runs at*: `http://localhost:8000`

### 3. Start Citizen Web Application
```bash
cd apps/citizen-app
npm install
npm run dev
```
*Citizen Web App runs at*: `http://localhost:5173`

### 4. Start NGO Operations Portal
```bash
cd apps/ngo-portal
npm install
npm run dev
```
*NGO Portal runs at*: `http://localhost:5174`

---

## 🧪 Running Master Test Suite

To verify all end-to-end user flows, run the master pytest suite:

```bash
python -m pytest backend/tests/test_all_v3_requirements.py -v
```

---

## 🎙️ Viva Presentation & Live Demo Script

1. **Introduction & System Overview (2 Mins)**
   - Explain the mission of StreetPaw.AI: bridging community citizens with professional NGO/Government rescue squads through multi-agent AI vision and real-time GIS dispatch.
2. **Citizen Vision Scan & Registry (3 Mins)**
   - Open Citizen App at `http://localhost:5173/scan`.
   - Upload a stray dog photo. Trigger "What animal is this?", "What breed is it?", and "Any health concern?".
   - Click "Save to Digital Animal Registry" and note the generated public code (e.g., `PAW-0042`).
3. **Interactive India Map & Location Sighting (2 Mins)**
   - Open Map view. Show India bounding box, status-coloured pins, category filter chips (Dogs, SOS, Shelters, Feeders), and click a marker to view the profile card.
4. **Distress Rescue Lifecycle & NGO Kanban (3 Mins)**
   - From Citizen App, click "Report Emergency / SOS" with a photos and address.
   - Switch to NGO Portal at `http://localhost:5174`.
   - View the newly filed distress case on the Kanban Board under `Reported`.
   - Drag and drop the card through `Team Dispatched` -> `In Progress` -> `Resolved`. Add dispatch notes.
   - Switch back to Citizen App to show real-time status update.
5. **Pawly AI Chatbot & Context Attachment (2 Mins)**
   - Open Pawly floating widget. Ask "What should I do if a dog bites me?".
   - Demonstrate SSE streaming response, rabies first-aid advice, and context badge attachment.
6. **Lost & Found Smart Matcher (2 Mins)**
   - Post a Lost Dog report in Citizen App. Post a Found Dog report with matching breed/location.
   - Show AI match suggestion banner, confirm match, and trigger the `PawBurst` reunited celebration.
7. **Admin Security, Audit Trail & Excel Report Export (2 Mins)**
   - Log into NGO Portal as Admin (`admin_varshita`).
   - Open Admin Audit Log tab to inspect before/after diffs for edits and soft deletes.
   - Click "Export Master Excel Report" to download `.xlsx` with openpyxl formatted sheets.
