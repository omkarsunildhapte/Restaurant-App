"""Request validation: every schema maps a field to a check that returns the cleaned value
or raises Invalid.

`validate()` returns only the fields the caller sent (plus defaults on create), so a PATCH
changes exactly what it names - unknown keys are dropped, never passed to SQL. Errors come
back as a 422 with details [{field, message}].

The building blocks are shared with vernoka-admin's backend.
"""


import math
import re
from dataclasses import dataclass
from typing import Any, Callable

from .errors import AppError
STAGES = ("new", "contacted", "demo_booked", "demo_done", "trial", "onboarding", "paying", "lost")
RESTAURANT_TYPES = ("cafe", "family_restaurant", "qsr", "cloud_kitchen", "bakery", "bar", "chain", "other")
BILLING = ("unknown", "paper", "petpooja", "other_software", "none")
SOURCES = ("website", "walk_in", "dealer", "referral", "instagram", "google_ads", "expo", "import", "other")
PLANS = ("starter", "pro", "chain")
ACTIVITY_TYPES = ("call", "visit", "whatsapp", "demo", "email", "note")
ACTIVITY_OUTCOMES = (
    "no_answer", "interested", "call_back", "not_interested", "demo_booked", "trial_started", "won", "lost",
)
FOLLOW_UP_FILTERS = ("overdue", "today", "upcoming", "none")
ROLES = ("admin", "sales")

# The pattern Zod 4 uses for .email().
EMAIL_RE = re.compile(
    r"^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$"
)
UUID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
DATETIME_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$")

MISSING = object()


class Invalid(Exception):
    pass


Check = Callable[[Any], Any]


@dataclass
class Field:
    check: Check
    default: Any = MISSING


def _type_name(v: Any) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, (int, float)):
        return "number"
    if isinstance(v, list):
        return "array"
    if isinstance(v, dict):
        return "object"
    return "string"


def _expect(kind: str, v: Any) -> Invalid:
    return Invalid(f"Invalid input: expected {kind}, received {_type_name(v)}")


# ---- building blocks ------------------------------------------------------

def string(min_len: int | None = None, max_len: int | None = None, min_msg: str | None = None,
           pattern: re.Pattern | None = None, pattern_msg: str = "Invalid string", trim: bool = True) -> Check:
    def check(v: Any) -> str:
        if not isinstance(v, str):
            raise _expect("string", v)
        s = v.strip() if trim else v
        if min_len is not None and len(s) < min_len:
            raise Invalid(min_msg or f"Too small: expected string to have >={min_len} characters")
        if max_len is not None and len(s) > max_len:
            raise Invalid(f"Too big: expected string to have <={max_len} characters")
        if pattern is not None and not pattern.search(s):
            raise Invalid(pattern_msg)
        return s
    return check


def email(msg: str = "Enter a valid email address", max_len: int | None = None) -> Check:
    return string(max_len=max_len, pattern=EMAIL_RE, pattern_msg=msg)


def nullable(inner: Check) -> Check:
    return lambda v: None if v is None else inner(v)


def optional_text(v: Any) -> str | None:
    """Trims, then treats an empty string as "not provided" so blank fields clear cleanly."""
    if v is None:
        return None
    s = string(max_len=500)(v)
    return s or None


def enum(values: tuple[str, ...]) -> Check:
    def check(v: Any) -> str:
        if v not in values:
            raise Invalid("Invalid option: expected one of " + "|".join(f'"{x}"' for x in values))
        return v
    return check


def number(min_v: float | None = None, max_v: float | None = None, integer: bool = False,
           min_msg: str | None = None, max_msg: str | None = None) -> Check:
    """z.coerce.number(): strings and booleans are converted the way JavaScript's Number() would."""
    def check(v: Any) -> int | float:
        if isinstance(v, bool):
            n: float = float(v)
        elif isinstance(v, (int, float)):
            n = float(v)
        elif isinstance(v, str):
            t = v.strip()
            try:
                n = float(t) if t else 0.0
            except ValueError:
                raise Invalid("Invalid input: expected number, received NaN") from None
        elif v is None:
            n = 0.0
        else:
            raise Invalid("Invalid input: expected number, received NaN")
        if math.isnan(n) or math.isinf(n):
            raise Invalid("Invalid input: expected number, received NaN")
        if integer and n != int(n):
            raise Invalid("Invalid input: expected int, received number")
        if min_v is not None and n < min_v:
            raise Invalid(min_msg or f"Too small: expected number to be >={min_v:g}")
        if max_v is not None and n > max_v:
            raise Invalid(max_msg or f"Too big: expected number to be <={max_v:g}")
        return int(n) if n == int(n) else n
    return check


