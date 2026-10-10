"""Every /api/v1 endpoint.

Authentication is applied per router, at the mount, not per endpoint: a new route under a
protected router is protected by default, and exposing one is a deliberate edit here.
Handlers are plain functions - FastAPI runs them in its thread pool, and the database
pool is synchronous.
"""

from typing import Any

from fastapi import APIRouter, Body, Depends, Request

from . import leads, reports, team
from . import validation as v
from .auth import current_user, require_admin
from .errors import created, no_content, ok

API = "/api/v1"


def _query(request: Request) -> dict[str, str]:
    return dict(request.query_params)


# ---- public -------------------------------------------------------------------

auth_router = APIRouter(prefix=API + "/auth")


# Sign-in itself is Supabase Auth; this says who the token belongs to in the CRM.
@auth_router.get("/me")
def auth_me(user: dict = Depends(current_user)):
    return ok(user)


# The marketing website's demo / free-trial form. Rate limited in main.py.
public_router = APIRouter(prefix=API + "/public")


@public_router.post("/demo-requests")
def demo_request(payload: Any = Body(None)):
    data = v.validate(v.DEMO_REQUEST, payload)
    # Honeypot filled in: answer as if it worked so the bot learns nothing, store nothing.
    if data.get("website"):
        return created({"received": True}, "Thanks, we will call you shortly")
    note = "Demo request from the website."
    if data.get("message"):
        note += "\n" + data["message"]
    # Follow up the same day: a website enquiry is the warmest lead there is.
    leads.create({
        "restaurantName": data["restaurantName"],
        "ownerName": data["ownerName"],
        "phone": data["phone"],
        "whatsapp": data["phone"],
        "email": data.get("email"),
        "area": data.get("area"),
        "city": data["city"],
        "restaurantType": data["restaurantType"],
        "source": "website",
        "stage": "new",
        "notes": note,
    }, follow_up_today=True)
    return created({"received": True}, "Thanks, we will call you shortly")



# ---- protected ------------------------------------------------------------------

guard = [Depends(current_user)]

lead_router = APIRouter(prefix=API + "/leads", dependencies=guard)


@lead_router.get("")
@lead_router.get("/")
def leads_list(request: Request):
    return ok(leads.list_leads(v.validate(v.LEAD_QUERY, _query(request), source="query")))


@lead_router.post("")
@lead_router.post("/")
def leads_create(payload: Any = Body(None)):
    return created(leads.create(v.validate(v.CREATE_LEAD, payload)), "Lead added")


@lead_router.post("/import")
def leads_import(payload: Any = Body(None)):
    data = v.validate(v.IMPORT_LEADS, payload)
    result = leads.import_rows(data["rows"], data["source"])
    return created(result, f"{result['created']} lead(s) imported")


@lead_router.get("/areas")
def leads_areas():
    return ok(leads.areas())


@lead_router.get("/{lead_id}")
def leads_get(lead_id: str):
    return ok(leads.get(lead_id))


@lead_router.patch("/{lead_id}")
def leads_update(lead_id: str, payload: Any = Body(None)):
    patch = v.validate(v.UPDATE_LEAD, payload, partial=True, require_one=True)
    return ok(leads.update(lead_id, patch), "Lead updated")


@lead_router.delete("/{lead_id}", dependencies=[Depends(require_admin)])
def leads_remove(lead_id: str):
    leads.remove(lead_id)
    return no_content()


@lead_router.post("/{lead_id}/conversion")
def leads_converted(lead_id: str, payload: Any = Body(None), user: dict = Depends(require_admin)):
    """The Super Admin app created the restaurant (POST /platform/v1/tenants); link it here."""
    data = v.validate({"tenantId": v.Field(v.required(v.uuid))}, payload)
    return ok(leads.mark_converted(lead_id, data["tenantId"], user), "Lead converted")


@lead_router.get("/{lead_id}/activities")
def activities_list(lead_id: str):
    return ok(leads.list_activities(lead_id))


@lead_router.post("/{lead_id}/activities")
def activities_create(lead_id: str, payload: Any = Body(None), user: dict = Depends(current_user)):
    """Logs an activity; `stage`, `lostReason` and `nextFollowUpOn` update the lead in the same call."""
    data = v.validate(v.CREATE_ACTIVITY, payload)
    return created(leads.log_activity(lead_id, data, user), "Activity logged")


@lead_router.delete("/{lead_id}/activities/{activity_id}")
def activities_remove(lead_id: str, activity_id: str):
    leads.remove_activity(lead_id, activity_id)
    return no_content()


report_router = APIRouter(prefix=API + "/reports", dependencies=guard)


@report_router.get("/summary")
def reports_summary():
    return ok(reports.summary())


user_router = APIRouter(prefix=API + "/users", dependencies=guard)


@user_router.get("")
@user_router.get("/")
def users_list():
    return ok(team.list_users())


@user_router.post("", dependencies=[Depends(require_admin)])
@user_router.post("/", dependencies=[Depends(require_admin)])
def users_create(payload: Any = Body(None)):
    return created(team.create_user(v.validate(v.CREATE_USER, payload)), "Team member added")


@user_router.patch("/{user_id}")
def users_set_active(user_id: str, payload: Any = Body(None), me: dict = Depends(require_admin)):
    data = v.validate({"isActive": v.Field(v.required(v.boolean, "boolean"))}, payload)
    return ok(team.set_user_active(user_id, data["isActive"], me), "Team member updated")


dealer_router = APIRouter(prefix=API + "/dealers", dependencies=guard)


@dealer_router.get("")
@dealer_router.get("/")
def dealers_list():
    return ok(team.list_dealers())


@dealer_router.post("", dependencies=[Depends(require_admin)])
@dealer_router.post("/", dependencies=[Depends(require_admin)])
def dealers_create(payload: Any = Body(None)):
    return created(team.create_dealer(v.validate(v.CREATE_DEALER, payload)), "Dealer added")


@dealer_router.patch("/{dealer_id}", dependencies=[Depends(require_admin)])
def dealers_update(dealer_id: str, payload: Any = Body(None)):
    patch = v.validate(v.UPDATE_DEALER, payload, partial=True, require_one=True)
    return ok(team.update_dealer(dealer_id, patch), "Dealer updated")


ROUTERS = [auth_router, public_router, lead_router, report_router, user_router, dealer_router]
