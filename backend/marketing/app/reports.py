"""The Sales CRM dashboard: pipeline, funnel, sources, areas, follow-ups and revenue."""

from typing import Any

from . import db
from .team import PLAN_PRICE_SQL

STAGES = ("new", "contacted", "demo_booked", "demo_done", "trial", "onboarding", "paying", "lost")
FUNNEL = ("new", "contacted", "demo_booked", "demo_done", "trial", "onboarding", "paying")


def summary() -> dict[str, Any]:
    by_stage = {s: 0 for s in STAGES}
    for r in db.query("SELECT stage, count(*) AS n FROM leads GROUP BY stage"):
        by_stage[r["stage"]] = int(r["n"])

    # A lead that reached "trial" also passed every stage before it, even if someone
    # skipped straight there - so "reached" is counted from the furthest stage each lead
    # has ever been in, not from the history rows alone.
    reached_rows = db.query(
        """SELECT h.lead_id, max(array_position(%s::text[], h.to_stage)) AS furthest
           FROM lead_stage_history h WHERE h.to_stage <> 'lost' GROUP BY h.lead_id""",
        (list(FUNNEL),),
    )
    reached = {s: 0 for s in FUNNEL}
    for r in reached_rows:
        for i in range(r["furthest"] or 0):
            reached[FUNNEL[i]] += 1
    funnel = []
    for i, s in enumerate(FUNNEL):
        prev = reached[FUNNEL[i - 1]] if i else None
        funnel.append({
            "stage": s,
            "reached": reached[s],
            "fromPrevious": round(reached[s] * 100 / prev, 1) if prev else None,
        })
    trial_to_paid = round(reached["paying"] * 100 / reached["trial"], 1) if reached["trial"] else None

    by_source = [
        {"source": r["source"], "total": int(r["total"]), "paying": int(r["paying"])}
        for r in db.query(
            """SELECT source, count(*) AS total, count(*) FILTER (WHERE stage = 'paying') AS paying
               FROM leads GROUP BY source ORDER BY total DESC"""
        )
    ]
    lost_reasons = [
        {"reason": r["reason"], "count": int(r["n"])}
        for r in db.query(
            """SELECT coalesce(nullif(trim(lost_reason), ''), 'Not given') AS reason, count(*) AS n
               FROM leads WHERE stage = 'lost' GROUP BY 1 ORDER BY n DESC LIMIT 8"""
        )
    ]
    follow = db.query_one(
        """SELECT count(*) FILTER (WHERE next_follow_up_on < CURRENT_DATE) AS overdue,
                  count(*) FILTER (WHERE next_follow_up_on = CURRENT_DATE) AS today,
                  count(*) FILTER (WHERE next_follow_up_on IS NULL) AS unscheduled
           FROM leads WHERE stage NOT IN ('paying', 'lost')"""
    )
    money = db.query_one(
        f"""SELECT coalesce(sum({PLAN_PRICE_SQL}) FILTER (WHERE l.stage = 'paying'), 0) AS mrr,
                   coalesce(sum({PLAN_PRICE_SQL}) FILTER (WHERE l.stage IN ('trial', 'onboarding')), 0) AS pipeline
            FROM leads l"""
    )
    # Churn: restaurants that were paying and are now lost.
    churned = db.query_one(
        """SELECT count(DISTINCT h.lead_id) AS n FROM lead_stage_history h
           JOIN leads l ON l.id = h.lead_id
           WHERE h.from_stage = 'paying' AND l.stage = 'lost'"""
    )
    this_month = db.query_one(
        """SELECT count(*) FILTER (WHERE created_at >= date_trunc('month', now())) AS new_leads,
                  (SELECT count(DISTINCT lead_id) FROM lead_stage_history
                    WHERE to_stage = 'paying' AND changed_at >= date_trunc('month', now())) AS won
           FROM leads"""
    )

    return {
        "total": sum(by_stage.values()),
        "byStage": by_stage,
        "funnel": funnel,
        "trialToPaidPct": trial_to_paid,
        "bySource": by_source,
        "lostReasons": lost_reasons,
        "followUps": {k: int(follow[k]) for k in ("overdue", "today", "unscheduled")},
        # Estimated from each lead's expected plan at list price; real billing is Phase 4.
        "mrrInr": db.num(money["mrr"]),
        "trialPipelineInr": db.num(money["pipeline"]),
        "churned": int(churned["n"]),
        "thisMonth": {"newLeads": int(this_month["new_leads"]), "won": int(this_month["won"])},
    }
