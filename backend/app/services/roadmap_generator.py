from typing import List, Dict, Any

ROADMAP_TEMPLATES = {
    "AI Systems Architect": [
        {
            "title": "Master Advanced Python AsyncIO & Low-Latency Event Loops",
            "order": 1,
            "resource_url": "https://docs.python.org/3/library/asyncio.html",
            "status": "completed"
        },
        {
            "title": "Distributed LLM Agent Orchestration & Tool Calling",
            "order": 2,
            "resource_url": "https://github.com/langchain-ai/langgraph",
            "status": "in_progress"
        },
        {
            "title": "High-Throughput Vector DB Indexing & Hybrid RAG Pipelines",
            "order": 3,
            "resource_url": "https://qdrant.tech/documentation/",
            "status": "pending"
        },
        {
            "title": "Zero-Knowledge Biometric Identification & Cryptographic Proofs",
            "order": 4,
            "resource_url": "https://zkproof.org/",
            "status": "pending"
        },
        {
            "title": "Production Kubernetes Autoscaling for Multi-GPU Model Serving",
            "order": 5,
            "resource_url": "https://kubernetes.io/docs/tasks/manage-gpus/",
            "status": "pending"
        }
    ],
    "Cloud Full-Stack Engineer": [
        {
            "title": "Type-Safe Full-Stack Architecture with Next.js 15 & Server Actions",
            "order": 1,
            "resource_url": "https://nextjs.org/docs",
            "status": "completed"
        },
        {
            "title": "PostgreSQL Optimization, Indexing & Connection Pooling",
            "order": 2,
            "resource_url": "https://www.postgresql.org/docs/current/performance-tips.html",
            "status": "in_progress"
        },
        {
            "title": "Redis Real-Time Pub/Sub & WebSocket State Sync",
            "order": 3,
            "resource_url": "https://redis.io/docs/manual/pubsub/",
            "status": "pending"
        },
        {
            "title": "Docker Multi-Stage Builds & Container Hardening",
            "order": 4,
            "resource_url": "https://docs.docker.com/build/building/multi-stage/",
            "status": "pending"
        }
    ],
    "DevSecOps & Platform Engineer": [
        {
            "title": "Infrastructure as Code with Terraform & Modular State",
            "order": 1,
            "resource_url": "https://developer.hashicorp.com/terraform",
            "status": "completed"
        },
        {
            "title": "Cloud-Native Security, OIDC & Mutual TLS Mesh",
            "order": 2,
            "resource_url": "https://istio.io/latest/docs/concepts/security/",
            "status": "in_progress"
        },
        {
            "title": "Automated Vulnerability Scanning & SBOM Generation in CI/CD",
            "order": 3,
            "resource_url": "https://trivy.dev/",
            "status": "pending"
        }
    ]
}


def generate_career_roadmap(target_role: str, assessment_scores: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Roadmap generator service that builds personalized milestone progression steps
    based on the user's target career role and assessment skill gaps.
    """
    steps = ROADMAP_TEMPLATES.get(target_role)
    if not steps:
        steps = ROADMAP_TEMPLATES["AI Systems Architect"]

    return [step.copy() for step in steps]
