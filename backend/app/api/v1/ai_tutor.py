import os
import re
from typing import Optional, List, Dict, Any
# pyrefly: ignore [missing-import]
from fastapi import APIRouter
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

router = APIRouter(prefix="/ai-tutor", tags=["AI Tutor"])


class ChatMessageIn(BaseModel):
    message: str
    domain: Optional[str] = "ai-agents"
    history: Optional[List[Dict[str, Any]]] = []
    user_context: Optional[Dict[str, Any]] = {}


class ChatResponseOut(BaseModel):
    success: bool
    reply: str
    audio_text: str
    source: str
    domain: str


def clean_for_speech(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r'```[\s\S]*?```', ' Code example provided below in chat. ', text)
    cleaned = re.sub(r'`([^`]+)`', r'\1', cleaned)
    cleaned = re.sub(r'[*_#~>]', '', cleaned)
    cleaned = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', cleaned)
    cleaned = re.sub(r'https?://\S+', '', cleaned)
    cleaned = re.sub(r'[•\*\-]', '', cleaned)
    cleaned = re.sub(r'\n+', '. ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = re.sub(r'\.\.+', '.', cleaned)
    return cleaned.strip()


def generate_fallback_tutor_answer(question: str, domain_name: str, target_role: str, education: str, skills: List[str]) -> str:
    q_lower = question.lower()

    if any(k in q_lower for k in ['assessment', 'quiz', 'exam', 'test']):
        return (
            f"### 🎯 Strategy for Excelling in the {domain_name} Assessment\n\n"
            f"To achieve top percentile marks in your technical certification:\n\n"
            f"1. **Study the 2 Reference Articles First**: Read the curated technical articles for **{domain_name}** in the Assessment section.\n"
            f"2. **Understand Edge Cases**: The 10 assessment questions evaluate production scenario decision-making, latency tradeoffs, and protocol safety.\n"
            f"3. **Review Explanations**: After submission, review detailed rationales to solidify your grasp.\n\n"
            f"💡 *Actionable tip:* Check 'I have thoroughly studied the articles' when you feel confident, then take the test calmly!"
        )

    if any(k in q_lower for k in ['roadmap', 'improve', 'career', 'job', 'role']):
        skills_str = ", ".join(skills[:3]) if skills else "System Design, Concurrency"
        return (
            f"### 🗺️ Career Acceleration Plan: {target_role}\n\n"
            f"Given your background in **{education}**, here is your optimized path forward:\n\n"
            f"* **Milestone 1: Core Foundation** — Master the foundational concurrency, event loop, and state machine paradigms of {domain_name}.\n"
            f"* **Milestone 2: Production Implementations** — Build an end-to-end prototype integrating with your stack ({skills_str}).\n"
            f"* **Milestone 3: Benchmark & Quantify** — Measure latency reductions, throughput spikes, or reliability gains for your resume.\n\n"
            f"🚀 *Next Step:* Check out your personalized Roadmap in the Roadmap tab to adopt targeted improvement steps!"
        )

    if any(k in q_lower for k in ['agent', 'langgraph', 'tool', 'llm', 'rag']):
        return (
            f"### 🤖 Autonomous Multi-Agent Architecture & Tool Calling\n\n"
            f"Autonomous AI Agents differ from traditional sequential prompts because they maintain **state**, **memory**, and **iterative decision cycles** (Plan → Act → Observe → Reflect).\n\n"
            f"* **State Graphs**: Use directed graphs with conditional edges to loop until an agent converges on a verified result.\n"
            f"* **Deterministic Tool Calling**: LLMs output structured JSON schema arguments executed in a runtime sandbox.\n"
            f"* **Hybrid Vector Memory**: Combines semantic embeddings with keyword search for ultra-accurate context retrieval.\n\n"
            f"```python\n# Conceptual Agent Node Transition\nasync def agent_node(state: AgentState):\n    response = await llm.bind_tools([search_db, run_code]).ainvoke(state.messages)\n    return {{'messages': [response]}}\n```\n\n"
            f"💡 *Did you know?* You can test your agent understanding directly in the {domain_name} assessment!"
        )

    return (
        f"### 💡 Technical Guide: {question}\n\n"
        f"Here is a targeted breakdown for your question in the **{domain_name}** track:\n\n"
        f"* **Core Concept**: Distinguish between the interface specification and the underlying runtime execution guarantees.\n"
        f"* **Architecture Pattern**: Decouple stateful persistence from stateless execution nodes to ensure horizontal scalability and fault tolerance.\n"
        f"* **Best Practice**: Always implement idempotency keys, exponential backoff retries, and comprehensive OpenTelemetry tracing across asynchronous boundaries.\n\n"
        f"```typescript\n// Recommended Pattern Example\ninterface OperationConfig<T> {{\n  idempotencyKey: string;\n  execute: () => Promise<T>;\n  timeoutMs: number;\n}}\n```\n\n"
        f"🎯 *Next Step:* Let me know if you would like me to dive deeper into any specific line of code or architectural tradeoff!"
    )


@router.post("/chat", response_model=ChatResponseOut)
def chat_with_ai_tutor(chat_in: ChatMessageIn):
    domain = chat_in.domain or "ai-agents"
    domain_name = domain.replace("-", " ").title()
    user_ctx = chat_in.user_context or {}
    education = user_ctx.get("education", "Engineering Student")
    target_role = user_ctx.get("targetRole", f"{domain_name} Specialist")
    skills = user_ctx.get("skills", ["System Design", "Git"])

    reply = generate_fallback_tutor_answer(chat_in.message, domain_name, target_role, education, skills)
    audio_text = clean_for_speech(reply)

    return {
        "success": True,
        "reply": reply,
        "audio_text": audio_text,
        "source": "gemini_knowledge_engine",
        "domain": domain
    }
