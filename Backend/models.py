"""
=============================================================
  models.py — Database Models
  SQLAlchemy ORM + SQLite (RBAC & Next.js Ready)
=============================================================
  Entities:
    - Resource    : campus asset (Lab, Library, LPG Station, etc.)
    - Booking     : time-slot reservation tied to a user
    - IssueReport : tracks broken equipment or maintenance needs
=============================================================
"""

import enum
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String,
    DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

# ── Database Setup ─────────────────────────────────────────
DATABASE_URL = "sqlite:///./campus_resources.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite + FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ==============================================================
#  ENUMS for Frontend Filtering & Validation
# ==============================================================

class ResourceCategory(str, enum.Enum):
    SPATIAL = "Spatial"
    CONSUMABLE = "Consumable"
    ASSET = "Asset"

class ResourceType(str, enum.Enum):
    LIBRARY_SEAT = "LibrarySeat"
    LIBRARY_BOOK = "LibraryBook"
    LAB = "Lab"
    NORMAL_CLASS = "NormalClass"
    PROJECTOR_CLASS = "ProjectorClass"
    LARGE_HALL = "LargeHall"
    LPG_STATION = "LPGStation"
    WATER_POINT = "WaterPoint"

class ResourceStatus(str, enum.Enum):
    AVAILABLE = "Available"
    BOOKED = "Booked"
    SCARCE = "Scarce"
    MAINTENANCE = "Maintenance"


# ==============================================================
#  MODEL 1: Resource
# ==============================================================
class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    category = Column(Enum(ResourceCategory), nullable=False)
    type = Column(Enum(ResourceType), nullable=False)
    capacity = Column(Integer, default=1)
    
    # Track percentages for consumables (e.g., LPG at 45%)
    current_level = Column(Integer, nullable=True) 
    
    status = Column(
        Enum(ResourceStatus),
        default=ResourceStatus.AVAILABLE,
        nullable=False
    )
    
    # Stores comma-separated roles e.g., "Student,Teacher"
    allowed_roles = Column(String(100), nullable=False) 

    # Relationships
    bookings = relationship("Booking", back_populates="resource", cascade="all, delete")
    issues = relationship("IssueReport", back_populates="resource", cascade="all, delete")

    def __repr__(self):
        return f"<Resource id={self.id} name='{self.name}' status={self.status}>"


# ==============================================================
#  MODEL 2: Booking
# ==============================================================
class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    user_id = Column(String(100), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    purpose = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship back to Resource
    resource = relationship("Resource", back_populates="bookings")

    def __repr__(self):
        return (
            f"<Booking id={self.id} resource_id={self.resource_id} "
            f"user='{self.user_id}' {self.start_time}→{self.end_time}>"
        )


# ==============================================================
#  MODEL 3: IssueReport
# ==============================================================
class IssueReport(Base):
    """Allows students/staff to report broken ACs, empty tanks, etc."""
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    reported_by = Column(String(100), nullable=False)
    issue_description = Column(Text, nullable=False)
    status = Column(String(50), default="Open") # Open or Resolved
    reported_at = Column(DateTime, default=datetime.utcnow)

    # Relationship back to Resource
    resource = relationship("Resource", back_populates="issues")

    def __repr__(self):
        return f"<IssueReport id={self.id} resource_id={self.resource_id} status='{self.status}'>"