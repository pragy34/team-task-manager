from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException
from typing import List
import models
import schemas


def create_project(db: Session, data: schemas.ProjectCreate, owner: models.User) -> models.Project:
    try:
        project = models.Project(
            name=data.name,
            description=data.description,
            owner_id=owner.id,
        )
        db.add(project)
        db.flush()

        db.execute(
            models.project_members.insert().values(
                user_id=owner.id,
                project_id=project.id,
                role=models.UserRole.ADMIN,
            )
        )
        db.commit()
        db.refresh(project)
        return project
    except Exception:
        db.rollback()
        raise


def get_user_projects(db: Session, user: models.User) -> List[models.Project]:
    owned = db.query(models.Project).filter(models.Project.owner_id == user.id).all()
    member_of = user.projects
    seen = {p.id for p in owned}
    all_projects = list(owned)
    for p in member_of:
        if p.id not in seen:
            all_projects.append(p)
            seen.add(p.id)
    return all_projects


def update_project(db: Session, project: models.Project, data: schemas.ProjectUpdate) -> models.Project:
    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: models.Project, user: models.User):
    if project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can delete this project")
    db.delete(project)
    db.commit()


def add_member(db: Session, project: models.Project, data: schemas.AddMemberRequest, requester: models.User) -> models.User:
    if project.owner_id != requester.id:
        raise HTTPException(status_code=403, detail="Only owner can add members")

    new_member = db.query(models.User).filter(models.User.email == data.email).first()
    if not new_member:
        raise HTTPException(status_code=404, detail="User with this email not found")

    already = db.execute(
        text("SELECT 1 FROM project_members WHERE user_id=:uid AND project_id=:pid"),
        {"uid": new_member.id, "pid": project.id},
    ).fetchone()
    if already:
        raise HTTPException(status_code=400, detail="User is already a member")

    db.execute(
        models.project_members.insert().values(
            user_id=new_member.id,
            project_id=project.id,
            role=data.role,
        )
    )
    db.commit()
    return new_member


def remove_member(db: Session, project: models.Project, member_id: int, requester: models.User):
    if project.owner_id != requester.id:
        raise HTTPException(status_code=403, detail="Only owner can remove members")
    if member_id == requester.id:
        raise HTTPException(status_code=400, detail="Owner cannot remove themselves")

    db.execute(
        text("DELETE FROM project_members WHERE user_id=:uid AND project_id=:pid"),
        {"uid": member_id, "pid": project.id},
    )
    db.commit()
