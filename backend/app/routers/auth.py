from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Tenant, User
from app.schemas import LoginRequest, RegisterRequest, TenantOut, TokenResponse, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/tenants", response_model=list[TenantOut])
def list_tenants(db: Session = Depends(get_db)):
    """Public list so the registration form can offer a university picker."""
    return db.query(Tenant).order_by(Tenant.name).all()


@router.get("/config")
def auth_config():
    """Public capability flags so the frontend can hide "Continue with
    Google" rather than show a button that will 503."""
    return {"google_enabled": settings.google_oauth_configured}


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    tenant = db.get(Tenant, payload.tenant_id)
    if tenant is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Selected university not found")

    user = User(
        tenant_id=tenant.id,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="student",
        language_pref=payload.language_pref,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id), str(user.tenant_id), user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    token = create_access_token(str(user.id), str(user.tenant_id), user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
def update_me(
    language_pref: str = Query(pattern="^(en|ms)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """FR-27: language preference is stored per account, not just per
    browser, so it follows the student to their next device/session."""
    current_user.language_pref = language_pref
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)
