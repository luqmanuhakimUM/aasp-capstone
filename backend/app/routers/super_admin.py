from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_super_admin
from app.models import Tenant, User
from app.schemas import TenantCreateRequest, TenantOut
from app.security import hash_password

router = APIRouter(prefix="/api/super-admin", tags=["super-admin"])


@router.post("/tenants", response_model=TenantOut, status_code=status.HTTP_201_CREATED)
def create_tenant(
    payload: TenantCreateRequest,
    _: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == payload.admin_email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this admin email already exists")

    tenant = Tenant(name=payload.name, locale_default=payload.locale_default)
    db.add(tenant)
    db.flush()

    admin_user = User(
        tenant_id=tenant.id,
        email=payload.admin_email,
        hashed_password=hash_password(payload.admin_password),
        role="policy_admin",
        language_pref=payload.locale_default,
    )
    db.add(admin_user)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/tenants", response_model=list[TenantOut])
def list_tenants(_: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return db.query(Tenant).order_by(Tenant.name).all()
