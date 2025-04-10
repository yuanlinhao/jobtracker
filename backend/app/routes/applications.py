from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict
from sqlalchemy import desc

from app.schemas.application import ApplicationCreate, ApplicationOut, ApplicationUpdate
from app.models.application import Application
from app.models.application_tag import ApplicationTag
from app.models.tag import Tag
from app.models.user import User
from app.database import SessionLocal
from app.core.auth import get_current_user
from app.schemas.tag import TagOut

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

@router.get("/", response_model=List[ApplicationOut])
def get_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).order_by(desc(Application.created_at)).all()

    result = []
    for app in apps:
        tags_by_field = {}
        for assoc in app.application_tags:
            field = assoc.field
            tag = assoc.tag
            if field not in tags_by_field:
                tags_by_field[field] = []
            tags_by_field[field].append(TagOut.from_orm(tag))

        app_data = ApplicationOut(
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
        )
        result.append(app_data)

    return result


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application_by_id(
    application_id: UUID = Path(..., description="The ID of the application to retrieve"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == application_id).first()
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

    update_data = app_in.dict(exclude_unset=True, exclude={"tags"})
    if "url" in update_data and update_data["url"] is not None:
        update_data["url"] = str(update_data["url"])

    for key, value in update_data.items():
        setattr(app, key, value)

    if app_in.tags is not None:
        app.application_tags.clear()
        for tag_data in app_in.tags:
            tag = db.query(Tag).filter(Tag.id == tag_data.tag_id, Tag.user_id == current_user.id).first()
            if not tag:
                raise HTTPException(status_code=400, detail=f"Invalid tag ID: {tag_data.tag_id}")
            assoc = ApplicationTag(tag_id=tag.id, field=tag_data.field)
            app.application_tags.append(assoc)

            for assoc in app.application_tags:
                tag = db.query(Tag).filter(Tag.id == assoc.tag_id).first()
                if tag and assoc.field in Application.__table__.columns:
                    setattr(app, assoc.field, tag.name)

    db.commit()
    db.refresh(app)

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

    db.delete(app)
    db.commit()
    return
