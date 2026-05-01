from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from dependencies.auth_dependency import get_current_user, get_project_with_access
import schemas
import models
from services import project_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=schemas.ProjectOut, status_code=201)
def create_project(
    data: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = project_service.create_project(db, data, current_user)
    result = schemas.ProjectOut.model_validate(project)
    result.task_count = len(project.tasks)
    return result


@router.get("", response_model=List[schemas.ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    projects = project_service.get_user_projects(db, current_user)
    results = []
    for p in projects:
        out = schemas.ProjectOut.model_validate(p)
        out.task_count = len(p.tasks)
        results.append(out)
    return results


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(
    project: models.Project = Depends(get_project_with_access),
):
    out = schemas.ProjectOut.model_validate(project)
    out.task_count = len(project.tasks)
    return out


@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    data: schemas.ProjectUpdate,
    project: models.Project = Depends(get_project_with_access),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if project.owner_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only owner can update project")
    updated = project_service.update_project(db, project, data)
    out = schemas.ProjectOut.model_validate(updated)
    out.task_count = len(updated.tasks)
    return out


@router.delete("/{project_id}", response_model=schemas.MessageResponse)
def delete_project(
    project: models.Project = Depends(get_project_with_access),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project_service.delete_project(db, project, current_user)
    return {"message": "Project deleted successfully"}


@router.post("/{project_id}/members", response_model=schemas.UserOut, status_code=201)
def add_member(
    data: schemas.AddMemberRequest,
    project: models.Project = Depends(get_project_with_access),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return project_service.add_member(db, project, data, current_user)


@router.delete("/{project_id}/members/{member_id}", response_model=schemas.MessageResponse)
def remove_member(
    member_id: int,
    project: models.Project = Depends(get_project_with_access),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project_service.remove_member(db, project, member_id, current_user)
    return {"message": "Member removed successfully"}
