from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models import Alert, NormalizedEvent, User
from app.schemas import DashboardSummary
from app.schemas.alert import AlertOut


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    now_utc = datetime.now(UTC)
    since = now_utc - timedelta(hours=24)
    total_events = db.query(func.count(NormalizedEvent.id)).scalar() or 0
    total_alerts = db.query(func.count(Alert.id)).scalar() or 0
    open_critical = db.query(func.count(Alert.id)).filter(Alert.status.in_(["open", "investigating"]), Alert.severity == "critical").scalar() or 0

    recent_events = (
        db.query(NormalizedEvent)
        .filter(NormalizedEvent.timestamp >= since)
        .order_by(NormalizedEvent.timestamp.asc())
        .all()
    )

    # Intelligent fallback: If fewer than 5 events in the last 24h (e.g. demo environment or paused ingest),
    # query the latest 24h activity window so graphs remain fully functional.
    if len(recent_events) < 5 and total_events > 0:
        latest_ts = db.query(func.max(NormalizedEvent.timestamp)).scalar()
        if latest_ts:
            latest_aware = aware(latest_ts)
            fallback_since = latest_aware - timedelta(hours=24)
            recent_events = (
                db.query(NormalizedEvent)
                .filter(NormalizedEvent.timestamp >= fallback_since)
                .order_by(NormalizedEvent.timestamp.asc())
                .all()
            )
            if not recent_events:
                recent_events = (
                    db.query(NormalizedEvent)
                    .order_by(NormalizedEvent.timestamp.desc())
                    .limit(300)
                    .all()
                )
                recent_events.reverse()

    return {
        "total_events": total_events,
        "total_alerts": total_alerts,
        "open_critical_alerts": open_critical,
        "events_over_time": bucket_events(recent_events),
        "alerts_by_severity": grouped(db, Alert, "severity"),
        "top_source_ips": grouped(db, NormalizedEvent, "source_ip", limit=8),
        "top_usernames": grouped(db, NormalizedEvent, "username", limit=8),
        "top_event_types": grouped(db, NormalizedEvent, "event_type", limit=8),
        "event_category_distribution": grouped(db, NormalizedEvent, "event_category"),
        "alert_status_distribution": grouped(db, Alert, "status"),
        "login_trends": bucket_logins(recent_events),
        "recent_alerts": [AlertOut.model_validate(alert) for alert in db.query(Alert).order_by(Alert.last_seen.desc()).limit(8).all()],
    }


def grouped(db: Session, model, column_name: str, limit: int = 10) -> list[dict]:
    column = getattr(model, column_name)
    query = db.query(column, func.count(model.id)).filter(column.is_not(None)).group_by(column).order_by(func.count(model.id).desc())
    return [{"label": str(label), "value": count} for label, count in query.limit(limit).all()]


def bucket_events(events: list[NormalizedEvent]) -> list[dict]:
    if not events:
        # Return 24 hourly points with 0 count so the chart renders a flat baseline
        now_hour = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
        return [{"label": (now_hour - timedelta(hours=i)).strftime("%H:00"), "value": 0} for i in range(23, -1, -1)]

    # Anchor timeline to the latest event's hour
    last_dt = aware(events[-1].timestamp).replace(minute=0, second=0, microsecond=0)
    timeline_slots = [(last_dt - timedelta(hours=i)).strftime("%H:00") for i in range(23, -1, -1)]
    buckets: dict[str, int] = {slot: 0 for slot in timeline_slots}

    for event in events:
        label = aware(event.timestamp).strftime("%H:00")
        if label in buckets:
            buckets[label] += 1
        else:
            buckets[label] = buckets.get(label, 0) + 1

    return [{"label": slot, "value": buckets[slot]} for slot in timeline_slots]


def bucket_logins(events: list[NormalizedEvent]) -> list[dict]:
    if not events:
        return []

    last_dt = aware(events[-1].timestamp).replace(minute=0, second=0, microsecond=0)
    timeline_slots = [(last_dt - timedelta(hours=i)).strftime("%H:00") for i in range(23, -1, -1)]
    buckets: dict[str, dict[str, int]] = {slot: {"failed": 0, "success": 0, "successful": 0} for slot in timeline_slots}

    has_auth = False
    for event in events:
        if event.event_category != "authentication":
            continue
        label = aware(event.timestamp).strftime("%H:00")
        if label not in buckets:
            buckets[label] = {"failed": 0, "success": 0, "successful": 0}
        if event.event_type == "failed_login":
            buckets[label]["failed"] += 1
            has_auth = True
        elif event.event_type == "successful_login":
            buckets[label]["success"] += 1
            buckets[label]["successful"] += 1
            has_auth = True

    if not has_auth:
        return []

    # Return active slots in chronological order
    active_points = [
        {"label": slot, **buckets[slot]}
        for slot in timeline_slots
        if buckets[slot]["failed"] > 0 or buckets[slot]["success"] > 0
    ]
    return active_points if active_points else [{"label": slot, **buckets[slot]} for slot in timeline_slots]


def aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=UTC)
