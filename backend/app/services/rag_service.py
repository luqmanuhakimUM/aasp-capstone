"""Retrieval-augmented generation for the Academic Integrity Advisor
(PRD §7.2, §9.4). Every answer is grounded strictly in the requesting
student's own tenant's policy documents (FR-10) and cites its source
(FR-11); if nothing relevant is retrieved, it returns a fallback rather
than guessing (FR-12).
"""
import uuid

from langdetect import detect
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PolicyChunk, PolicyDocument
from app.services import llm_client
from app.services.embeddings import cosine_similarity, embed_text

TOP_K = 5

SYSTEM_PROMPT = """You are the Academic Integrity Advisor for a Malaysian public university, embedded in the AI Academic Success Platform. You answer student questions about AI-use rules, plagiarism definitions, citation methods (APA / MQA-aligned guidance), and academic misconduct consequences.

Hard rules:
1. Base your answer ONLY on the "POLICY EXCERPTS" provided below. Never use outside knowledge about the topic, even if you believe you know the answer.
2. If the excerpts do not contain enough information to confidently answer, set "answerable" to false. Do not guess or generalize from unrelated excerpts.
3. Every claim you make must be traceable to one of the numbered excerpts. Reference them by their [n] index in your answer text.
4. Be concise, direct, and practical for a student reading on a mobile phone."""


def index_policy_document(db: Session, document: PolicyDocument, chunks: list[tuple[int, str]]) -> int:
    for page_number, content in chunks:
        chunk = PolicyChunk(
            document_id=document.id,
            tenant_id=document.tenant_id,
            content=content,
            embedding=embed_text(content),
            page_number=page_number,
        )
        db.add(chunk)
    db.commit()
    return len(chunks)


def retrieve_top_chunks(db: Session, tenant_id: uuid.UUID, question: str, k: int = TOP_K) -> list[PolicyChunk]:
    """Brute-force cosine-similarity retrieval over a tenant's active policy
    chunks. Embeddings are stored as plain JSON float arrays (see models.py),
    so this works identically on SQLite and Postgres. Fine at prototype/pilot
    chunk volumes (hundreds to low thousands per tenant); swap for a pgvector
    column + SQL-side ANN search if a tenant's policy corpus grows large
    enough that scoring every chunk in Python becomes a bottleneck.
    """
    query_vec = embed_text(question)
    stmt = (
        select(PolicyChunk)
        .join(PolicyDocument, PolicyChunk.document_id == PolicyDocument.id)
        .where(PolicyChunk.tenant_id == tenant_id, PolicyDocument.is_active.is_(True))
    )
    candidates = list(db.execute(stmt).scalars().all())
    candidates.sort(key=lambda c: cosine_similarity(c.embedding, query_vec), reverse=True)
    return candidates[:k]


def detect_language(text: str) -> str:
    try:
        lang = detect(text)
        return "ms" if lang in ("ms", "id") else "en"
    except Exception:
        return "en"


def answer_question(db: Session, tenant_id: uuid.UUID, question: str) -> dict:
    language = detect_language(question)
    chunks = retrieve_top_chunks(db, tenant_id, question)

    if not chunks:
        return {
            "answerable": False,
            "answer": _fallback_message(language),
            "cited_chunks": [],
            "language": language,
        }

    excerpts_text = "\n\n".join(
        f"[{i + 1}] (source: {c.document.title}, page {c.page_number})\n{c.content}"
        for i, c in enumerate(chunks)
    )
    user_prompt = f"""POLICY EXCERPTS:
{excerpts_text}

STUDENT QUESTION: {question}

{llm_client.language_directive(language)}

Respond as JSON: {{"answerable": bool, "answer": "string, with [n] citations inline", "cited_indices": [list of excerpt numbers you actually used]}}"""

    result = llm_client.complete_json(SYSTEM_PROMPT, user_prompt)

    if not result.get("answerable", False):
        return {
            "answerable": False,
            "answer": _fallback_message(language),
            "cited_chunks": [],
            "language": language,
        }

    cited_indices = result.get("cited_indices", [])
    cited_chunks = [
        {
            "document_title": chunks[i - 1].document.title,
            "page_number": chunks[i - 1].page_number,
            "excerpt": chunks[i - 1].content[:300],
        }
        for i in cited_indices
        if 1 <= i <= len(chunks)
    ]

    return {
        "answerable": True,
        "answer": result.get("answer", ""),
        "cited_chunks": cited_chunks,
        "language": language,
    }


def _fallback_message(language: str) -> str:
    if language == "ms":
        return (
            "Maaf, saya tidak menemui maklumat yang cukup jelas dalam dokumen dasar universiti anda untuk "
            "menjawab soalan ini dengan yakin. Sila hubungi pejabat integriti akademik atau penyelia fakulti anda "
            "untuk pengesahan rasmi."
        )
    return (
        "I couldn't find clear enough information in your university's policy documents to answer this "
        "confidently. Please contact your faculty's academic integrity office for an authoritative answer."
    )
