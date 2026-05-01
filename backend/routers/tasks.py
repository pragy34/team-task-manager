from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from dependencies.auth_dependency import get_current_user, get_project_with_access
import schemas
import models
from services import task_service

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["Tasks"])


@router.post("", response_model=schemas.TaskOut, status_code=201)
def create_task(
    data: schemas.TaskCreate,
    project: models.Project = Depends(get_project_with_access),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return task_service.create_task(db, project, data, current_user)


@router.get("", response_model=List[schemas.TaskOut])
def list_tasks(
    project: models.Project = Depends(get_project_with_access),
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
):
    return task_service.get_project_tasks(db, project.id, status, priority)


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    task_id: int,
    project: models.Project = Depends(get_project_with_access),
    db: Session = Depends(get_db),
):
    return task_service.get_task(db, task_id, project.id)


@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    data: schemas.TaskUpdate,
    project: models.Project = Depends(get_project_with_access),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = task_service.get_task(db, task_id, project.id)
    return task_service.update_task(db, task, data, project)


@router.delete("/{task_id}", response_model=schemas.MessageResponse)
def delete_task(
    task_id: int,
    project: models.Project = Depends(get_project_with_access),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = task_service.get_task(db, task_id, project.id)
    task_service.delete_task(db, task, current_user, project)
    return {"message": "Task deleted successfully"}
