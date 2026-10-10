"""Restaurant leads, their activity history, and CSV import."""

from typing import Any

from . import db
from . import validation as v
from .errors import AppError

COLUMNS = """
  l.id, l.restaurant_name, l.restaurant_type, l.owner_name, l.phone, l.whatsapp, l.email,
  l.area, l.city, l.address, l.maps_url, l.seats, l.outlets,
  l.current_billing, l.billing_software, l.on_aggregators, l.monthly_aggregator_orders,
  l.has_website, l.has_own_riders,
  l.stage, l.lost_reason, l.expected_plan, l.source, l.dealer_id, l.assigned_to,
  l.next_follow_up_on, l.notes, l.latitude, l.longitude, l.location_accuracy_m,
  l.tenant_id, l.converted_at, l.created_at, l.updated_at,
  u.name AS assigned_name, d.name AS dealer_name,
  (SELECT max(a.created_at) FROM lead_activities a WHERE a.lead_id = l.id) AS last_activity_at
"""
FROM = "FROM leads l LEFT JOIN users u ON u.id = l.assigned_to LEFT JOIN dealers d ON d.id = l.dealer_id"

# API field -> column, for inserts and partial updates. Only these keys ever reach SQL.
COLUMN_FOR = {
    "restaurantName": "restaurant_name",
    "restaurantType": "restaurant_type",
    "ownerName": "owner_name",
    "phone": "phone",
    "whatsapp": "whatsapp",
    "email": "email",
    "area": "area",
    "city": "city",
    "address": "address",
    "mapsUrl": "maps_url",
    "seats": "seats",
    "outlets": "outlets",
    "currentBilling": "current_billing",
    "billingSoftware": "billing_software",
    "onAggregators": "on_aggregators",
    "monthlyAggregatorOrders": "monthly_aggregator_orders",
    "hasWebsite": "has_website",
    "hasOwnRiders": "has_own_riders",
    "stage": "stage",
    "lostReason": "lost_reason",
    "expectedPlan": "expected_plan",
    "source": "source",
    "dealerId": "dealer_id",
    "assignedTo": "assigned_to",
    "nextFollowUpOn": "next_follow_up_on",
    "notes": "notes",
    "latitude": "latitude",
    "longitude": "longitude",
    "locationAccuracyM": "location_accuracy_m",
}


def to_domain(r: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(r["id"]),
        "restaurantName": r["restaurant_name"],
        "restaurantType": r["restaurant_type"],
        "ownerName": r["owner_name"],
        "phone": r["phone"],
        "whatsapp": r["whatsapp"],
        "email": r["email"],
        "area": r["area"],
        "city": r["city"],
        "address": r["address"],
        "mapsUrl": r["maps_url"],
        "seats": r["seats"],
        "outlets": r["outlets"],
        "currentBilling": r["current_billing"],
        "billingSoftware": r["billing_software"],
        "onAggregators": r["on_aggregators"],
        "monthlyAggregatorOrders": r["monthly_aggregator_orders"],
        "hasWebsite": r["has_website"],
        "hasOwnRiders": r["has_own_riders"],
        "stage": r["stage"],
        "lostReason": r["lost_reason"],
        "expectedPlan": r["expected_plan"],
        "source": r["source"],
        "dealerId": str(r["dealer_id"]) if r["dealer_id"] else None,
        "dealerName": r["dealer_name"],
        "assignedTo": str(r["assigned_to"]) if r["assigned_to"] else None,
        "assignedName": r["assigned_name"],
        "nextFollowUpOn": db.day(r["next_follow_up_on"]),
        "lastActivityAt": db.iso(r["last_activity_at"]),
        "notes": r["notes"],
        "latitude": float(r["latitude"]) if r["latitude"] is not None else None,
        "longitude": float(r["longitude"]) if r["longitude"] is not None else None,
        "locationAccuracyM": r["location_accuracy_m"],
        "tenantId": str(r["tenant_id"]) if r["tenant_id"] else None,
        "convertedAt": db.iso(r["converted_at"]),
        "createdAt": db.iso(r["created_at"]),
        "updatedAt": db.iso(r["updated_at"]),
    }


