"""Gives someone a Sales CRM login: creates their Supabase account with a CRM role.

    .venv/Scripts/python scripts/create_user.py you@example.com "a good password" "Your Name" admin

Usually not needed: a platform Super Admin is a CRM admin automatically, and admins add
the rest of the team from the Super Admin app's Team page. A password passed as an
argument lands in the shell history - fine on your own machine, worth clearing afterwards.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import db, team  # noqa: E402
from app.errors import AppError  # noqa: E402


def main() -> None:
    args = sys.argv[1:]
    if len(args) < 2:
        sys.exit("Usage: python scripts/create_user.py <email> <password> [name] [admin|sales]")
    email, password = args[0], args[1]
    name = args[2] if len(args) > 2 else email.split("@")[0]
    role = args[3] if len(args) > 3 else "sales"
    if role not in ("admin", "sales"):
        sys.exit("Role must be admin or sales")
    if len(password) < 10:
        sys.exit("Choose a password of at least 10 characters")

    db.pool.open(wait=True, timeout=15)
    try:
        user = team.create_user({"email": email, "password": password, "name": name, "role": role})
        print(f"[create-user] {user['email']} can now sign in as {role} ({user['id']})")
    except AppError as e:
        sys.exit("[create-user] " + e.message)
    finally:
        db.pool.close()


if __name__ == "__main__":
    main()
