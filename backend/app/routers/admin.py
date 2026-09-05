import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import require_policy_admin
from app.models import ChatMessage, ChatSession, PolicyDocument, Tenant, User
from app.schemas import ChatGapOut, PolicyDocumentOut, TenantOut
from app.services.document_parser import chunk_pages, extract_pages
from app.services.rag_service import index_policy_document

router = APIRouter(prefix="/api/admin", tags=["admin"])

_LOGO_EXT_BY_MIME = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
}
_MAX_LOGO_BYTES = 2 * 1024 * 1024


@router.post("/logo", response_model=TenantOut)
async def upload_logo(
    file: UploadFile,
    current_user: User = Depends(require_policy_admin),
    db: Session = Depends(get_db),
):
    ext = _LOGO_EXT_BY_MIME.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Logo must be PNG, JPEG, SVG, or WebP")

    file_bytes = await file.read()
    if len(file_bytes) > _MAX_LOGO_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Logo must be under 2MB")

    logos_dir = os.path.join(settings.storage_dir, "logos")
    os.makedirs(logos_dir, exist_ok=True)
    filename = f"{current_user.tenant_id}{ext}"

    tenant = db.get(Tenant, current_user.tenant_id)
    _remove_logo_file(tenant)

    with open(os.path.join(logos_dir, filename), "wb") as f:
        f.write(file_bytes)

    tenant.logo_filename = filename
    tenant.logo_scale = 100
    db.commit()
    db.refresh(tenant)
    return tenant


@router.delete("/logo", response_model=TenantOut)
def delete_logo(current_user: User = Depends(require_policy_admin), db: Session = Depends(get_db)):
    tenant = db.get(Tenant, current_user.tenant_id)
    _remove_logo_file(tenant)
    tenant.logo_filename = None
    tenant.logo_scale = 100
    db.commit()
    db.refresh(tenant)
    return tenant


@router.patch("/logo/scale", response_model=TenantOut)
def set_logo_scale(
    scale: int = Query(ge=20, le=100),
    current_user: User = Depends(require_policy_admin),
    db: Session = Depends(get_db),
):
    tenant = db.get(Tenant, current_user.tenant_id)
    tenant.logo_scale = scale
    db.commit()
    db.refresh(tenant)
    return tenant


def _remove_logo_file(tenant: Tenant) -> None:
    if not tenant.logo_filename:
        return
    path = os.path.join(settings.storage_dir, "logos", tenant.logo_filename)
    if os.path.exists(path):
        os.remove(path)


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
