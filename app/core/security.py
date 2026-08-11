from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings


# ==========================================================
# Password Hashing
# ==========================================================

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using Argon2.
    """

    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plain-text password against its stored hash.
    """

    return password_hash.verify(
        plain_password,
        hashed_password,
    )


# ==========================================================
# JWT Token Creation
# ==========================================================

def create_access_token(
    user_id: int,
) -> str:
    """
    Create a JWT access token for an authenticated user.
    """

    now = datetime.now(timezone.utc)

    expires_at = (
        now
        + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


# ==========================================================
# JWT Token Decoding
# ==========================================================

def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.

    Raises:
        jwt.PyJWTError:
            If the token is invalid or expired.
    """

    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )