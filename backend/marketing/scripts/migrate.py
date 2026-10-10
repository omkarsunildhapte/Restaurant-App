"""Applies every .sql file in db/ that has not run yet, in filename order.

    .venv/Scripts/python scripts/migrate.py

Each file runs in its own transaction with its filename recorded in the same transaction,
so a migration that fails halfway leaves nothing behind - re-running is always safe.
Everything goes into the `crm` schema, created here first.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import db  # noqa: E402

MIGRATIONS = Path(__file__).resolve().parent.parent / "db"


def main() -> None:
    db.pool.open(wait=True, timeout=15)
    try:
        db.query(f"CREATE SCHEMA IF NOT EXISTS {db.SCHEMA}")
        db.query(
            """CREATE TABLE IF NOT EXISTS schema_migrations (
                 filename   text PRIMARY KEY,
                 applied_at timestamptz NOT NULL DEFAULT now()
               )"""
        )
        applied = {r["filename"] for r in db.query("SELECT filename FROM schema_migrations")}
        pending = sorted(p for p in MIGRATIONS.glob("*.sql") if p.name not in applied)
        if not pending:
            print("[migrate] nothing to apply, schema is current")
            return
        for path in pending:
            print("[migrate] applying " + path.name)
            with db.transaction() as conn:
                conn.execute(path.read_text(encoding="utf-8"))
                conn.execute("INSERT INTO schema_migrations (filename) VALUES (%s)", (path.name,))
            print("[migrate] applied " + path.name)
        print(f"[migrate] done, {len(pending)} migration(s) applied")
    finally:
        db.pool.close()


if __name__ == "__main__":
    main()
