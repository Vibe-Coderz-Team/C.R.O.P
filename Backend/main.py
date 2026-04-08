import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from dateutil import parser as date_parser
from collections import Counter
from typing import Optional

# ── Local modules ──────────────────────────────────────────
from models import (
    Base, engine, SessionLocal,
    Resource, Booking, IssueReport,
    ResourceType, ResourceStatus, ResourceCategory
)
from seed import seed_database
from schemas import (
    BookingRequest, BookingResponse, ResourceOut, 
    IssueReportRequest, ResourceCreate
)
from predictor import predict_busyness

# ── App Initialization ─────────────────────────────────────
app = FastAPI(
    title="Campus Resource Optimizer",
    description=(
        "Tracks, predicts, and optimizes campus resource usage.\n\n"
        "Solves: library overcrowding, LPG shortages, water scarcity, "
        "booking confusion, and student budget waste."
    ),
    version="1.0.0",
)

# Allow all origins (needed so frontend team can hit API from localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Create DB tables on startup ────────────────────────────
Base.metadata.create_all(bind=engine)


# ── Dependency: DB Session ─────────────────────────────────
def get_db():
    """Yields a database session and ensures it's closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==============================================================
#  ENDPOINT 1 — GET /resources
#  Returns all campus resources with live availability status.
# ==============================================================
@app.get("/resources", response_model=list[ResourceOut], tags=["Resources"])
def get_all_resources(
    resource_type: Optional[ResourceType] = None,
    db: Session = Depends(get_db)
):
    """
    List all campus resources.
    - Optionally filter by type.
    - Shows current status (Available / Booked / Scarce / Maintenance)
    """
    query = db.query(Resource)
    if resource_type:
        query = query.filter(Resource.type == resource_type)
    return query.all()


# ==============================================================
#  ENDPOINT 2 — POST /book
#  Creates a booking with conflict detection.
# ==============================================================
@app.post("/book", response_model=BookingResponse, tags=["Bookings"])
def create_booking(payload: BookingRequest, db: Session = Depends(get_db)):
    """
    Book a campus resource for a time window.
    """
    # ── Fetch the resource ─────────────────────────────────
    resource = db.query(Resource).filter(Resource.id == payload.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found.")

    # ── Block unavailable resources ────────────────────────
    if resource.status in [ResourceStatus.SCARCE, ResourceStatus.MAINTENANCE]:
        raise HTTPException(
            status_code=503,
            detail=(
                f"'{resource.name}' is currently {resource.status.value}. "
                "Admin must restore availability before bookings resume."
            )
        )

    # ── Parse and validate time window ────────────────────
    try:
        start = date_parser.parse(payload.start_time)
        end   = date_parser.parse(payload.end_time)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid datetime format.")

    if end <= start:
        raise HTTPException(status_code=400, detail="end_time must be after start_time.")

    # ── Overlap Detection ─────────────────────────────────
    conflict = db.query(Booking).filter(
        Booking.resource_id == payload.resource_id,
        Booking.start_time  <  end,
        Booking.end_time    >  start,
    ).first()

    if conflict:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Booking conflict! '{resource.name}' is already reserved "
                f"from {conflict.start_time.strftime('%H:%M')} "
                f"to {conflict.end_time.strftime('%H:%M')}."
            )
        )

    # ── Create the booking ─────────────────────────────────
    booking = Booking(
        resource_id = payload.resource_id,
        user_id     = payload.user_id,
        start_time  = start,
        end_time    = end,
        purpose     = payload.purpose,
    )
    db.add(booking)

    # ── Update resource status to Booked ──────────────────
    resource.status = ResourceStatus.BOOKED
    db.commit()
    db.refresh(booking)

    return booking


# ==============================================================
#  ENDPOINT 3 — GET /admin/dashboard
#  Key stats for the judge demo / admin panel.
# ==============================================================
@app.get("/admin/dashboard", tags=["Admin"])
def admin_dashboard(db: Session = Depends(get_db)):
    """
    Returns operational stats for judges and campus admins.
    """
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end   = today_start + timedelta(days=1)

    # ── Today's bookings ───────────────────────────────────
    todays_bookings = db.query(Booking).filter(
        Booking.start_time >= today_start,
        Booking.start_time <  today_end,
    ).all()

    total_today = len(todays_bookings)

    # ── Most popular resource (all time) ──────────────────
    all_bookings = db.query(Booking).all()
    if all_bookings:
        resource_counts = Counter(b.resource_id for b in all_bookings)
        top_resource_id = resource_counts.most_common(1)[0][0]
        top_resource    = db.query(Resource).filter(Resource.id == top_resource_id).first()
        most_popular    = {
            "id":       top_resource.id,
            "name":     top_resource.name,
            "type":     top_resource.type,
            "bookings": resource_counts[top_resource_id],
        }
    else:
        most_popular = None

    # ── Resource utilization by type ──────────────────────
    all_resources = db.query(Resource).all()
    utilization = {}
    for r in all_resources:
        rtype = r.type.value
        if rtype not in utilization:
            utilization[rtype] = {"total": 0, "booked": 0, "scarce": 0, "maintenance": 0}
        utilization[rtype]["total"] += 1
        if r.status == ResourceStatus.BOOKED:
            utilization[rtype]["booked"] += 1
        elif r.status == ResourceStatus.SCARCE:
            utilization[rtype]["scarce"] += 1
        elif r.status == ResourceStatus.MAINTENANCE:
            utilization[rtype]["maintenance"] += 1

    # ── Scarcity & Maintenance Alerts ──────────────────────
    issue_alerts = [
        {"id": r.id, "name": r.name, "type": r.type, "status": r.status.value}
        for r in all_resources if r.status in [ResourceStatus.SCARCE, ResourceStatus.MAINTENANCE]
    ]

    # ── Mock Student Usage Tracker ────────────────────────
    user_counts = Counter(b.user_id for b in all_bookings)
    top_users = [
        {"user_id": uid, "total_bookings": cnt}
        for uid, cnt in user_counts.most_common(5)
    ]

    # ── Library Peak Times (exam season proxy) ─────────────
    library_bookings = [
        b for b in all_bookings
        if db.query(Resource).filter(Resource.id == b.resource_id).first().type
        == ResourceType.LIBRARY_SEAT
    ]
    lib_hour_counts = Counter(b.start_time.hour for b in library_bookings)
    library_peak_hour = (
        max(lib_hour_counts, key=lib_hour_counts.get)
        if lib_hour_counts else None
    )

    return {
        "summary": {
            "total_bookings_today": total_today,
            "total_bookings_all_time": len(all_bookings),
            "total_resources": len(all_resources),
            "active_issues": len(issue_alerts),
        },
        "most_popular_resource": most_popular,
        "utilization_by_type": utilization,
        "actionable_alerts": issue_alerts,
        "top_users_by_bookings": top_users,
        "library_peak_hour": (
            f"{library_peak_hour}:00" if library_peak_hour is not None else "No data"
        ),
    }


# ==============================================================
#  ENDPOINT 4 — GET /predict/{resource_id} 
#  AI-style busyness predictor.
# ==============================================================
@app.get("/predict/{resource_id}", tags=["Smart Insights"])
def predict_resource_busyness(
    resource_id: int,
    hour: Optional[int] = None,          
    day_of_week: Optional[int] = None,   
    db: Session = Depends(get_db)
):
    """
    Returns a predicted busyness score (0–100%) for a resource.
    """
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found.")

    now         = datetime.now()
    target_hour = hour        if hour        is not None else now.hour
    target_day  = day_of_week if day_of_week is not None else now.weekday()

    bookings = db.query(Booking).filter(Booking.resource_id == resource_id).all()

    prediction = predict_busyness(
        resource_type = resource.type,
        hour          = target_hour,
        day_of_week   = target_day,
        capacity      = resource.capacity,
        historical_bookings = bookings,
    )

    return {
        "resource_id":   resource_id,
        "resource_name": resource.name,
        "resource_type": resource.type,
        "predicted_for": {
            "hour":        f"{target_hour:02d}:00",
            "day":         ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][target_day],
        },
        "busyness_score":   prediction["score"],
        "busyness_label":   prediction["label"],
        "recommendation":   prediction["recommendation"],
        "contributing_factors": prediction["factors"],
    }


# ==============================================================
#  ENDPOINT 5 — POST /report-issue
#  Allows Students/Teachers to report broken resources.
# ==============================================================
@app.post("/report-issue", tags=["Issues"])
def report_issue(payload: IssueReportRequest, db: Session = Depends(get_db)):
    """
    Logs an issue and auto-flags the resource as MAINTENANCE.
    """
    resource = db.query(Resource).filter(Resource.id == payload.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found.")
    
    new_issue = IssueReport(
        resource_id=payload.resource_id,
        reported_by=payload.reported_by,
        issue_description=payload.issue_description
    )
    db.add(new_issue)
    
    resource.status = ResourceStatus.MAINTENANCE
    db.commit()
    
    return {"message": f"Issue reported. '{resource.name}' flagged for maintenance."}


# ==============================================================
#  ENDPOINT 6 — POST /admin/resources
#  Allows Management to add new locations dynamically.
# ==============================================================
@app.post("/admin/resources", response_model=ResourceOut, tags=["Admin"])
def create_new_location(
    payload: ResourceCreate, 
    db: Session = Depends(get_db)
):
    """
    Add a new campus resource to the database on the fly.
    """
    new_resource = Resource(
        name=payload.name,
        category=payload.category,
        type=payload.type,
        capacity=payload.capacity,
        current_level=payload.current_level,
        allowed_roles=payload.allowed_roles,
        status=ResourceStatus.AVAILABLE 
    )
    
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    
    return new_resource


# ==============================================================
#  ENDPOINT 7 — PATCH /admin/resource/{resource_id}/status
#  Admin override to fix or close resources.
# ==============================================================
@app.patch("/admin/resource/{resource_id}/status", tags=["Admin"])
def update_resource_status(
    resource_id: int,
    status: ResourceStatus,
    db: Session = Depends(get_db)
):
    """
    Admin override to manually update resource status.
    """
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found.")

    old_status   = resource.status
    resource.status = status
    db.commit()

    return {
        "message":    f"Status updated for '{resource.name}'.",
        "old_status": old_status,
        "new_status": status,
    }


# ==============================================================
#  ENTRY POINT
# ==============================================================
if __name__ == "__main__":
    print("🌱  Seeding database with demo resources...")
    seed_database()
    print("✅  Database ready.")
    print("🚀  Starting Campus Resource Optimizer API...")
    print("📖  Swagger UI → http://127.0.0.1:8000/docs\n")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)