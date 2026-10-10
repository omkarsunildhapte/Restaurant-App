"""The PostgreSQL connection pool, plus the conversions every repository shares.

This API shares its database with the Node platform API and keeps every table in the
`crm` schema; the search path is set per connection so queries name tables unqualified.

SSL is required for every host except localhost: hosted Postgres (Supabase, Neon, Render)
refuses plaintext connections.

DATE columns are returned as 'YYYY-MM-DD' strings and timestamps as JavaScript-style
ISO strings ('2026-10-06T19:48:00.524Z').
"""

import logging
import re
from contextlib import contextmanager
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Iterator

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import settings

log = logging.getLogger("db")

SCHEMA = "crm"

_is_local = re.search(r"@(localhost|127\.0\.0\.1)[:/]", settings.database_url) is not None
_conninfo = settings.database_url
if not _is_local and "sslmode=" not in _conninfo:
    _conninfo += ("&" if "?" in _conninfo else "?") + "sslmode=require"

pool = ConnectionPool(
    _conninfo,
    min_size=1,
    max_size=10,
    max_idle=30,
    timeout=10,
    # Test each connection before handing it out: after a database restart or failover the
    # pooled connections are dead, and without this the first requests fail with a 500.
    check=ConnectionPool.check_connection,
    # prepare_threshold=None: no server-side prepared statements. A cached plan for
    # `SELECT *` breaks the moment a migration adds a column while the API is running.
    kwargs={
        "row_factory": dict_row,
        "autocommit": True,
        "prepare_threshold": None,
        "connect_timeout": 10,
        # Every restaurant is in India: "today" for follow-ups is an Indian date, whatever
        # time zone the database server runs in. A fixed +05:30 (India has no daylight
        # saving) rather than "Asia/Kolkata", which needs the server's tz database.
        "options": f"-c search_path={SCHEMA},public -c timezone=<+0530>-05:30",
    },
    open=False,
)


def query(sql: str, params: tuple | list = ()) -> list[dict[str, Any]]:
    with pool.connection() as conn:
        cur = conn.execute(sql, params)
        return cur.fetchall() if cur.description else []


def query_one(sql: str, params: tuple | list = ()) -> dict[str, Any] | None:
    rows = query(sql, params)
    return rows[0] if rows else None


@contextmanager
def transaction() -> Iterator[Any]:
    """Runs the block in one transaction; any exception rolls the whole thing back."""
    with pool.connection() as conn:
        with conn.transaction():
            yield conn


def healthy() -> bool:
    try:
        query("SELECT 1")
        return True
    except Exception:  # noqa: BLE001 - any failure means "not healthy"
        log.exception("[db] health check failed")
        return False


def iso(value: datetime | None) -> str | None:
    """JavaScript's Date.toISOString(): UTC, millisecond precision, trailing Z."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    v = value.astimezone(timezone.utc)
    return v.strftime("%Y-%m-%dT%H:%M:%S.") + f"{v.microsecond // 1000:03d}Z"


def day(value: date | None) -> str | None:
    return value.isoformat() if value is not None else None


def num(value: Decimal | int | float | str | None) -> int | float:
    """numeric(12,2) as a JSON number: 12000.00 -> 12000, 12.5 -> 12.5."""
    if value is None:
        return 0
    d = Decimal(str(value))
    return int(d) if d == d.to_integral_value() else float(d)