money = number(0, 99_999_999, min_msg="Amount cannot be negative", max_msg="Amount is larger than this system supports")


def positive(inner: Check, msg: str) -> Check:
    def check(v: Any) -> Any:
        n = inner(v)
        if not n > 0:
            raise Invalid(msg)
        return n
    return check


iso_date = nullable(string(pattern=DATE_RE, pattern_msg="Expected a date as YYYY-MM-DD", trim=False))
uuid = string(pattern=UUID_RE, pattern_msg="Invalid UUID", trim=False)


def list_of(inner: Check, max_items: int) -> Check:
    def check(v: Any) -> list:
        if not isinstance(v, list):
            raise _expect("array", v)
        if len(v) > max_items:
            raise Invalid(f"Too big: expected array to have <={max_items} items")
        return [inner(x) for x in v]
    return check


def boolean(v: Any) -> bool:
    if not isinstance(v, bool):
        raise _expect("boolean", v)
    return v


# ---- presence handling ---------------------------------------------------

class _Missing:
    """What a check sees for an absent field: required checks reject it, optional() skips."""


MISSING_SENTINEL = _Missing()


def required(inner: Check, kind: str = "string") -> Check:
    def check(v: Any) -> Any:
        if isinstance(v, _Missing):
            raise Invalid(f"Invalid input: expected {kind}, received undefined")
        return inner(v)
    return check


def optional(inner: Check) -> Check:
    def check(v: Any) -> Any:
        if isinstance(v, _Missing):
            raise _Skip()
        return inner(v)
    return check


class _Skip(Exception):
    pass


def phone_in() -> Check:
    """An Indian mobile number in any common spelling (+91 98220 12345, 098220-12345),
    stored as its 10 digits so the same restaurant typed two ways is still one match."""
    def check(v: Any) -> str | None:
        if v is None:
            return None
        s = string(max_len=30)(v)
        if not s:
            return None
        digits = re.sub(r"\D", "", s)
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        elif len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]
        if not re.fullmatch(r"[6-9]\d{9}", digits):
            raise Invalid("Enter a 10-digit mobile number")
        return digits
    return check


def optional_long_text(max_len: int) -> Check:
    def check(v: Any) -> str | None:
        if v is None:
            return None
        s = string(max_len=max_len)(v)
        return s or None
    return check


def url(v: Any) -> str | None:
    if v is None:
        return None
    s = string(max_len=500)(v)
    if not s:
        return None
    if not re.match(r"^https?://", s, re.I):
        raise Invalid("Paste the full link, starting with https://")
    return s


def optional_bool(v: Any) -> bool | None:
    return None if v is None else boolean(v)


count = nullable(number(0, 1_000_000, integer=True))


# ---- schemas ----------------------------------------------------------------

def _lead_fields(create: bool) -> dict[str, Field]:
    keep = MISSING
    return {
        "restaurantName": Field(required(string(1, 160, "Restaurant name is required"))),
        "restaurantType": Field(enum(RESTAURANT_TYPES), default="cafe" if create else keep),
        "ownerName": Field(optional(optional_text)),
        "phone": Field(optional(phone_in())),
        "whatsapp": Field(optional(phone_in())),
        "email": Field(optional(nullable(email(max_len=200)))),
        "area": Field(optional(optional_text)),
        "city": Field(string(1, 80), default="Pune" if create else keep),
        "address": Field(optional(optional_text)),
        "mapsUrl": Field(optional(url)),
        "seats": Field(optional(count)),
        "outlets": Field(number(1, 1000, integer=True), default=1 if create else keep),
        "currentBilling": Field(enum(BILLING), default="unknown" if create else keep),
        "billingSoftware": Field(optional(optional_text)),
        "onAggregators": Field(optional(optional_bool)),
        "monthlyAggregatorOrders": Field(optional(count)),
        "hasWebsite": Field(optional(optional_bool)),
        "hasOwnRiders": Field(optional(optional_bool)),
        "stage": Field(enum(STAGES), default="new" if create else keep),
        "lostReason": Field(optional(optional_text)),
        "expectedPlan": Field(optional(nullable(enum(PLANS)))),
        "source": Field(enum(SOURCES), default="other" if create else keep),
        "dealerId": Field(optional(nullable(uuid))),
        "assignedTo": Field(optional(nullable(uuid))),
        "nextFollowUpOn": Field(optional(iso_date)),
        "notes": Field(optional(optional_long_text(4000))),
        "latitude": Field(optional(nullable(number(-90, 90)))),
        "longitude": Field(optional(nullable(number(-180, 180)))),
        "locationAccuracyM": Field(optional(nullable(number(0, 1_000_000, integer=True)))),
    }


