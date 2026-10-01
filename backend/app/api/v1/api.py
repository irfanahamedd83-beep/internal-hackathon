# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from app.api.v1 import auth, profile, assessment, roadmap, ai_tutor

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(assessment.router)
api_router.include_router(roadmap.router)
api_router.include_router(ai_tutor.router)

