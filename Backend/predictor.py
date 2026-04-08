"""
=============================================================
  predictor.py — Smart Busyness Prediction Engine
=============================================================
  This is the "AI Wow Factor" for your hackathon demo.

  Architecture:
    - Base score from resource-type × time-of-day curves
    - Modifier for day-of-week (exam season weekdays vs weekends)
    - Historical density boost (real bookings → real signal)
    - Capped and labeled for clean output
=============================================================
"""

from typing import List
from models import ResourceType, Booking

# ==============================================================
#  HOURLY LOAD CURVES  (0–100 for each hour 0..23)
#  Updated for RBAC categories (Halls, Projector Classes, etc.)
# ==============================================================

HOURLY_CURVES: dict[ResourceType, list[int]] = {
    ResourceType.LIBRARY_SEAT: [
        5, 3, 2, 2, 3, 5,       # 00–05 (near empty)
        15, 35, 75, 85,          # 06–09 (morning exam prep surge)
        80, 70, 55, 50,          # 10–13 (class hours, moderate)
        65, 80, 90, 85,          # 14–17 (afternoon study peak)
        60, 75, 95, 90,          # 18–21 (evening/night exam cram — PEAK)
        70, 45,                  # 22–23 (winding down)
    ],
    ResourceType.LAB: [
        5, 3, 2, 2, 3, 5,
        10, 20, 55, 80,
        85, 90, 70, 60,
        75, 85, 80, 65,
        40, 30, 20, 15,
        10, 5,
    ],
    ResourceType.NORMAL_CLASS: [ # Replaces old STUDY_ROOM
        5, 3, 2, 2, 3, 5,
        10, 20, 40, 55,
        60, 65, 50, 45,
        55, 70, 75, 80,
        85, 90, 80, 65,
        40, 20,
    ],
    ResourceType.PROJECTOR_CLASS: [ # Heavily used during core class hours
        2, 2, 2, 2, 2, 5,
        20, 50, 85, 95,
        90, 85, 60, 70,
        85, 90, 75, 50,
        30, 20, 10, 5,
        2, 2,
    ],
    ResourceType.LARGE_HALL: [ # Auditoriums spike for evening events
        2, 2, 2, 2, 2, 2,
        5, 10, 20, 30,
        40, 50, 30, 20,
        40, 60, 85, 95,
        90, 80, 60, 30,
        10, 5,
    ],
    ResourceType.LPG_STATION: [
        5, 2, 2, 2, 5, 10,
        30, 85, 90,             # Breakfast rush 6–9am
        30, 20, 15,
        80, 95, 85,             # Lunch rush 12–2pm
        25, 20, 15,
        10, 75, 90, 85,         # Dinner rush 7–9pm
        30, 10,
    ],
    ResourceType.WATER_POINT: [
        5, 3, 3, 3, 5, 15,
        40, 70, 80,             # Morning surge
        65, 55, 50,
        75, 80, 70,             # Post-lunch heat
        65, 70, 75,
        60, 50, 40,
        30, 20, 10,
    ],
    ResourceType.LIBRARY_BOOK: [
        10, 10, 10, 10, 10, 10,
        20, 30, 40, 50,
        50, 50, 40, 40,
        50, 60, 50, 40,
        30, 20, 10, 10,
        10, 10,
    ]
}

