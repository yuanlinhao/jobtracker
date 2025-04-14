from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Optional
from sqlalchemy import desc
import logging

from app.schemas.application import ApplicationCreate, ApplicationOut, ApplicationUpdate
from app.models.application import Application
from app.models.application_tag import ApplicationTag
from app.models.tag import Tag
from app.models.user import User
from app.database import SessionLocal
from app.core.auth import get_current_user
from app.schemas.tag import TagOut
from app.utils.pagination import get_pagination_params

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(filename)s:%(lineno)d - %(message)s")

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def apply_tags_to_application_fields(app: Application, db: Session):
    for assoc in app.application_tags:
        tag = db.query(Tag).filter(Tag.id == assoc.tag_id).first()
        if tag and assoc.field in Application.__table__.columns:
            setattr(app, assoc.field, tag.name)

@router.post("/", response_model=ApplicationOut, status_code=201)
def create_application(
    app_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app_data = app_in.dict(exclude={"tags"})
    if app_data.get("url"):
        app_data["url"] = str(app_data["url"])

    new_app = Application(**app_data, user_id=current_user.id)

    seen = set()
    for tag_data in app_in.tags or []:
        key = (tag_data.tag_id, tag_data.field)
        if key in seen:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate tag '{tag_data.tag_id}' for field '{tag_data.field}'"
            )
        seen.add(key)

    if app_in.tags:
        for tag_data in app_in.tags:
            tag = db.query(Tag).filter(Tag.id == tag_data.tag_id, Tag.user_id == current_user.id).first()
            if not tag:
                raise HTTPException(status_code=400, detail=f"Invalid tag ID: {tag_data.tag_id}")
            assoc = ApplicationTag(tag_id=tag.id, field=tag_data.field)
            new_app.application_tags.append(assoc)

    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    logger.info(f"User {current_user.id} created application {new_app.id}")
    tag_map = {}
    for assoc in new_app.application_tags:
        field = assoc.field
        tag_map.setdefault(field, []).append(TagOut.from_orm(assoc.tag))

    return ApplicationOut(
        id=new_app.id,
        company=new_app.company,
        position=new_app.position,
        status=new_app.status,
        location=new_app.location,
        url=new_app.url,
        notes=new_app.notes,
        created_at=new_app.created_at,
        updated_at=new_app.updated_at,
        tags=tag_map
    )

