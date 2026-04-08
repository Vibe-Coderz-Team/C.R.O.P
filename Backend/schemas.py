"""
=============================================================
  schemas.py — Pydantic Request/Response Schemas
=============================================================
  FastAPI uses these to:
    1. Validate incoming request bodies
    2. Serialize outgoing responses (RBAC compatible)
    3. Auto-generate Swagger UI docs
=============================================================
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from models import ResourceType, ResourceStatus, ResourceCategory


# ==============================================================
#  REQUEST SCHEMAS (incoming data from client)
# ==============================================================

class BookingRequest(BaseModel):
    """
    Payload for POST /book
    All fields shown in Swagger UI with examples.
    """
    resource_id: int = Field(..., example=1, description="ID of the resource to book")
    user_id: str = Field(
        ..., example="roll_2023CS101",
        description="Student roll number or mock user ID"
    )
    start_time: str = Field(
        ..., example="2026-04-10T09:00:00",
        description="ISO 8601 datetime string for booking start"
    )
    end_time: str = Field(
        ..., example="2026-04-10T11:00:00",
        description="ISO 8601 datetime string for booking end"
    )
    purpose: Optional[str] = Field(
        None, example="Exam prep — Operating Systems",
        description="Reason for booking (helps admin analytics)"
    )

class IssueReportRequest(BaseModel):
    """
    Payload for POST /report-issue
    Allows students and teachers to flag broken resources.
    """
    resource_id: int = Field(..., example=4, description="ID of the broken resource")
    reported_by: str = Field(..., example="roll_2023CS011", description="User ID reporting the issue")
    issue_description: str = Field(..., example="AC is leaking water on the desks.", description="Details of the problem")

class ResourceCreate(BaseModel):
    """
    Payload for POST /admin/resources
    Allows the frontend to dynamically add new campus locations.
    """
    name: str = Field(..., example="AB3 Data Science Lab")
    category: ResourceCategory = Field(..., example=ResourceCategory.SPATIAL)
    type: ResourceType = Field(..., example=ResourceType.LAB)
    capacity: int = Field(..., example=40)
    current_level: Optional[int] = Field(None, description="Only needed for consumables like Water/LPG")
    allowed_roles: str = Field(
        default="Student,Teacher,Management", 
        example="Teacher",
        description="Comma-separated roles allowed to book this."
    )


# ==============================================================
#  RESPONSE SCHEMAS (outgoing data to client)
# ==============================================================

class ResourceOut(BaseModel):
    """Response shape for a single Resource object sent to Next.js"""
    id:           int
    name:         str
    category:     ResourceCategory
    type:         ResourceType
    capacity:     int
    current_level: Optional[int]  # Used for Water/LPG percentages
    status:       ResourceStatus
    allowed_roles: str            # Used by frontend to filter dashboards

    class Config:
        from_attributes = True  # Allows mapping from SQLAlchemy ORM objects


class BookingResponse(BaseModel):
    """Response shape for a confirmed Booking."""
    id:          int
    resource_id: int
    user_id:     str
    start_time:  datetime
    end_time:    datetime
    purpose:     Optional[str]

    class Config:
        from_attributes = True