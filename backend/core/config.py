from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str = "your-super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    APP_NAME: str = "Team Task Manager"
    DEBUG: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