def list_leads(f: dict[str, Any]) -> dict[str, Any]:
    """One query returns the page and the total the filter matched (window count before LIMIT)."""
    conds, params = [], []
    for key, col in (("stage", "l.stage"), ("source", "l.source"), ("assignedTo", "l.assigned_to"),
                     ("dealerId", "l.dealer_id")):
        if f.get(key):
            params.append(f[key])
            conds.append(f"{col} = %s")
    if f.get("area"):
        params.append(f["area"])
        conds.append("lower(l.area) = lower(%s)")
    follow = f.get("followUp")
    # Closed leads (paying, lost) never need a follow-up, whatever date is left on them.
    open_only = "l.stage NOT IN ('paying', 'lost')"
    if follow == "overdue":
        conds += [open_only, "l.next_follow_up_on < CURRENT_DATE"]
    elif follow == "today":
        conds += [open_only, "l.next_follow_up_on = CURRENT_DATE"]
    elif follow == "upcoming":
        conds += [open_only, "l.next_follow_up_on > CURRENT_DATE"]
    elif follow == "none":
        conds += [open_only, "l.next_follow_up_on IS NULL"]
    if f.get("search"):
        like = "%" + f["search"] + "%"
        params += [like, like, like, like]
        conds.append("(l.restaurant_name ILIKE %s OR l.owner_name ILIKE %s OR l.area ILIKE %s OR l.phone ILIKE %s)")
    where = ("WHERE " + " AND ".join(conds)) if conds else ""
    order = "l.next_follow_up_on ASC NULLS LAST, l.created_at DESC" if follow else "l.created_at DESC"
    rows = db.query(
        f"SELECT {COLUMNS}, COUNT(*) OVER() AS total {FROM} {where} ORDER BY {order} LIMIT %s OFFSET %s",
        [*params, f["limit"], f["offset"]],
    )
    return {
        "items": [to_domain(r) for r in rows],
        "total": int(rows[0]["total"]) if rows else 0,
        "limit": f["limit"],
        "offset": f["offset"],
    }


def get(lead_id: str) -> dict[str, Any]:
    row = db.query_one(f"SELECT {COLUMNS} {FROM} WHERE l.id = %s", (lead_id,)) if _uuid(lead_id) else None
    if not row:
        raise AppError.not_found("Lead")
    return to_domain(row)


def create(data: dict[str, Any], conn: Any = None, follow_up_today: bool = False) -> dict[str, Any]:
    fields = {k: val for k, val in data.items() if k in COLUMN_FOR}
    _check_lost(fields)
    cols = [COLUMN_FOR[k] for k in fields]
    values = ["%s"] * len(cols)
    if follow_up_today:
        cols.append("next_follow_up_on")
        values.append("CURRENT_DATE")
    sql = f"INSERT INTO leads ({', '.join(cols)}) VALUES ({', '.join(values)}) RETURNING id"
    if conn is not None:
        return {"id": str(conn.execute(sql, list(fields.values())).fetchone()["id"])}
    row = _translate_fk(lambda: db.query_one(sql, list(fields.values())))
    return get(str(row["id"]))


def update(lead_id: str, patch: dict[str, Any]) -> dict[str, Any]:
    """Sets exactly the fields that were sent - an absent key is left alone, an explicit
    null clears the column."""
    fields = {k: val for k, val in patch.items() if k in COLUMN_FOR}
    if not fields:
        return get(lead_id)
    if not _uuid(lead_id):
        raise AppError.not_found("Lead")
    _check_lost(fields)
    # Leaving "lost" clears the reason, so a revived lead does not carry a stale one.
    if fields.get("stage") and fields["stage"] != "lost" and "lostReason" not in fields:
        fields["lostReason"] = None
    sets = ", ".join(f"{COLUMN_FOR[k]} = %s" for k in fields)
    row = _translate_fk(lambda: db.query_one(
        f"UPDATE leads SET {sets} WHERE id = %s RETURNING id", [*fields.values(), lead_id]))
    if not row:
        raise AppError.not_found("Lead")
    return get(lead_id)


def remove(lead_id: str) -> None:
    if not _uuid(lead_id) or not db.query("DELETE FROM leads WHERE id = %s RETURNING id", (lead_id,)):
        raise AppError.not_found("Lead")


def _check_lost(fields: dict[str, Any]) -> None:
    if fields.get("stage") == "lost" and not fields.get("lostReason"):
        raise AppError.validation([{"field": "lostReason", "message": "Say why the lead was lost"}])
    # A location is a pair: sending one coordinate without the other is a client bug.
    if ("latitude" in fields) != ("longitude" in fields) or (
        "latitude" in fields and (fields["latitude"] is None) != (fields["longitude"] is None)
    ):
        raise AppError.validation([{"field": "longitude", "message": "Send latitude and longitude together"}])


def _translate_fk(run):
    """An unknown dealer or salesperson id is the caller's mistake, not a 500."""
    from psycopg import errors as pg

    try:
        return run()
    except pg.ForeignKeyViolation as e:
        field = "dealerId" if "dealer" in str(e) else "assignedTo"
        raise AppError.validation([{"field": field, "message": "No such record"}]) from None


# ---- activities ---------------------------------------------------------------

def _activity(r: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(r["id"]),
        "leadId": str(r["lead_id"]),
        "type": r["type"],
        "outcome": r["outcome"],
        "note": r["note"],
        "createdBy": str(r["created_by"]) if r["created_by"] else None,
        "createdByName": r.get("created_by_name"),
        "createdAt": db.iso(r["created_at"]),
    }


def list_activities(lead_id: str) -> list[dict[str, Any]]:
    get(lead_id)  # 404 for an unknown lead, rather than an empty list
    rows = db.query(
        """SELECT a.id, a.lead_id, a.type, a.outcome, a.note, a.created_by, a.created_at, u.name AS created_by_name
           FROM lead_activities a LEFT JOIN users u ON u.id = a.created_by
           WHERE a.lead_id = %s ORDER BY a.created_at DESC""",
        (lead_id,),
    )
    return [_activity(r) for r in rows]


