"""
=============================================================
  seed.py — Database Seeder (RBAC & Next.js Ready)
=============================================================
  Pre-populates the DB with realistic campus resources,
  categorized for Role-Based Access Control (Student/Teacher/Mgmt),
  along with 50+ historical bookings for dashboard charts.

  Run standalone:  python seed.py
=============================================================
"""

from datetime import datetime, timedelta
import random
from models import Base, engine, SessionLocal
from models import Resource, Booking, IssueReport
from models import ResourceCategory, ResourceType, ResourceStatus

# ==============================================================
#  SEED RESOURCES (Categorized & Role-Restricted)
# ==============================================================
SEED_RESOURCES = [
    # ==========================================
    #  MANAGEMENT ONLY (Consumables)
    # ==========================================
    # --- LPG Stations ---
    {
        "name": "Boys Mess LPG Station",
        "category": ResourceCategory.CONSUMABLE,
        "type": ResourceType.LPG_STATION,
        "capacity": 100,
        "current_level": 45,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Management"
    },
    {
        "name": "Girls Mess LPG Station",
        "category": ResourceCategory.CONSUMABLE,
        "type": ResourceType.LPG_STATION,
        "capacity": 100,
        "current_level": 10,
        "status": ResourceStatus.SCARCE, # Triggers the alert banner!
        "allowed_roles": "Management"
    },
    # --- Water Tanks ---
    {
        "name": "Boys Hostel Water Tank 1",
        "category": ResourceCategory.CONSUMABLE,
        "type": ResourceType.WATER_POINT,
        "capacity": 5000,
        "current_level": 80,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Management"
    },
    {
        "name": "Boys Hostel Water Tank 2",
        "category": ResourceCategory.CONSUMABLE,
        "type": ResourceType.WATER_POINT,
        "capacity": 5000,
        "current_level": 25,
        "status": ResourceStatus.SCARCE,
        "allowed_roles": "Management"
    },
    {
        "name": "Girls Hostel Water Tank 1",
        "category": ResourceCategory.CONSUMABLE,
        "type": ResourceType.WATER_POINT,
        "capacity": 5000,
        "current_level": 90,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Management"
    },
    {
        "name": "Girls Hostel Water Tank 2",
        "category": ResourceCategory.CONSUMABLE,
        "type": ResourceType.WATER_POINT,
        "capacity": 5000,
        "current_level": 15,
        "status": ResourceStatus.SCARCE,
        "allowed_roles": "Management"
    },

    # ==========================================
    #  TEACHER ONLY (Academic Labs & Projectors)
    # ==========================================
    # --- Computer Labs ---
    {
        "name": "AB1 Computer Lab 1",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LAB,
        "capacity": 60,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Teacher"
    },
    {
        "name": "AB1 Computer Lab 2",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LAB,
        "capacity": 60,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Teacher"
    },
    {
        "name": "AB2 Computer Lab 1",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LAB,
        "capacity": 50,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Teacher"
    },
    {
        "name": "AB2 Computer Lab 2",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LAB,
        "capacity": 50,
        "current_level": None,
        "status": ResourceStatus.MAINTENANCE, # Broken AC Demo for the judges
        "allowed_roles": "Teacher"
    },
    # --- Circuit & Science Labs ---
    {
        "name": "AB1 Circuit Lab 1",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LAB,
        "capacity": 40,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Teacher"
    },
    {
        "name": "AB2 Circuit Lab 2",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LAB,
        "capacity": 40,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Teacher"
    },
    {
        "name": "Applied Science Lab 1",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LAB,
        "capacity": 30,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Teacher"
    },
    {
        "name": "Applied Science Lab 2",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LAB,
        "capacity": 30,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Teacher"
    },
    # --- Projector Classrooms ---
    {
        "name": "AB1 Room 201 (Projector)",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.PROJECTOR_CLASS,
        "capacity": 70,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Teacher"
    },
    {
        "name": "AB1 Room 202 (Projector)",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.PROJECTOR_CLASS,
        "capacity": 70,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Teacher"
    },
    {
        "name": "AB2 Room 105 (Projector)",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.PROJECTOR_CLASS,
        "capacity": 65,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Teacher"
    },
    {
        "name": "AB2 Room 106 (Projector)",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.PROJECTOR_CLASS,
        "capacity": 65,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Teacher"
    },

    # ==========================================
    #  STUDENT & TEACHER (Study Spaces)
    # ==========================================
    {
        "name": "AB1 Library (Fast WiFi)",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LIBRARY_SEAT,
        "capacity": 200,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Student,Teacher"
    },
    {
        "name": "AB2 Library (Poor WiFi)",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LIBRARY_SEAT,
        "capacity": 150,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Student,Teacher"
    },

    # ==========================================
    #  EVERYONE (Auditoriums)
    # ==========================================
    {
        "name": "AB1 Audi 1",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LARGE_HALL,
        "capacity": 400,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Student,Teacher,Management"
    },
    {
        "name": "AB1 Audi 2",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LARGE_HALL,
        "capacity": 300,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Student,Teacher,Management"
    },
    {
        "name": "AB2 Audi 1",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LARGE_HALL,
        "capacity": 500,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Student,Teacher,Management"
    },
    {
        "name": "AB2 Audi 2",
        "category": ResourceCategory.SPATIAL,
        "type": ResourceType.LARGE_HALL,
        "capacity": 250,
        "current_level": None,
        "status": ResourceStatus.AVAILABLE,
        "allowed_roles": "Student,Teacher,Management"
    },
]
# ==============================================================
#  MAIN SEED FUNCTION
# ==============================================================
def seed_database():
    """
    Creates all tables (if not exist) and inserts seed data.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── Skip if already seeded ─────────────────────────
        if db.query(Resource).count() > 0:
            print("  ℹ️  Database already seeded. Skipping.")
            return

        # ── Insert Resources ───────────────────────────────
        resource_objects = []
        for r in SEED_RESOURCES:
            resource = Resource(**r)
            db.add(resource)
            resource_objects.append(resource)
        db.flush()  # Assigns IDs before we create bookings and issues

        print(f"  ✅  Inserted {len(SEED_RESOURCES)} categorized resources.")

        # ── Generate 50+ Realistic Past Bookings ───────────
        print("  ⏳  Generating historical booking data for AI predictor...")
        spatial_resources = [r for r in resource_objects if r.category == ResourceCategory.SPATIAL]
        now = datetime.now()
        
        for _ in range(60):
            res = random.choice(spatial_resources)
            days_ago = random.randint(0, 7)
            hour = random.randint(8, 18)  # 8 AM to 6 PM
            
            start_t = now - timedelta(days=days_ago)
            start_t = start_t.replace(hour=hour, minute=0, second=0, microsecond=0)
            end_t = start_t + timedelta(hours=random.randint(1, 3))
            
            # Simulated usage patterns
            purpose = "Exam Prep" if res.type == ResourceType.LIBRARY_SEAT else "Lab Assignment"
            
            booking = Booking(
                resource_id=res.id,
                user_id=f"roll_2024CS{random.randint(100, 999)}",
                start_time=start_t,
                end_time=end_t,
                purpose=purpose
            )
            db.add(booking)

        # ── Insert Active Issues for Admin Dashboard ───────
        broken_room = next((r for r in resource_objects if r.name == "Group Study Room 2"), None)
        if broken_room:
            issue = IssueReport(
                resource_id=broken_room.id,
                reported_by="roll_2023CS011",
                issue_description="AC is leaking water heavily onto the desks. Cannot study here.",
                status="Open"
            )
            db.add(issue)

        db.commit()
        print("  ✅  Inserted historical bookings and active issues.")
        print("\n  📦  Resources seeded successfully for frontend dashboards!")

    except Exception as e:
        db.rollback()
        print(f"  ❌  Seeding failed: {e}")
        raise
    finally:
        db.close()

# ── Run standalone ─────────────────────────────────────────
if __name__ == "__main__":
    print("🌱  Seeding Campus Resource Optimizer database...\n")
    seed_database()
    print("\n✅  Done! Run: python main.py")