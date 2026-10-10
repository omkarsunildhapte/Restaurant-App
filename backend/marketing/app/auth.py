"""Who is calling: Supabase Auth access tokens, checked here.

Everyone signs in once, with Supabase, and the same token works on this API and on the Node
platform API. This API never sees a password.

- The token's signature is checked against the project's public keys (JWKS), fetched from
  <SUPABASE_URL>/auth/v1/.well-known/jwks.json and cached. Projects still on the older
  shared-secret signing (HS256) are checked with SUPABASE_JWT_SECRET instead.
- Sales CRM access comes from the token's app_metadata.crm_role ("admin" or "sales"), which
  only the service role can write - never user_metadata, which users can edit themselves.
- A platform Super Admin (public.profiles.is_super_admin) is a CRM admin without needing a role.
- Each caller gets a row in crm.users (same id as the Supabase user), which leads and
  activities point to. Switching someone off there blocks them at once, even while their
  current token is still valid.
"""

from typing import Any

import jwt
from fastapi import Depends, Request
from psycopg import errors as pg

from . import db
from .config import settings
from .errors import AppError

ROLES = ("admin", "sales")

_jwks = jwt.PyJWKClient(settings.supabase_url + "/auth/v1/.well-known/jwks.json", cache_keys=True, lifespan=3600)


def _claims(token: str) -> dict[str, Any]:
    try:
        alg = jwt.get_unverified_header(token).get("alg")
        if alg == "HS256":
            if not settings.supabase_jwt_secret:
                raise jwt.InvalidTokenError("HS256 token but no SUPABASE_JWT_SECRET configured")
            key: Any = settings.supabase_jwt_secret
        else:
            key = _jwks.get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            key,
            algorithms=["ES256", "RS256", "HS256"],
            audience="authenticated",
            issuer=settings.supabase_url + "/auth/v1",
            # Allow for clock drift between Supabase and this server (Docker clocks on
            # Windows drift): a token issued "1 s in the future" must not bounce a fresh sign-in.
            leeway=30,
        )
    except jwt.PyJWKClientConnectionError:
        raise AppError("Cannot reach Supabase to check the sign-in", 503, "AUTH_UNAVAILABLE") from None
    except jwt.PyJWTError:
        # Malformed, expired and wrongly-signed tokens all get the same answer.
        raise AppError.unauthorized("Session expired or invalid, sign in again") from None


def _is_super_admin(user_id: str) -> bool:
    try:
        row = db.query_one("SELECT is_super_admin FROM public.profiles WHERE id = %s", (user_id,))
    except pg.UndefinedTable:
        return False  # a database without the platform schema: no Super Admins
    return bool(row and row["is_super_admin"])


def current_user(request: Request) -> dict[str, Any]:
    """FastAPI dependency: a valid Supabase token from someone allowed into the Sales CRM."""
    header = request.headers.get("authorization", "")
    if not header.startswith("Bearer "):
        raise AppError.unauthorized("Missing bearer token")
    claims = _claims(header[len("Bearer "):])

    user_id = claims["sub"]
    email = claims.get("email") or ""
    name = (claims.get("user_metadata") or {}).get("name") or email.split("@")[0] or "Team member"
    super_admin = _is_super_admin(user_id)
    role = "admin" if super_admin else (claims.get("app_metadata") or {}).get("crm_role")
    if role not in ROLES:
        raise AppError("This account has no Sales CRM access. Ask an admin to add you to the team.", 403, "NO_CRM_ACCESS")

    # Keep the team list current; never re-activate someone an admin switched off.
    row = db.query_one(
        """INSERT INTO users (id, email, name, role, last_login_at) VALUES (%s, %s, %s, %s, now())
           ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role,
             last_login_at = CASE WHEN users.last_login_at IS NULL OR users.last_login_at < now() - interval '5 minutes'
                                  THEN now() ELSE users.last_login_at END
           RETURNING is_active""",
        (user_id, email, name, role),
    )
    if not row["is_active"]:
        raise AppError("This account has been switched off for the Sales CRM.", 403, "NO_CRM_ACCESS")
    return {"id": user_id, "email": email, "name": name, "role": role, "isSuperAdmin": super_admin}


def require_admin(user: dict = Depends(current_user)) -> dict[str, Any]:
    if user["role"] != "admin":
        raise AppError("Only an admin can do this", 403, "FORBIDDEN")
    return user
