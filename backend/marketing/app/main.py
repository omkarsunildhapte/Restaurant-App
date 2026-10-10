"""Marketing API (Sales CRM + website demo requests): middleware, error envelopes, /health
and the routers.

Run locally with:  .venv\\Scripts\\python -m uvicorn app.main:app --reload --port 4100
"""

import logging
import sys
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import db
from .config import settings
from .errors import AppError, error_body
from .routes import ROUTERS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("app")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Checked before serving: accepting traffic and only then finding the database
    # unreachable produces a stream of 500s that look like application bugs.
    db.pool.open(wait=True, timeout=15)
    if not db.healthy():
        log.error("[boot] cannot reach PostgreSQL - check DATABASE_URL")
        sys.exit(1)
    log.info("[boot] marketing API ready on port %s (%s)", settings.port, settings.env)
    yield
    db.pool.close()


app = FastAPI(title="Restaurant Platform Marketing API", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=86_400,
)

# ---- rate limits ------------------------------------------------------------------
# In-memory, per client IP, 15-minute windows: a broad ceiling for the whole API, and a
# tight one on the public demo form, which anyone on the internet can post to. Login
# attempts are Supabase's to limit.

WINDOW = 15 * 60
GLOBAL_LIMIT = 600
DEMO_REQUEST_LIMIT = 5
_hits: dict[str, deque] = defaultdict(deque)
_demo_requests: dict[str, deque] = defaultdict(deque)
RATE_LIMITED = {"success": False, "message": "Too many requests, slow down and try again shortly", "errorCode": "RATE_LIMITED"}


def _client_ip(request: Request) -> str:
    # One proxy hop in front in production: the real client is the last
    # X-Forwarded-For entry the proxy appended, not whatever the client sent first.
    fwd = request.headers.get("x-forwarded-for")
    if fwd and settings.is_production:
        return fwd.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def _over(bucket: deque, limit: int, now: float) -> bool:
    while bucket and bucket[0] <= now - WINDOW:
        bucket.popleft()
    return len(bucket) >= limit


@app.middleware("http")
async def security_and_limits(request: Request, call_next):
    ip, now = _client_ip(request), time.time()
    if _over(_hits[ip], GLOBAL_LIMIT, now):
        return JSONResponse(RATE_LIMITED, status_code=429)
    _hits[ip].append(now)

    if request.url.path == "/api/v1/public/demo-requests" and request.method == "POST":
        if _over(_demo_requests[ip], DEMO_REQUEST_LIMIT, now):
            return JSONResponse(RATE_LIMITED, status_code=429)
        _demo_requests[ip].append(now)

    response = await call_next(request)

    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")
    if settings.is_production:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response


# ---- error envelopes --------------------------------------------------------------

@app.exception_handler(AppError)
async def app_error(_request: Request, err: AppError):
    if err.status >= 500:
        log.error("[error] %s", err.message)
    return JSONResponse(error_body(err), status_code=err.status)


@app.exception_handler(RequestValidationError)
async def bad_json(_request: Request, err: RequestValidationError):
    details = [{"field": ".".join(str(p) for p in e.get("loc", [])[1:]) or "body", "message": e.get("msg", "Invalid")}
               for e in err.errors()]
    return JSONResponse(error_body(AppError.validation(details)), status_code=422)


@app.exception_handler(StarletteHTTPException)
async def http_error(request: Request, err: StarletteHTTPException):
    if err.status_code in (404, 405):
        url = request.url.path + (("?" + request.url.query) if request.url.query else "")
        return JSONResponse(
            {"success": False, "message": f"No route matches {request.method} {url}", "errorCode": "ROUTE_NOT_FOUND"},
            status_code=404,
        )
    return JSONResponse({"success": False, "message": str(err.detail), "errorCode": "HTTP_ERROR"}, status_code=err.status_code)


@app.exception_handler(Exception)
async def unhandled(request: Request, err: Exception):
    """Anything that is not an AppError is a bug: logged in full, answered with a fixed
    string in production (its message could name a table or a file path).

    This handler runs outside the CORS middleware, so the CORS header is added here by hand;
    without it the browser hides the 500 and the console reports "cannot reach the API"."""
    log.exception("[error] unhandled")
    message = "An unexpected error occurred" if settings.is_production else str(err)
    response = JSONResponse({"success": False, "message": message, "errorCode": "INTERNAL_ERROR"}, status_code=500)
    origin = request.headers.get("origin")
    if origin and origin in settings.cors_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response


# ---- routes -------------------------------------------------------------------------

@app.get("/health")
def health():
    """200 only when the database answers too - a process that cannot reach Postgres can
    serve nothing useful, and reporting it healthy keeps traffic flowing to it."""
    up = db.healthy()
    return JSONResponse(
        {
            "status": "UP" if up else "DEGRADED",
            "service": "marketing-api",
            "database": "UP" if up else "DOWN",
            "timestamp": db.iso(datetime.now(timezone.utc)),
        },
        status_code=200 if up else 503,
    )


for router in ROUTERS:
    app.include_router(router)
