import io
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from db.database import get_db
from db.models import Dog, DogLocation, Vaccination, HealthEvent, Complaint, LostFoundPost, User, AuditLog
from db.audit import audit
from utils.auth import get_current_user

exports_router = APIRouter(prefix="/api/exports", tags=["Excel & CSV Data Exports"])

def style_header_row(ws):
    ws.freeze_panes = 'A2'
    header_fill = PatternFill(start_color="1E1B4B", end_color="1E1B4B", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='medium', color='1E1B4B')
    )

    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

def auto_fit_columns(ws):
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or '')
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)


# -----------------------------------------------------------------------------
# 1. EXPORT DOGS REGISTRY (.xlsx / .csv)
# -----------------------------------------------------------------------------
@exports_router.get("/dogs.xlsx")
def export_dogs_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dogs = db.query(Dog).filter(Dog.deleted_at.is_(None)).order_by(Dog.created_at.desc()).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Dogs Registry"

    headers = ["ID", "Public Code", "Name", "Breed", "Sex", "Age", "Sterilised", "Health Status", "Location", "Created At"]
    ws.append(headers)

    for d in dogs:
        ws.append([
            d.id,
            d.public_code,
            d.name or "Stray Dog",
            d.breed or "Indian Pariah / Desi",
            d.sex or "unknown",
            d.approx_age or "Unknown",
            d.sterilised or "unknown",
            d.health_status or d.status or "Healthy",
            d.location or "Bengaluru",
            d.created_at.strftime("%Y-%m-%d %H:%M") if d.created_at else ""
        ])

    style_header_row(ws)
    auto_fit_columns(ws)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    audit(db, action="export_dogs_excel", entity_type="export", entity_id="dogs_excel", actor_id=current_user.id)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=streetpaw_dogs_registry.xlsx"}
    )


# -----------------------------------------------------------------------------
# 2. EXPORT COMPLAINTS DISPATCH (.xlsx / .csv)
# -----------------------------------------------------------------------------
@exports_router.get("/complaints.xlsx")
def export_complaints_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Complaints Dispatch"

    headers = ["Public ID", "Issue Type", "Urgency", "Description", "Status", "Address", "City", "Reporter Name", "Created At"]
    ws.append(headers)

    is_admin_or_staff = current_user.role in ["admin", "ngo_staff", "govt_official"]

    for c in complaints:
        reporter = db.query(User).filter(User.id == c.reporter_id).first() if c.reporter_id else None
        reporter_name = (reporter.full_name or reporter.username) if (reporter and is_admin_or_staff) else "Verified Citizen"

        ws.append([
            c.public_id,
            c.issue_type or "Distress Signal",
            c.urgency or "HIGH",
            c.description or "",
            (c.status or "reported").upper(),
            c.address or "Bengaluru",
            c.city or "Bengaluru",
            reporter_name,
            c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else ""
        ])

    style_header_row(ws)
    auto_fit_columns(ws)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    audit(db, action="export_complaints_excel", entity_type="export", entity_id="complaints_excel", actor_id=current_user.id)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=streetpaw_complaints_dispatch.xlsx"}
    )


# -----------------------------------------------------------------------------
# 3. EXPORT LOST & FOUND DESK (.xlsx)
# -----------------------------------------------------------------------------
@exports_router.get("/lost-found.xlsx")
def export_lost_found_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    posts = db.query(LostFoundPost).order_by(LostFoundPost.created_at.desc()).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Lost & Found Posts"

    headers = ["ID", "Kind", "Dog Name", "Breed", "Colour Markings", "Address", "Status", "Reward", "Created At"]
    ws.append(headers)

    for p in posts:
        ws.append([
            p.id,
            p.kind.upper(),
            p.dog_name or "Unidentified",
            p.breed or "Indian Pariah / Desi",
            p.colour_markings or "",
            p.address or "Bengaluru",
            p.status.upper(),
            p.reward or "None",
            p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else ""
        ])

    style_header_row(ws)
    auto_fit_columns(ws)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    audit(db, action="export_lost_found_excel", entity_type="export", entity_id="lost_found_excel", actor_id=current_user.id)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=streetpaw_lost_found_registry.xlsx"}
    )


# -----------------------------------------------------------------------------
# 4. FULL MULTI-SHEET EXCEL REPORT WORKBOOK
# -----------------------------------------------------------------------------
@exports_router.get("/full-report.xlsx")
def export_full_multi_sheet_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wb = openpyxl.Workbook()

    # Sheet 1: Dogs
    ws_dogs = wb.active
    ws_dogs.title = "Dogs"
    ws_dogs.append(["ID", "Public Code", "Name", "Breed", "Sex", "Sterilised", "Status", "Location"])
    dogs = db.query(Dog).filter(Dog.deleted_at.is_(None)).all()
    for d in dogs:
        ws_dogs.append([d.id, d.public_code, d.name, d.breed, d.sex, d.sterilised, d.health_status, d.location])
    style_header_row(ws_dogs)
    auto_fit_columns(ws_dogs)

    # Sheet 2: Sightings
    ws_sightings = wb.create_sheet(title="Sightings")
    ws_sightings.append(["ID", "Dog ID", "Lat", "Lng", "Address", "City", "Recorded At"])
    sightings = db.query(DogLocation).all()
    for s in sightings:
        ws_sightings.append([s.id, s.dog_id, s.lat, s.lng, s.address, s.city, s.recorded_at.strftime("%Y-%m-%d") if s.recorded_at else ""])
    style_header_row(ws_sightings)
    auto_fit_columns(ws_sightings)

    # Sheet 3: Vaccinations
    ws_vac = wb.create_sheet(title="Vaccinations")
    ws_vac.append(["ID", "Dog ID", "Vaccine", "Date Given", "Given By", "Notes"])
    vacs = db.query(Vaccination).all()
    for v in vacs:
        ws_vac.append([v.id, v.dog_id, v.vaccine, v.date_given.strftime("%Y-%m-%d") if v.date_given else "", v.given_by, v.notes])
    style_header_row(ws_vac)
    auto_fit_columns(ws_vac)

    # Sheet 4: Health Events
    ws_events = wb.create_sheet(title="Health Events")
    ws_events.append(["ID", "Dog ID", "Date", "Type", "Description", "Source"])
    events = db.query(HealthEvent).all()
    for e in events:
        ws_events.append([e.id, e.dog_id, e.date.strftime("%Y-%m-%d") if e.date else "", e.type, e.description, e.source])
    style_header_row(ws_events)
    auto_fit_columns(ws_events)

    # Sheet 5: Complaints
    ws_cmp = wb.create_sheet(title="Complaints")
    ws_cmp.append(["Public ID", "Issue Type", "Urgency", "Status", "Address", "Created At"])
    cmps = db.query(Complaint).all()
    for c in cmps:
        ws_cmp.append([c.public_id, c.issue_type, c.urgency, c.status, c.address, c.created_at.strftime("%Y-%m-%d") if c.created_at else ""])
    style_header_row(ws_cmp)
    auto_fit_columns(ws_cmp)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    audit(db, action="export_full_report_excel", entity_type="export", entity_id="full_report_excel", actor_id=current_user.id)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=streetpaw_full_welfare_report.xlsx"}
    )
