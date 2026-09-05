from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, tenant_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "tenant_id": tenant_id, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None


def create_state_token(data: dict) -> str:
    """Short-lived, tamper-evident token for the OAuth `state` param -- not a
    session credential, just carries the tenant/language picked before the
    Google redirect so a forged value can't do worse than misfile a new
    account into the wrong tenant (the email itself still has to come back
    Google-verified)."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=10)
    return jwt.encode({**data, "exp": expire}, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_state_token(token: str) -> dict | None:
    return decode_access_token(token)
