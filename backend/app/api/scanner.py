from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models import User
from app.services.scanner import audit_website


router = APIRouter(prefix="/scanner", tags=["scanner"])


class ScanRequest(BaseModel):
    url: str


@router.post("/audit")
def scan_website(
    payload: ScanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return audit_website(db, target_url=payload.url, user_id=user.id)
