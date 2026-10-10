"""The sales team (CRM users) and dealers/partners."""

from typing import Any

import httpx

from . import db
from .config import settings
from .errors import AppError
from .leads import _uuid

# Monthly price per plan, from ROADMAP pricing. Used to estimate MRR and dealer commission
# until subscriptions are billed for real in the platform (Phase 4).
PLAN_PRICE_SQL = "CASE l.expected_plan WHEN 'pro' THEN 2999 WHEN 'chain' THEN 4999 ELSE 1499 END"


# ---- users -------------------------------------------------------------------

def _user(r: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(r["id"]),
        "email": r["email"],
        "name": r["name"],
        "role": r["role"],
        "isActive": r["is_active"],
        "lastLoginAt": db.iso(r["last_login_at"]),
        "openLeads": int(r.get("open_leads") or 0),
        "paying": int(r.get("paying") or 0),
        "followUpsDue": int(r.get("due") or 0),
    }


def list_users() -> list[dict[str, Any]]:
    """Everyone on the team with how many leads they hold - the per-person results."""
    rows = db.query(
        """SELECT u.id, u.email, u.name, u.role, u.is_active, u.last_login_at,
                  count(l.id) FILTER (WHERE l.stage NOT IN ('paying', 'lost')) AS open_leads,
                  count(l.id) FILTER (WHERE l.stage = 'paying') AS paying,
                  count(l.id) FILTER (WHERE l.stage NOT IN ('paying', 'lost')
                                        AND l.next_follow_up_on <= CURRENT_DATE) AS due
           FROM users u LEFT JOIN leads l ON l.assigned_to = u.id
           GROUP BY u.id ORDER BY u.is_active DESC, u.name"""
    )
    return [_user(r) for r in rows]


def create_user(data: dict[str, Any]) -> dict[str, Any]:
    """Creates the person's Supabase account with a starting password and their CRM role.

    The role goes in app_metadata, which only this server-side key can write; the person
    signs in to the Super Admin app with this email and password straight away.
    """
    try:
        res = httpx.post(
            settings.supabase_url + "/auth/v1/admin/users",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": "Bearer " + settings.supabase_service_role_key,
            },
            json={
                "email": data["email"],
                "password": data["password"],
                "email_confirm": True,
                "user_metadata": {"name": data["name"]},
                "app_metadata": {"crm_role": data["role"]},
            },
            timeout=15,
        )
    except httpx.HTTPError:
        raise AppError("Cannot reach Supabase to create the account", 503, "AUTH_UNAVAILABLE") from None
    if res.status_code == 422 and "exist" in res.text.lower():
        raise AppError.conflict("An account with that email already exists")
    if res.status_code >= 400:
        detail = res.json().get("msg") if res.headers.get("content-type", "").startswith("application/json") else None
        raise AppError.bad_request(detail or "Supabase refused to create the account")
    user_id = res.json()["id"]
    row = db.query_one(
        """INSERT INTO users (id, email, name, role) VALUES (%s, %s, %s, %s)
           ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role, is_active = true
           RETURNING id, email, name, role, is_active, last_login_at""",
        (user_id, data["email"], data["name"], data["role"]),
    )
    return _user(row)


def set_user_active(user_id: str, active: bool, me: dict[str, str]) -> dict[str, Any]:
    if user_id == me["id"] and not active:
        raise AppError.bad_request("You cannot switch off your own account")
    row = db.query_one(
        "UPDATE users SET is_active = %s WHERE id = %s RETURNING id, email, name, role, is_active, last_login_at",
        (active, user_id),
    ) if _uuid(user_id) else None
    if not row:
        raise AppError.not_found("User")
    return _user(row)


# ---- dealers -------------------------------------------------------------------

DEALER_COLUMN_FOR = {
    "name": "name",
    "company": "company",
    "phone": "phone",
    "email": "email",
    "area": "area",
    "city": "city",
    "commissionPct": "commission_pct",
    "isActive": "is_active",
    "notes": "notes",
}


def _dealer(r: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(r["id"]),
        "name": r["name"],
        "company": r["company"],
        "phone": r["phone"],
        "email": r["email"],
        "area": r["area"],
        "city": r["city"],
        "commissionPct": db.num(r["commission_pct"]),
        "isActive": r["is_active"],
        "notes": r["notes"],
        "leads": int(r.get("leads") or 0),
        "paying": int(r.get("paying") or 0),
        # Estimated from each paying lead's expected plan until real billing exists.
        "monthlyCommissionInr": db.num(r.get("commission_inr")),
        "createdAt": db.iso(r["created_at"]),
    }


def _dealer_query(where: str = "") -> str:
    return f"""SELECT d.*,
                  count(l.id) AS leads,
                  count(l.id) FILTER (WHERE l.stage = 'paying') AS paying,
                  round(coalesce(sum({PLAN_PRICE_SQL}) FILTER (WHERE l.stage = 'paying'), 0)
                        * d.commission_pct / 100, 2) AS commission_inr
               FROM dealers d LEFT JOIN leads l ON l.dealer_id = d.id
               {where}
               GROUP BY d.id"""


def list_dealers() -> list[dict[str, Any]]:
    return [_dealer(r) for r in db.query(_dealer_query() + " ORDER BY d.is_active DESC, d.name")]


def get_dealer(dealer_id: str) -> dict[str, Any]:
    row = db.query_one(_dealer_query("WHERE d.id = %s"), (dealer_id,)) if _uuid(dealer_id) else None
    if not row:
        raise AppError.not_found("Dealer")
    return _dealer(row)


def create_dealer(data: dict[str, Any]) -> dict[str, Any]:
    fields = {k: val for k, val in data.items() if k in DEALER_COLUMN_FOR}
    cols = [DEALER_COLUMN_FOR[k] for k in fields]
    row = db.query_one(
        f"INSERT INTO dealers ({', '.join(cols)}) VALUES ({', '.join(['%s'] * len(cols))}) RETURNING id",
        list(fields.values()),
    )
    return get_dealer(str(row["id"]))


def update_dealer(dealer_id: str, patch: dict[str, Any]) -> dict[str, Any]:
    fields = {k: val for k, val in patch.items() if k in DEALER_COLUMN_FOR}
    if not _uuid(dealer_id):
        raise AppError.not_found("Dealer")
    sets = ", ".join(f"{DEALER_COLUMN_FOR[k]} = %s" for k in fields)
    if not db.query(f"UPDATE dealers SET {sets} WHERE id = %s RETURNING id", [*fields.values(), dealer_id]):
        raise AppError.not_found("Dealer")
    return get_dealer(dealer_id)
