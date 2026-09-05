import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Tenant, User
from app.security import create_access_token, create_state_token, decode_state_token, hash_password

router = APIRouter(prefix="/api/auth/google", tags=["auth"])

_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_TOKEN_URL = "https://oauth2.googleapis.com/token"
_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
_TIMEOUT = 10.0


@router.get("/login")
def google_login(tenant_id: str | None = None, language_pref: str = "en"):
    """Redirects to Google. `tenant_id` set (from the register page, using
    whatever university is already selected there) means a new account may
    be created in that tenant; omitted (the login page) means Google sign-in
    only works for an email that's already registered."""
    if not settings.google_oauth_configured:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Google sign-in is not configured on this server")

    state = create_state_token({"tenant_id": tenant_id, "language_pref": language_pref})
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }
    return RedirectResponse(f"{_AUTHORIZE_URL}?{urlencode(params)}")


@router.get("/callback")
def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    frontend_callback = f"{settings.frontend_base_url}/auth/callback"

    if error or not code or not state:
        return RedirectResponse(f"{frontend_callback}?error=google_cancelled")

    claims = decode_state_token(state)
    if claims is None:
        return RedirectResponse(f"{frontend_callback}?error=google_failed")

    try:
        token_resp = httpx.post(
            _TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=_TIMEOUT,
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]

        userinfo_resp = httpx.get(
            _USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}, timeout=_TIMEOUT
        )
        userinfo_resp.raise_for_status()
        info = userinfo_resp.json()
    except (httpx.HTTPError, KeyError):
        return RedirectResponse(f"{frontend_callback}?error=google_failed")

    email = info.get("email")
    if not email or not info.get("email_verified"):
        return RedirectResponse(f"{frontend_callback}?error=google_failed")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        tenant_id = claims.get("tenant_id")
        if not tenant_id:
            # Login page's button: no tenant was chosen, so we never create
            # an account here -- send the student to register instead.
            return RedirectResponse(f"{frontend_callback}?error=google_no_account")
        try:
            tenant = db.get(Tenant, tenant_id)
        except ValueError:
            tenant = None
        if tenant is None:
            return RedirectResponse(f"{frontend_callback}?error=google_failed")
        user = User(
            tenant_id=tenant.id,
            email=email,
            # Google-authenticated accounts never use password login; this
            # just satisfies the NOT NULL column with an unusable secret.
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            role="student",
            language_pref=claims.get("language_pref") or "en",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(str(user.id), str(user.tenant_id), user.role)
    return RedirectResponse(f"{frontend_callback}?token={token}")
