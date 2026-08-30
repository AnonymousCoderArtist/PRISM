from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.resource import Resource, ResourceAssignment
from backend.schemas.resource import ResourceRead, ResourceAssignmentRead

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.get("", response_model=list[ResourceRead])
def list_resources(db: Session = Depends(get_db)) -> list[ResourceRead]:
    items = db.query(Resource).order_by(Resource.id).all()
    return [ResourceRead.model_validate(i) for i in items]


@router.get("/assignments", response_model=list[ResourceAssignmentRead])
def list_assignments(db: Session = Depends(get_db)) -> list[ResourceAssignmentRead]:
    items = db.query(ResourceAssignment).order_by(ResourceAssignment.created_at.desc()).all()
    return [ResourceAssignmentRead.model_validate(i) for i in items]
