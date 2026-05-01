from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from database import get_db
from dependencies.auth_dependency import get_current_user
import models
import schemas

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # All projects user belongs to
    owned_ids = [p.id for p in db.query(models.Project).filter(
        models.Project.owner_id == current_user.id
    ).all()]
    member_ids = [p.id for p in current_user.projects]
    project_ids = list(set(owned_ids + member_ids))

    total_projects = len(project_ids)

    # All tasks in those projects
    all_tasks = db.query(models.Task).filter(
        models.Task.project_id.in_(project_ids)
    ).all() if project_ids else []

    tasks_by_status = {
        "todo": sum(1 for t in all_tasks if t.status == models.TaskStatus.TODO),
        "in_progress": sum(1 for t in all_tasks if t.status == models.TaskStatus.IN_PROGRESS),
        "done": sum(1 for t in all_tasks if t.status == models.TaskStatus.DONE),
    }

    now = datetime.now(timezone.utc)
    overdue = sum(
        1 for t in all_tasks
        if t.due_date and t.due_date.replace(tzinfo=timezone.utc) < now and t.status != models.TaskStatus.DONE
    )

    my_tasks = sum(1 for t in all_tasks if t.assignee_id == current_user.id)

    return schemas.DashboardStats(
        total_projects=total_projects,
        total_tasks=len(all_tasks),
        tasks_by_status=tasks_by_status,
        overdue_tasks=overdue,
        my_tasks=my_tasks,
    )


@router.get("/my-tasks")
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tasks = db.query(models.Task).filter(
        models.Task.assignee_id == current_user.id
    ).order_by(models.Task.due_date.asc()).all()
    return tasks


@router.get("/overdue-tasks")
def get_overdue_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    owned_ids = [p.id for p in db.query(models.Project).filter(
        models.Project.owner_id == current_user.id
    ).all()]
    member_ids = [p.id for p in current_user.projects]
    project_ids = list(set(owned_ids + member_ids))

    now = datetime.now(timezone.utc)
    overdue = db.query(models.Task).filter(
        models.Task.project_id.in_(project_ids),
        models.Task.due_date < now,
        models.Task.status != models.TaskStatus.DONE,
    ).all() if project_ids else []
    return overdue
