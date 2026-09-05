import os
import uuid

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import require_policy_admin
from app.models import ChatMessage, ChatSession, PolicyDocument, User
from app.schemas import ChatGapOut, PolicyDocumentOut
from app.services.document_parser import chunk_pages, extract_pages
from app.services.rag_service import index_policy_document

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/policies", response_model=list[PolicyDocumentOut])
def list_policies(current_user: User = Depends(require_policy_admin), db: Session = Depends(get_db)):
    return (
        db.query(PolicyDocument)
        .filter(PolicyDocument.tenant_id == current_user.tenant_id)
        .order_by(PolicyDocument.uploaded_at.desc())
        .all()
    )


@router.post("/policies", response_model=PolicyDocumentOut, status_code=201)
async def upload_policy(
    file: UploadFile,
    doc_type: str = "ai_use_policy",
    current_user: User = Depends(require_policy_admin),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()

    tenant_dir = os.path.join(settings.storage_dir, "policies", str(current_user.tenant_id))
    os.makedirs(tenant_dir, exist_ok=True)
    storage_path = os.path.join(tenant_dir, f"{uuid.uuid4()}_{file.filename}")
    with open(storage_path, "wb") as f:
        f.write(file_bytes)

    document = PolicyDocument(
        tenant_id=current_user.tenant_id,
        title=file.filename,
        doc_type=doc_type,
        storage_path=storage_path,
    )
    db.add(document)
    db.flush()

    pages = extract_pages(file_bytes, file.filename)
    chunks = chunk_pages(pages)
    index_policy_document(db, document, chunks)

    db.commit()
    db.refresh(document)
    return document


@router.patch("/policies/{policy_id}", response_model=PolicyDocumentOut)
def set_policy_active(
    policy_id: uuid.UUID,
    is_active: bool,
    current_user: User = Depends(require_policy_admin),
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException, status

    document = db.get(PolicyDocument, policy_id)
    if document is None or document.tenant_id != current_user.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Policy document not found")
    document.is_active = is_active
    db.commit()
    db.refresh(document)
    return document


@router.get("/chat-gaps", response_model=list[ChatGapOut])
def chat_gaps(current_user: User = Depends(require_policy_admin), db: Session = Depends(get_db)):
    return (
        db.query(ChatMessage)
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .filter(
            ChatSession.tenant_id == current_user.tenant_id,
            ChatMessage.confidence == "low_no_match",
        )
        .order_by(ChatMessage.created_at.desc())
        .limit(100)
        .all()
    )
