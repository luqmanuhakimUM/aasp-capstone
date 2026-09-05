from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import ReferenceEntry, ReferenceList, User
from app.schemas import ReferenceListOut, SourceOrganiseRequest
from app.services.source_service import build_reference_docx, organise_sources

router = APIRouter(prefix="/api/sources", tags=["sources"])

_DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


@router.post("/organize", response_model=ReferenceListOut)
def organize(
    payload: SourceOrganiseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entries = organise_sources(payload.entries, payload.language)

    reference_list = ReferenceList(user_id=current_user.id, title=f"Reference list ({len(entries)} sources)")
    db.add(reference_list)
    db.flush()

    for entry in entries:
        db.add(
            ReferenceEntry(
                reference_list_id=reference_list.id,
                title=entry["title"],
                authors=entry["authors"],
                year=entry["year"],
                doi=entry["doi"],
                url=entry["url"],
                credibility_tier=entry["credibility_tier"],
                credibility_basis=entry["credibility_basis"],
                annotation=entry["annotation"],
                formatted_apa=entry["formatted_apa"],
                resolved=entry["resolved"],
            )
        )
    db.commit()
    db.refresh(reference_list)

    return ReferenceListOut(id=reference_list.id, title=reference_list.title, entries=entries)


@router.get("/{reference_list_id}/export.docx")
def export_docx(
    reference_list_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reference_list = db.get(ReferenceList, reference_list_id)
    if reference_list is None or reference_list.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reference list not found")

    citations = [e.formatted_apa for e in reference_list.entries if e.formatted_apa]
    content = build_reference_docx(citations, reference_list.title)
    return Response(
        content=content,
        media_type=_DOCX_MEDIA_TYPE,
        headers={"Content-Disposition": 'attachment; filename="references.docx"'},
    )
