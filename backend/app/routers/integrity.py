import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import ChatMessage, ChatSession, User
from app.schemas import ChatMessageOut, ChatRequest, ChatResponse, ChatSessionOut
from app.services.rag_service import answer_question

router = APIRouter(prefix="/api/integrity", tags=["integrity"])


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.session_id:
        session = db.get(ChatSession, payload.session_id)
        if session is None or session.user_id != current_user.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat session not found")
    else:
        session = ChatSession(user_id=current_user.id, tenant_id=current_user.tenant_id)
        db.add(session)
        db.flush()

    user_message = ChatMessage(session_id=session.id, role="user", content=payload.message)
    db.add(user_message)

    result = answer_question(db, current_user.tenant_id, payload.message)

    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=result["answer"],
        cited_policy_chunks=result["cited_chunks"],
        confidence="high" if result["answerable"] else "low_no_match",
        language=result["language"],
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return ChatResponse(session_id=session.id, message=ChatMessageOut.model_validate(assistant_message))


@router.get("/sessions", response_model=list[ChatSessionOut])
def list_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.started_at.desc())
        .all()
    )
    return [
        ChatSessionOut(
            id=s.id,
            started_at=s.started_at,
            preview=next((m.content for m in s.messages if m.role == "user"), "")[:80],
        )
        for s in sessions
        if s.messages
    ]


@router.get("/chat/{session_id}", response_model=list[ChatMessageOut])
def get_history(session_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.get(ChatSession, session_id)
    if session is None or session.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat session not found")
    return [ChatMessageOut.model_validate(m) for m in session.messages]
