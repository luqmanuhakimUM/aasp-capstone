from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Draft, User, WritingFeedback
from app.schemas import WritingFeedbackOut, WritingFeedbackRequest
from app.services.writing_service import get_writing_feedback

router = APIRouter(prefix="/api/writing", tags=["writing"])


@router.post("/feedback", response_model=WritingFeedbackOut)
def feedback(
    payload: WritingFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    draft = Draft(user_id=current_user.id, content=payload.content, language=payload.language)
    db.add(draft)
    db.flush()

    result = get_writing_feedback(payload.content, payload.language)

    writing_feedback = WritingFeedback(
        draft_id=draft.id,
        clarity_notes=result["clarity_notes"],
        citation_gaps=result["citation_gaps"],
        grammar_notes=result["grammar_notes"],
        suggestions=result["suggestions"],
    )
    db.add(writing_feedback)
    db.commit()

    return WritingFeedbackOut(
        draft_id=draft.id,
        clarity_notes=result["clarity_notes"],
        citation_gaps=result["citation_gaps"],
        grammar_notes=result["grammar_notes"],
        suggestions=result["suggestions"],
    )
