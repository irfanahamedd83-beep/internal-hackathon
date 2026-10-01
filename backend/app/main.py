# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Career & Developer Roadmap Platform REST API with Route Guards, JWT Auth, and PostgreSQL Integration",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include main router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "endpoints": {
            "auth": f"{settings.API_V1_STR}/auth",
            "profile": f"{settings.API_V1_STR}/profile",
            "assessment": f"{settings.API_V1_STR}/assessment",
            "roadmap": f"{settings.API_V1_STR}/roadmap",
        }
    }
