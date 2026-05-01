from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dependencies.auth_dependency import get_current_user
import schemas
import models
from services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
def register(data: schemas.UserRegister, db: Session = Depends(get_db)):
    return auth_service.register_user(db, data)


@router.post("/login", response_model=schemas.TokenResponse)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    return auth_service.login_user(db, data)


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