# ── Day-of-week multipliers (0=Mon … 6=Sun) ────────────────
DAY_MULTIPLIERS = {
    ResourceType.LIBRARY_SEAT:    [1.10, 1.15, 1.20, 1.25, 0.95, 0.70, 0.60],
    ResourceType.LAB:             [1.10, 1.15, 1.15, 1.10, 0.90, 0.65, 0.55],
    ResourceType.NORMAL_CLASS:    [1.05, 1.10, 1.20, 1.25, 1.00, 0.75, 0.65],
    ResourceType.PROJECTOR_CLASS: [1.20, 1.20, 1.20, 1.20, 1.00, 0.40, 0.20], # Dead on weekends
    ResourceType.LARGE_HALL:      [0.60, 0.60, 0.70, 0.80, 1.20, 1.50, 1.40], # Massive weekend event spike
    ResourceType.LPG_STATION:     [1.00, 1.00, 1.00, 1.00, 1.00, 0.95, 0.90],
    ResourceType.WATER_POINT:     [1.00, 1.00, 1.00, 1.00, 1.00, 0.95, 0.90],
    ResourceType.LIBRARY_BOOK:    [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
}

# ── Labels and recommendations keyed by score range ────────
SCORE_LABELS = [
    (80, "Extremely Busy",  "Avoid if possible. Try an alternative resource or off-peak hours."),
    (60, "Very Busy",       "Expect limited availability. Book in advance."),
    (40, "Moderately Busy", "Some slots available. Book soon to be safe."),
    (20, "Lightly Used",    "Good availability. Easy to book now."),
    (0,  "Nearly Empty",    "Very low usage expected. Great time to book!"),
]

# ── Resource-type specific recommendations ─────────────────
RESOURCE_TIPS = {
    ResourceType.LIBRARY_SEAT:    "💡 Library peaks during exam weeks. Check the exam schedule before visiting.",
    ResourceType.LPG_STATION:     "⚠️ LPG supply is limited. Coordinate with mess staff and plan meals early.",
    ResourceType.WATER_POINT:     "🌡️ During heat waves, water demand spikes. Carry a bottle and refill early.",
    ResourceType.LAB:             "🖥️ Labs fill up fast before assignment deadlines.",
    ResourceType.NORMAL_CLASS:    "📚 Normal classes are great for group study when labs are full.",
    ResourceType.PROJECTOR_CLASS: "📽️ Ensure you bring the right display adapters (HDMI/Type-C) for the projector.",
    ResourceType.LARGE_HALL:      "🎤 Auditoriums are usually reserved for registered campus events on weekends.",
}

def predict_busyness(
    resource_type: ResourceType,
    hour: int,
    day_of_week: int,
    capacity: int,
    historical_bookings: List[Booking],
) -> dict:
    """
    Predicts busyness score (0–100) for a resource using real booking history.
    """
    # ── Step 1: Base score from curve ─────────────────────
    curve       = HOURLY_CURVES.get(resource_type, [50] * 24)
    base_score  = float(curve[hour % 24])

    # ── Step 2: Day-of-week multiplier ────────────────────
    day_mults   = DAY_MULTIPLIERS.get(resource_type, [1.0] * 7)
    day_mult    = day_mults[day_of_week % 7]
    day_score   = base_score * day_mult

    # ── Step 3: Historical density boost ──────────────────
    same_hour_bookings = [
        b for b in historical_bookings
        if b.start_time.hour <= hour < b.end_time.hour
    ]
    distinct_days = max(
        len(set(b.start_time.date() for b in historical_bookings)), 1
    )
    # Prevent division by zero if capacity is somehow missing
    safe_capacity = capacity if capacity and capacity > 0 else 1
    
    historical_density = min(
        len(same_hour_bookings) / (safe_capacity * distinct_days), 1.0
    )
    # Historical contribution: up to +15 points
    history_boost = historical_density * 15.0

    # ── Step 4: Combine and clip ───────────────────────────
    final_score = min(max(round(day_score + history_boost), 0), 100)

    # ── Step 5: Label and recommendation ──────────────────
    label, recommendation = "Low", "Easy availability."
    for threshold, lbl, rec in SCORE_LABELS:
        if final_score >= threshold:
            label = lbl
            recommendation = rec
            break

    # Append resource-specific tip
    tip = RESOURCE_TIPS.get(resource_type, "")
    if tip:
        recommendation = f"{recommendation} {tip}"

    # ── Step 6: Explain contributing factors ──────────────
    factors = {
        "base_score_from_time_curve": round(base_score, 1),
        "day_of_week_multiplier":     round(day_mult, 2),
        "historical_booking_boost":   round(history_boost, 1),
        "past_bookings_at_this_hour": len(same_hour_bookings),
    }

    return {
        "score":          final_score,
        "label":          label,
        "recommendation": recommendation,
        "factors":        factors,
    }