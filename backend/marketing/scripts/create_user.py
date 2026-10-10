"""Invites someone to the Sales CRM: Supabase emails them a link to choose their own password.

    .venv/Scripts/python scripts/create_user.py you@example.com "Your Name" admin

Usually not needed: a platform Super Admin is a CRM admin automatically, and admins invite
the rest of the team from the Super Admin app's Team page.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import db, team  # noqa: E402
from app.errors import AppError  # noqa: E402


def main() -> None:
    args = sys.argv[1:]
    if not args:
        sys.exit("Usage: python scripts/create_user.py <email> [name] [admin|sales]")
    email = args[0]
    name = args[1] if len(args) > 1 else email.split("@")[0]
    role = args[2] if len(args) > 2 else "sales"
    if role not in ("admin", "sales"):
        sys.exit("Role must be admin or sales")

    db.pool.open(wait=True, timeout=15)
    try:
        user = team.create_user({"email": email, "name": name, "role": role})
        print(f"[create-user] invite sent to {user['email']} as {role} ({user['id']})")
    except AppError as e:
        sys.exit("[create-user] " + e.message)
    finally:
        db.pool.close()


if __name__ == "__main__":
    main()
