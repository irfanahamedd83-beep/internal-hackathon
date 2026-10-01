from typing import List, Optional, Dict, Any
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    name: Optional[str] = None
    interested_domain: Optional[str] = "ai-agents"


class UserLogin(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    selected_domain: Optional[str] = None


# Domain & Study Article Schemas
class DomainArticleOut(BaseModel):
    id: str
    domain_id: str
    title: str
    read_time: str
    summary: str
    key_takeaways: List[str]
    content: str
    external_url: str

    class Config:
        from_attributes = True


class DomainQuestionOut(BaseModel):
    id: str
    domain_id: str
    question: str
    options: List[str]
    explanation: str

    class Config:
        from_attributes = True


class DomainOut(BaseModel):
    id: str
    name: str
    icon: str
    tagline: str
    description: str

    class Config:
        from_attributes = True


class DomainDetailOut(BaseModel):
    domain: DomainOut
    articles: List[DomainArticleOut]
    questions: List[DomainQuestionOut]


# Profile Schemas
class ProfileBase(BaseModel):
    selected_domain: Optional[str] = "ai-agents"
    education: Optional[str] = None
    skills: List[str] = []
    interests: List[str] = []
    target_role: Optional[str] = None
    bio: Optional[str] = None


class ProfileUpdate(ProfileBase):
    name: Optional[str] = None


class ProfileOut(ProfileBase):
    user_id: int
    name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


# Assessment Schemas
class AssessmentSubmit(BaseModel):
    domain_id: str
    answers: Dict[str, int]


class QuestionReview(BaseModel):
    question_id: str
    question: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str


class AssessmentOut(BaseModel):
    assessment_id: int
    domain_id: str
    score: int
    correct_count: int
    total_questions: int
    passed: bool
    feedback: str
    review: List[QuestionReview]


# Roadmap Schemas
class RoadmapStepUpdate(BaseModel):
    status: str


class RoadmapStepOut(BaseModel):
    id: int
    roadmap_id: int
    title: str
    order_num: Optional[int] = 1
    order: Optional[int] = 1
    domain: Optional[str] = None
    resource_url: Optional[str] = None
    status: str = "pending"

    class Config:
        from_attributes = True


class RoadmapOut(BaseModel):
    id: int
    user_id: int
    domain_id: Optional[str] = None
    target_role: str
    created_at: datetime
    steps: List[RoadmapStepOut] = []

    class Config:
        from_attributes = True
