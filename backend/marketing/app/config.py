"""Environment access that fails at boot rather than at the first request.

A missing DATABASE_URL or SUPABASE_URL is not recoverable, and discovering it when the first
user signs in means the process has already reported itself healthy. The required values
are read once here so a misconfigured deploy dies immediately.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BACKEND_DIR / ".env")


def _required(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise RuntimeError("Missing required environment variable: " + key)
    return value


class Settings:
    def __init__(self) -> None:
        self.env = os.environ.get("APP_ENV") or "development"
        self.port = int(os.environ.get("PORT", "4100"))
        self.database_url = _required("DATABASE_URL")
        # Sign-in is Supabase Auth: tokens are checked against this project's public keys.
        self.supabase_url = _required("SUPABASE_URL").rstrip("/")
        # Only for projects still signing tokens with the old shared secret (HS256).
        self.supabase_jwt_secret = os.environ.get("SUPABASE_JWT_SECRET") or None
        # Server-only key for creating team accounts and setting their CRM role.
        # Never sent to a browser.
        self.supabase_service_role_key = _required("SUPABASE_SERVICE_ROLE_KEY")
        # Where invite and password-reset emails send people (the Super Admin app's /welcome).
        self.admin_app_url = (os.environ.get("ADMIN_APP_URL") or "http://localhost:4300").rstrip("/")
        self.cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.env == "production"


settings = Settings()
