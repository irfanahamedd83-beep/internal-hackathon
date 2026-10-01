# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["Profile"])

MOCK_PROFILE_DB = {
    1: {
        "user_id": 1,
        "selected_domain": "ai-agents",
        "education": "M.S. in Computer Science & Distributed Systems, Stanford University",
        "skills": ["Python", "PyTorch", "TypeScript", "React", "Next.js", "Docker", "PostgreSQL", "System Design"],
        "interests": ["Autonomous Agents", "LLM Orchestration", "Zero-Knowledge Proofs", "GPU Clusters"],
        "target_role": "AI Systems Architect"
    }
}


@router.get("/", response_model=ProfileOut)
def get_user_profile(user_id: int = 1):
    profile = MOCK_PROFILE_DB.get(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/", response_model=ProfileOut)
def update_user_profile(profile_data: ProfileUpdate, user_id: int = 1):
    current = MOCK_PROFILE_DB.get(user_id, {"user_id": user_id})
    if profile_data.selected_domain is not None:
        current["selected_domain"] = profile_data.selected_domain
    if profile_data.education is not None:
        current["education"] = profile_data.education
    if profile_data.skills is not None:
        current["skills"] = profile_data.skills
    if profile_data.interests is not None:
        current["interests"] = profile_data.interests
    if profile_data.target_role is not None:
        current["target_role"] = profile_data.target_role
    if profile_data.bio is not None:
        current["bio"] = profile_data.bio
    
    MOCK_PROFILE_DB[user_id] = current
    return current
