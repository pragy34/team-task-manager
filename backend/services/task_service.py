from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Optional
from datetime import datetime, timezone
import models
import schemas


def create_task(
    db: Session, project: models.Project, data: schemas.TaskCreate, creator: models.User
) -> models.Task:
    if data.assignee_id:
        member_ids = [m.id for m in project.members] + [project.owner_id]
        if data.assignee_id not in member_ids:
            raise HTTPException(status_code=400, detail="Assignee must be a project member")

    task = models.Task(
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        due_date=data.due_date,
        project_id=project.id,
        assignee_id=data.assignee_id,
        created_by=creator.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_project_tasks(
    db: Session, project_id: int, status: Optional[str] = None, priority: Optional[str] = None
) -> List[models.Task]:
    q = db.query(models.Task).filter(models.Task.project_id == project_id)
    if status:
        q = q.filter(models.Task.status == status)
    if priority:
        q = q.filter(models.Task.priority == priority)
    return q.order_by(models.Task.created_at.desc()).all()


def get_task(db: Session, task_id: int, project_id: int) -> models.Task:
    task = db.query(models.Task).filter(
        models.Task.id == task_id, models.Task.project_id == project_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def update_task(db: Session, task: models.Task, data: schemas.TaskUpdate, project: models.Project) -> models.Task:
    if data.assignee_id is not None:
        member_ids = [m.id for m in project.members] + [project.owner_id]
        if data.assignee_id not in member_ids:
            raise HTTPException(status_code=400, detail="Assignee must be a project member")
        task.assignee_id = data.assignee_id
    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.status is not None:
        task.status = data.status
    if data.priority is not None:
        task.priority = data.priority
    if data.due_date is not None:
        task.due_date = data.due_date
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: models.Task, user: models.User, project: models.Project):
    if task.created_by != user.id and project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this task")
    db.delete(task)
    db.commit()
