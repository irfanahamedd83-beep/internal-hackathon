import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)
    assessments = relationship("Assessment", back_populates="user")
    roadmaps = relationship("Roadmap", back_populates="user")


class Profile(Base):
    __tablename__ = "profiles"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    selected_domain = Column(String(100), default="ai-agents")
    education = Column(String(255), nullable=True)
    skills = Column(ARRAY(String), default=[])
    interests = Column(ARRAY(String), default=[])
    target_role = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)

    user = relationship("User", back_populates="profile")


class Domain(Base):
    __tablename__ = "domains"

    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    icon = Column(String(50), nullable=False)
    tagline = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    articles = relationship("DomainArticle", back_populates="domain")
    questions = relationship("DomainQuestion", back_populates="domain")


class DomainArticle(Base):
    __tablename__ = "domain_articles"

    id = Column(String(100), primary_key=True)
    domain_id = Column(String(100), ForeignKey("domains.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    read_time = Column(String(50), nullable=False)
    summary = Column(Text, nullable=False)
    key_takeaways = Column(JSONB, nullable=False, default=[])
    content = Column(Text, nullable=False)
    external_url = Column(String(500), nullable=False)

    domain = relationship("Domain", back_populates="articles")


class DomainQuestion(Base):
    __tablename__ = "domain_questions"

    id = Column(String(100), primary_key=True)
    domain_id = Column(String(100), ForeignKey("domains.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    options_json = Column(JSONB, nullable=False)
    correct_index = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)

    domain = relationship("Domain", back_populates="questions")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    domain_id = Column(String(100), ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)
    answers_json = Column(JSONB, nullable=False, default={})
    score = Column(Integer, default=0)
    passed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="assessments")


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    domain_id = Column(String(100), nullable=True)
    target_role = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="roadmaps")
    steps = relationship("RoadmapStep", back_populates="roadmap", order_by="RoadmapStep.order_num")


class RoadmapStep(Base):
    __tablename__ = "roadmap_steps"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    order_num = Column(Integer, nullable=False)
    domain = Column(String(100), nullable=True)
    resource_url = Column(String(500), nullable=True)
    status = Column(String(50), default="pending")  # pending, in-progress, completed

    roadmap = relationship("Roadmap", back_populates="steps")
