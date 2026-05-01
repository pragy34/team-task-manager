from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from dependencies.auth_dependency import get_current_user
import schemas
import models

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/search", response_model=List[schemas.UserOut])
def search_users(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    users = db.query(models.User).filter(
        (models.User.email.ilike(f"%{q}%")) | (models.User.name.ilike(f"%{q}%"))
    ).filter(models.User.id != current_user.id).limit(10).all()
    return users