CREATE_LEAD = _lead_fields(create=True)
UPDATE_LEAD = _lead_fields(create=False)

LEAD_QUERY = {
    "limit": Field(number(1, 1000, integer=True), default=500),
    "offset": Field(number(0, integer=True), default=0),
    "stage": Field(optional(enum(STAGES))),
    "source": Field(optional(enum(SOURCES))),
    "area": Field(optional(string(1, 120))),
    "assignedTo": Field(optional(uuid)),
    "dealerId": Field(optional(uuid)),
    "followUp": Field(optional(enum(FOLLOW_UP_FILTERS))),
    "search": Field(optional(string(1, 120))),
}

CREATE_ACTIVITY = {
    "type": Field(required(enum(ACTIVITY_TYPES))),
    "outcome": Field(optional(nullable(enum(ACTIVITY_OUTCOMES)))),
    "note": Field(optional(optional_long_text(2000))),
    # Optional, applied to the lead in the same call: where it moves and when to call next.
    "stage": Field(optional(enum(STAGES))),
    "lostReason": Field(optional(optional_text)),
    "nextFollowUpOn": Field(optional(iso_date)),
}

IMPORT_LEADS = {
    "rows": Field(required(list_of(lambda v: v, 2000), "array")),
    "source": Field(enum(SOURCES), default="import"),
}

# The marketing website's "Book a demo / Start free trial" form. `website` is a honeypot:
# a hidden input people never fill, bots usually do.
DEMO_REQUEST = {
    "restaurantName": Field(required(string(1, 160, "Restaurant name is required"))),
    "ownerName": Field(required(string(1, 120, "Your name is required"))),
    "phone": Field(required(phone_in())),
    "email": Field(optional(nullable(email(max_len=200)))),
    "area": Field(optional(optional_text)),
    "city": Field(string(1, 80), default="Pune"),
    "restaurantType": Field(enum(RESTAURANT_TYPES), default="cafe"),
    "message": Field(optional(optional_long_text(1000))),
    "website": Field(optional(nullable(string(max_len=200)))),
}


def _dealer_fields(create: bool) -> dict[str, Field]:
    keep = MISSING
    return {
        "name": Field(required(string(1, 120, "Name is required"))),
        "company": Field(optional(optional_text)),
        "phone": Field(optional(phone_in())),
        "email": Field(optional(nullable(email(max_len=200)))),
        "area": Field(optional(optional_text)),
        "city": Field(string(1, 80), default="Pune" if create else keep),
        "commissionPct": Field(number(0, 100), default=20 if create else keep),
        "isActive": Field(boolean, default=True if create else keep),
        "notes": Field(optional(optional_long_text(2000))),
    }


CREATE_DEALER = _dealer_fields(create=True)
UPDATE_DEALER = _dealer_fields(create=False)

CREATE_USER = {
    "email": Field(required(email(max_len=200))),
    "name": Field(required(string(1, 120, "Name is required"))),
    "role": Field(enum(ROLES), default="sales"),
}

def validate(schema: dict[str, Field], data: Any, *, partial: bool = False, source: str = "body",
             require_one: bool = False) -> dict[str, Any]:
    """Cleans `data` against `schema`. `partial` (PATCH): nothing required, no defaults."""
    if data is None:
        data = {}
    if not isinstance(data, dict):
        raise AppError.validation([{"field": source, "message": "Invalid input: expected object, received " + _type_name(data)}])
    out: dict[str, Any] = {}
    issues: list[dict[str, str]] = []
    for name, field in schema.items():
        present = name in data
        if not present:
            if partial:
                continue
            if field.default is not MISSING:
                out[name] = field.default
                continue
            try:
                out[name] = field.check(MISSING_SENTINEL)
            except _Skip:
                pass
            except Invalid as e:
                issues.append({"field": name, "message": str(e)})
            continue
        try:
            out[name] = field.check(data[name])
        except _Skip:
            pass
        except Invalid as e:
            issues.append({"field": name, "message": str(e)})
    if issues:
        raise AppError.validation(issues)
    if require_one and not out:
        raise AppError.validation([{"field": source, "message": "Send at least one field to update"}])
    return out
