# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from app.schemas.schemas import AssessmentSubmit, AssessmentOut
from app.services.scoring_engine import calculate_assessment_scores
import datetime

router = APIRouter(prefix="/assessment", tags=["Assessment"])

# Sample questions matching skills & career catalog
QUESTIONS = [
    {
        "id": "arch_q1",
        "category": "Architecture & Distributed Systems",
        "question": "How comfortable are you designing event-driven distributed systems with message brokers (Kafka/RabbitMQ) and WebSockets?",
        "options": [
            {"score": 1, "text": "Beginner: Basic HTTP request/response understanding"},
            {"score": 3, "text": "Intermediate: Experience with basic pub/sub queues"},
            {"score": 5, "text": "Advanced: High-throughput streaming, backpressure & partition tolerance"}
        ]
    },
    {
        "id": "ai_q1",
        "category": "AI & LLM Orchestration",
        "question": "What is your proficiency with building autonomous LLM agents, function calling, and vector embeddings?",
        "options": [
            {"score": 1, "text": "Beginner: Used basic OpenAI completion prompts"},
            {"score": 3, "text": "Intermediate: Implemented RAG search with vector databases"},
            {"score": 5, "text": "Advanced: Multi-agent state machines, streaming token caching & fine-tuning"}
        ]
    },
    {
        "id": "cloud_q1",
        "category": "Cloud & DevOps Infrastructure",
        "question": "What is your experience deploying containerized microservices to Kubernetes clusters?",
        "options": [
            {"score": 1, "text": "Beginner: Run Docker locally with docker-compose"},
            {"score": 3, "text": "Intermediate: Created Helm charts and CI/CD pipelines"},
            {"score": 5, "text": "Advanced: Production K8s cluster operators, GPU scheduling & service meshes"}
        ]
    },
    {
        "id": "web_q1",
        "category": "Modern Web Engineering",
        "question": "How proficient are you with TypeScript, reactive state, and glassmorphic UI performance?",
        "options": [
            {"score": 1, "text": "Beginner: Standard HTML/CSS/JS with templates"},
            {"score": 3, "text": "Intermediate: React/Next.js component state and hooks"},
            {"score": 5, "text": "Advanced: Complex animations, WASM modules & zero-latency DOM updates"}
        ]
    },
    {
        "id": "sec_q1",
        "category": "Security & Cryptography",
        "question": "How familiar are you with OAuth2/OIDC, JWT route guards, and zero-knowledge cryptography?",
        "options": [
            {"score": 1, "text": "Beginner: Basic session cookies & passwords"},
            {"score": 3, "text": "Intermediate: Bearer tokens, refresh rotations & CORS policies"},
            {"score": 5, "text": "Advanced: Hardware-backed tokens, ZK proofs & end-to-end encryption"}
        ]
    }
]


@router.get("/questions")
def get_assessment_questions():
    return {"questions": QUESTIONS}


@router.post("/submit", response_model=AssessmentOut)
def submit_assessment(submission: AssessmentSubmit, user_id: int = 1):
    scores = calculate_assessment_scores(submission.answers)
    
    assessment_record = {
        "id": 101,
        "user_id": user_id,
        "answers_json": submission.answers,
        "scores_json": scores,
        "created_at": datetime.datetime.utcnow()
    }
    return assessment_record