def log_activity(lead_id: str, data: dict[str, Any], user: dict[str, str]) -> dict[str, Any]:
    """Logs an activity and, in the same call, moves the lead and sets its next follow-up."""
    get(lead_id)
    patch = {k: data[k] for k in ("stage", "lostReason", "nextFollowUpOn") if k in data}
    lead = update(lead_id, patch) if patch else None
    row = db.query_one(
        """INSERT INTO lead_activities (lead_id, type, outcome, note, created_by) VALUES (%s, %s, %s, %s, %s)
           RETURNING id, lead_id, type, outcome, note, created_by, created_at""",
        (lead_id, data["type"], data.get("outcome"), data.get("note"), user["id"]),
    )
    activity = _activity({**row, "created_by_name": user["name"]})
    return {"activity": activity, "lead": lead or get(lead_id)}


# Stages before a restaurant exists; converting moves these to "trial".
BEFORE_TRIAL = ("new", "contacted", "demo_booked", "demo_done", "lost")


def mark_converted(lead_id: str, tenant_id: str, user: dict[str, str]) -> dict[str, Any]:
    """Records that this lead is now a restaurant on the platform (created by the Super Admin
    app through the Node API), starts its trial in the pipeline, and schedules the trial
    check-in call three days out."""
    from psycopg import errors as pg

    lead = get(lead_id)
    if lead["tenantId"]:
        raise AppError.conflict("This lead is already a restaurant on the platform")
    stage_sql = "CASE WHEN stage = ANY(%s) THEN 'trial' ELSE stage END"
    try:
        with db.transaction() as conn:
            conn.execute(
                f"""UPDATE leads SET tenant_id = %s, converted_at = now(), stage = {stage_sql}, lost_reason = NULL,
                       next_follow_up_on = CURRENT_DATE + 3
                    WHERE id = %s""",
                (tenant_id, list(BEFORE_TRIAL), lead_id),
            )
            conn.execute(
                "INSERT INTO lead_activities (lead_id, type, outcome, note, created_by) VALUES (%s, 'note', 'trial_started', %s, %s)",
                (lead_id, "Restaurant created on the platform; free trial started.", user["id"]),
            )
    except pg.UniqueViolation:
        raise AppError.conflict("That restaurant is already linked to another lead") from None
    return get(lead_id)


def remove_activity(lead_id: str, activity_id: str) -> None:
    if not (_uuid(lead_id) and _uuid(activity_id)) or not db.query(
        "DELETE FROM lead_activities WHERE id = %s AND lead_id = %s RETURNING id", (activity_id, lead_id)
    ):
        raise AppError.not_found("Activity")


# ---- import ---------------------------------------------------------------------

def import_rows(rows: list[Any], source: str) -> dict[str, Any]:
    """Validates each row on its own, skips duplicates, and inserts the rest in one
    transaction. Rows are numbered from 1 so the console can point at the CSV line.

    A duplicate is the same mobile number, or - for rows without one - the same name in
    the same area, whether it is already in the CRM or earlier in this same file.
    """
    existing = db.query("SELECT phone, lower(restaurant_name) AS name, lower(coalesce(area, '')) AS area FROM leads")
    phones = {r["phone"] for r in existing if r["phone"]}
    names = {(r["name"], r["area"]) for r in existing}

    valid, skipped = [], []
    for i, raw in enumerate(rows, start=1):
        if not isinstance(raw, dict):
            skipped.append({"row": i, "reason": "Not a row of fields"})
            continue
        try:
            data = v.validate(v.CREATE_LEAD, {"source": source, **raw})
        except AppError as e:
            first = (e.details or [{}])[0]
            skipped.append({"row": i, "reason": f"{first.get('field', '')}: {first.get('message', e.message)}"})
            continue
        key = (data["restaurantName"].lower(), (data.get("area") or "").lower())
        if (data.get("phone") and data["phone"] in phones) or (not data.get("phone") and key in names):
            skipped.append({"row": i, "reason": "Already in the CRM"})
            continue
        if data.get("phone"):
            phones.add(data["phone"])
        names.add(key)
        valid.append(data)

    with db.transaction() as conn:
        for data in valid:
            create(data, conn)
    return {"created": len(valid), "skipped": skipped}


def areas() -> list[dict[str, Any]]:
    """Every area with its open and total lead counts, for route planning."""
    rows = db.query(
        """SELECT coalesce(nullif(trim(area), ''), 'No area') AS area,
                  count(*) AS total,
                  count(*) FILTER (WHERE stage NOT IN ('paying', 'lost')) AS open,
                  count(*) FILTER (WHERE stage = 'paying') AS paying,
                  count(*) FILTER (WHERE stage NOT IN ('paying', 'lost') AND next_follow_up_on <= CURRENT_DATE) AS due
           FROM leads GROUP BY 1 ORDER BY open DESC, total DESC, 1"""
    )
    return [{k: (int(r[k]) if k != "area" else r[k]) for k in r} for r in rows]


def _uuid(value: str) -> bool:
    """Postgres rejects a malformed uuid with an error; treat it as "no such row" instead."""
    return bool(v.UUID_RE.match(value or ""))