@router.get("/", response_model=Dict[str, object])
def get_applications(
    pagination: Dict[str, int] = Depends(get_pagination_params),
    status: Optional[str] = Query(None, description="Filter by application status"),
    tag_ids: Optional[List[UUID]] = Query(None),
    logic: Optional[str] = Query("OR", regex="^(OR|AND)$", description="Logic for tag filtering (OR/AND)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    taggable_fields = {"location", "position", "company"}

    # Base query: user-owned, non-deleted apps
    query = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.is_deleted == False
    )

    # Optional status filter
    if status:
        query = query.filter(Application.status == status)

    # Optional tag filtering
    if tag_ids:
        if logic == "AND":
            for tag_id in tag_ids:
                query = query.filter(
                    Application.application_tags.any(
                        ApplicationTag.tag_id == tag_id,
                        ApplicationTag.field.in_(taggable_fields)
                    )
                )
        else:  # OR logic (default)
            query = query.filter(
                Application.application_tags.any(
                    and_(
                        ApplicationTag.tag_id.in_(tag_ids),
                        ApplicationTag.field.in_(taggable_fields)
                    )
                )
            )

    # Count after all filters are applied
    total_count = query.count()

    # Fetch paginated apps
    apps = (
        query.order_by(desc(Application.created_at))
        .offset(pagination["offset"])
        .limit(pagination["limit"])
        .all()
    )

    # Format output
    result = []
    for app in apps:
        tags_by_field = {}
        for assoc in app.application_tags:
            tags_by_field.setdefault(assoc.field, []).append(TagOut.from_orm(assoc.tag))

        result.append(ApplicationOut(
            id=app.id,
            company=app.company,
            position=app.position,
            status=app.status,
            location=app.location,
            url=app.url,
            notes=app.notes,
            created_at=app.created_at,
            updated_at=app.updated_at,
            tags=tags_by_field
        ))

    logger.info(f"User {current_user.id} fetched {len(result)} applications (offset={pagination['offset']}, limit={pagination['limit']}, status={status}, tag_ids={tag_ids}, logic={logic})")

    return {
        "total": total_count,
        "applications": result
    }

@router.get("/deleted", response_model=Dict[str, object])
def get_deleted_applications(
    pagination: Dict[str, int] = Depends(get_pagination_params),
    status: Optional[str] = Query(None, description="Filter by status (optional)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.is_deleted == True
    )

    if status:
        query = query.filter(Application.status == status)

    total_count = query.count()

    apps = (
        query.order_by(desc(Application.updated_at))
        .offset(pagination["offset"])
        .limit(pagination["limit"])
        .all()
    )

    result = []
    for app in apps:
        tags_by_field = {}
        for assoc in app.application_tags:
            tags_by_field.setdefault(assoc.field, []).append(TagOut.from_orm(assoc.tag))

        result.append(ApplicationOut(
            id=app.id,
            company=app.company,
            position=app.position,
            status=app.status,
            location=app.location,
            url=app.url,
            notes=app.notes,
            created_at=app.created_at,
            updated_at=app.updated_at,
            tags=tags_by_field
        ))

    logger.info(
        f"User {current_user.id} viewed {len(result)} deleted apps "
        f"(offset={pagination['offset']}, limit={pagination['limit']}, status={status})"
    )

    return {
        "total": total_count,
        "applications": result
    }

@router.get("/{application_id}", response_model=ApplicationOut)
def get_application_by_id(
    application_id: UUID = Path(..., description="The ID of the application to retrieve"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = (
        db.query(Application)
        .filter(Application.id == application_id, Application.is_deleted == False)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this application")
    
    tag_map = {}
    for assoc in app.application_tags:
        field = assoc.field
        if field not in tag_map:
            tag_map[field] = []
        tag_map[field].append(TagOut.from_orm(assoc.tag))

    app_data = ApplicationOut(
        id=app.id,
        position=app.position,
        company=app.company,
        location=app.location,
        status=app.status,
        url=app.url,
        created_at=app.created_at,
        updated_at=app.updated_at,
        tags=tag_map
    )

    logger.info(f"User {current_user.id} accessed application {app.id}")
    return app_data

@router.patch("/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: UUID,
    app_in: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == application_id).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this application")
    if app.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot update a deleted application")

    update_data = app_in.dict(exclude_unset=True, exclude={"tags"})
    if "url" in update_data and update_data["url"] is not None:
        update_data["url"] = str(update_data["url"])
    for key, value in update_data.items():
        setattr(app, key, value)

    seen = set()
    for tag_data in app_in.tags or []:
        key = (tag_data.tag_id, tag_data.field)
        if key in seen:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate tag '{tag_data.tag_id}' for field '{tag_data.field}'"
            )
        seen.add(key)

    app.application_tags.clear()
    for tag_data in app_in.tags or []:
        tag = db.query(Tag).filter(Tag.id == tag_data.tag_id, Tag.user_id == current_user.id).first()
        if not tag:
            raise HTTPException(status_code=400, detail=f"Invalid tag ID: {tag_data.tag_id}")
        assoc = ApplicationTag(tag_id=tag.id, field=tag_data.field)
        app.application_tags.append(assoc)

    apply_tags_to_application_fields(app, db)

    db.commit()
    db.refresh(app)
    logger.info(f"User {current_user.id} updated application {app.id}")

    tag_map = {}
    for atag in app.application_tags:
        tag_out = TagOut.from_orm(atag.tag)
        tag_map.setdefault(atag.field, []).append(tag_out)

    return ApplicationOut(
        id=app.id,
        company=app.company,
        position=app.position,
        status=app.status,
        location=app.location,
        url=app.url,
        notes=app.notes,
        created_at=app.created_at,
        updated_at=app.updated_at,
        tags=tag_map
    )

@router.delete("/{application_id}", status_code=204)
def delete_application(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this application")

    app.is_deleted = True
    db.commit()
    logger.info(f"User {current_user.id} deleted application {app.id}")
    return

@router.patch("/{application_id}/restore", status_code=200)
def restore_application(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to restore this application")

    if not app.is_deleted:
        raise HTTPException(status_code=400, detail="Application is not deleted")

    app.is_deleted = False
    db.commit()
    logger.info(f"User {current_user.id} restored application {app.id}")
    return {"message": f"Application {app.id} has been restored"}


@router.delete("/{application_id}/permanent", status_code=204)
def permanent_delete_application(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not app.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="You must soft-delete the application before permanently deleting it."
        )

    db.delete(app)
    db.commit()
    logger.info(f"User {current_user.id} permanently deleted application {app.id}")
    return
