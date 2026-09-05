import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.db_types import GUID, JSONColumn

EMBEDDING_DIM = 384


def gen_uuid() -> uuid.UUID:
    return uuid.uuid4()


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    locale_default: Mapped[str] = mapped_column(String(5), default="en")
    logo_filename: Mapped[str] = mapped_column(String(255), nullable=True)
    logo_scale: Mapped[int] = mapped_column(Integer, default=100)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    users: Mapped[list["User"]] = relationship(back_populates="tenant")
    policy_documents: Mapped[list["PolicyDocument"]] = relationship(back_populates="tenant")

    @property
    def logo_url(self) -> str | None:
        return f"/logos/{self.logo_filename}" if self.logo_filename else None


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    tenant_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("tenants.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="student")  # student | policy_admin | super_admin
    language_pref: Mapped[str] = mapped_column(String(5), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tenant: Mapped["Tenant"] = relationship(back_populates="users")

    @property
    def tenant_name(self) -> str:
        return self.tenant.name

    @property
    def tenant_logo_url(self) -> str | None:
        return self.tenant.logo_url

    @property
    def tenant_logo_scale(self) -> int:
        return self.tenant.logo_scale


class PolicyDocument(Base):
    __tablename__ = "policy_documents"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    tenant_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("tenants.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(50), default="ai_use_policy")
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tenant: Mapped["Tenant"] = relationship(back_populates="policy_documents")
    chunks: Mapped[list["PolicyChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class PolicyChunk(Base):
    __tablename__ = "policy_chunks"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    document_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("policy_documents.id"), nullable=False)
    tenant_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("tenants.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # Stored as a plain JSON float array and searched via brute-force cosine
    # similarity in Python (rag_service.retrieve_top_chunks) rather than a
    # native pgvector column, so the same code path works on SQLite (local
    # dev/testing) and Postgres alike. At real-pilot chunk volumes, swap this
    # for a pgvector column + SQL-side ANN search (see PRD §8.4).
    embedding: Mapped[list[float]] = mapped_column(JSONColumn)
    page_number: Mapped[int] = mapped_column(Integer, default=0)

    document: Mapped["PolicyDocument"] = relationship(back_populates="chunks")


class SearchQuery(Base):
    __tablename__ = "search_queries"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    topic_text: Mapped[str] = mapped_column(String(500), nullable=False)
    language: Mapped[str] = mapped_column(String(5), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    summary: Mapped["LitReviewSummary"] = relationship(back_populates="search_query", uselist=False)


class LitReviewSummary(Base):
    __tablename__ = "lit_review_summaries"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    search_query_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("search_queries.id"), nullable=False)
    themes: Mapped[dict] = mapped_column(JSONColumn, default=list)
    key_findings: Mapped[dict] = mapped_column(JSONColumn, default=list)
    research_gaps: Mapped[dict] = mapped_column(JSONColumn, default=list)
    sources: Mapped[dict] = mapped_column(JSONColumn, default=list)
    language: Mapped[str] = mapped_column(String(5), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    search_query: Mapped["SearchQuery"] = relationship(back_populates="summary")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    tenant_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("tenants.id"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at"
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    session_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("chat_sessions.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user | assistant
    content: Mapped[str] = mapped_column(Text, nullable=False)
    cited_policy_chunks: Mapped[dict] = mapped_column(JSONColumn, default=list)
    confidence: Mapped[str] = mapped_column(String(20), default="high")  # high | low_no_match
    language: Mapped[str] = mapped_column(String(5), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["ChatSession"] = relationship(back_populates="messages")


class Draft(Base):
    __tablename__ = "drafts"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(5), default="en")
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    feedback: Mapped["WritingFeedback"] = relationship(back_populates="draft", uselist=False)


class WritingFeedback(Base):
    __tablename__ = "writing_feedback"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    draft_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("drafts.id"), nullable=False)
    clarity_notes: Mapped[dict] = mapped_column(JSONColumn, default=list)
    citation_gaps: Mapped[dict] = mapped_column(JSONColumn, default=list)
    grammar_notes: Mapped[dict] = mapped_column(JSONColumn, default=list)
    suggestions: Mapped[dict] = mapped_column(JSONColumn, default=list)

    draft: Mapped["Draft"] = relationship(back_populates="feedback")


class ReferenceList(Base):
    __tablename__ = "reference_lists"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), default="Untitled reference list")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    entries: Mapped[list["ReferenceEntry"]] = relationship(back_populates="reference_list", cascade="all, delete-orphan")


class ReferenceEntry(Base):
    __tablename__ = "reference_entries"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=gen_uuid)
    reference_list_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("reference_lists.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), default="")
    authors: Mapped[str] = mapped_column(String(500), default="")
    year: Mapped[int] = mapped_column(Integer, nullable=True)
    doi: Mapped[str] = mapped_column(String(255), default="")
    url: Mapped[str] = mapped_column(String(1000), default="")
    credibility_tier: Mapped[str] = mapped_column(String(50), default="unknown")
    credibility_basis: Mapped[str] = mapped_column(String(255), default="")
    annotation: Mapped[str] = mapped_column(Text, default="")
    formatted_apa: Mapped[str] = mapped_column(Text, default="")
    resolved: Mapped[bool] = mapped_column(Boolean, default=True)

    reference_list: Mapped["ReferenceList"] = relationship(back_populates="entries")
