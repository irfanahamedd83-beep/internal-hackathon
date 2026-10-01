from fastapi import APIRouter, HTTPException
from app.schemas.schemas import RoadmapOut, RoadmapStepUpdate
from app.services.roadmap_generator import generate_career_roadmap
import datetime

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])

# In-memory store for user roadmaps
MOCK_ROADMAPS = {
    1: {
        "id": 501,
        "user_id": 1,
        "assessment_id": 101,
        "created_at": datetime.datetime.utcnow(),
        "steps": [
            {
                "id": 1,
                "roadmap_id": 501,
                "title": "Master Advanced Python AsyncIO & Low-Latency Event Loops",
                "order": 1,
                "resource_url": "https://docs.python.org/3/library/asyncio.html",
                "status": "completed"
            },
            {
                "id": 2,
                "roadmap_id": 501,
                "title": "Distributed LLM Agent Orchestration & Tool Calling",
                "order": 2,
                "resource_url": "https://github.com/langchain-ai/langgraph",
                "status": "in_progress"
            },
            {
                "id": 3,
                "roadmap_id": 501,
                "title": "High-Throughput Vector DB Indexing & Hybrid RAG Pipelines",
                "order": 3,
                "resource_url": "https://qdrant.tech/documentation/",
                "status": "pending"
            },
            {
                "id": 4,
                "roadmap_id": 501,
                "title": "Zero-Knowledge Biometric Identification & Cryptographic Proofs",
                "order": 4,
                "resource_url": "https://zkproof.org/",
                "status": "pending"
            },
            {
                "id": 5,
                "roadmap_id": 501,
                "title": "Production Kubernetes Autoscaling for Multi-GPU Model Serving",
                "order": 5,
                "resource_url": "https://kubernetes.io/docs/tasks/manage-gpus/",
                "status": "pending"
            }
        ]
    }
}


@router.get("/", response_model=RoadmapOut)
def get_user_roadmap(user_id: int = 1):
    roadmap = MOCK_ROADMAPS.get(user_id)
    if not roadmap:
        raise HTTPException(status_code=404, detail="No active roadmap found")
    return roadmap


@router.post("/generate", response_model=RoadmapOut)
def generate_roadmap(target_role: str = "AI Systems Architect", user_id: int = 1):
    raw_steps = generate_career_roadmap(target_role)
    new_steps = []
    for i, s in enumerate(raw_steps, 1):
        new_steps.append({
            "id": i,
            "roadmap_id": 501,
            "title": s["title"],
            "order": s["order"],
            "resource_url": s["resource_url"],
            "status": s["status"]
        })
    
    new_roadmap = {
        "id": 501,
        "user_id": user_id,
        "assessment_id": 101,
        "created_at": datetime.datetime.utcnow(),
        "steps": new_steps
    }
    MOCK_ROADMAPS[user_id] = new_roadmap
    return new_roadmap


@router.patch("/step/{step_id}/status")
def update_step_status(step_id: int, step_update: RoadmapStepUpdate, user_id: int = 1):
    roadmap = MOCK_ROADMAPS.get(user_id)
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    for step in roadmap["steps"]:
        if step["id"] == step_id:
            step["status"] = step_update.status
            return {"message": "Step status updated", "step": step}
            
    raise HTTPException(status_code=404, detail="Step not found")
