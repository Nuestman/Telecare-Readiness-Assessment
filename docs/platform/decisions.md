# Platform — Resolved Decisions

**Status:** Approved  
**Last updated:** 2026-07-02

Authoritative record of decisions made before implementation. Supersedes “open questions” in [hub-roadmap.md](../hub-roadmap.md) and [conceptual-design.md](./conceptual-design.md).

---

## Architecture & structure

| # | Decision | Detail |
|---|----------|--------|
| A1 | **Hub is separate from study artifacts** | `artifacts/research-hub` is the platform shell (landing `/`, system admin). `artifacts/telehealth-survey` is study #1 only — not the hub. |
| A2 | **Study slug ↔ artifact mapping** | Slug `telehealth-readiness` = artifact `telehealth-survey`. Slug `clinician-telehealth-readiness` = artifact `clinician-telehealth-survey` (planned). |
| A3 | **One DB table per study** | Each study has its own responses table (e.g. `telehealth_readiness_surveys`). No shared `surveys` table with `study_slug`. Registry `studies` table links slug → table name. |
| A4 | **Study #2** | `clinician-telehealth-readiness` — clinician-facing telehealth readiness survey; separate artifact and DB table. |

---

## Participants & URLs

| # | Decision | Detail |
|---|----------|--------|
| P1 | **Participants use direct study links** | Primary entry: `/studies/{slug}` or `/studies/{slug}/survey`. QR codes and recruitment materials point at study URLs, not `/`. |
| P2 | **Hub landing `/` still exists** | For staff, leadership, and optional discovery — not the main participant funnel. |

---

## Operations & governance

| # | Decision | Detail |
|---|----------|--------|
| O1 | **New studies: IT only (v1)** | Adding a study requires developer work (artifact, schema table, routes). System admin UI manages registry metadata and access only. Study-creation wizard deferred. |
| O2 | **Ghana Data Protection Act** | Compliance review **required** at platform/hub scale before wider rollout. See [compliance.md](./compliance.md). |
| O3 | **Hosting** | **Stay on Replit** for now. Move to Render/Railway + standalone Neon when ready ([hosting-and-neon-migration.md](./hosting-and-neon-migration.md)). |

---

## Product behaviour

| # | Decision | Detail |
|---|----------|--------|
| B1 | **Study `admin` can invite to their study** | Yes — registration scoped to study slug auto-grants membership for that study only. |
| B2 | **`paused` studies on public list** | Show with “Temporarily unavailable” badge; no survey CTA. |
| B3 | **`draft` studies** | Visible to system admin only; never on public `GET /api/studies`. |
| B4 | **Branding** | Platform `/`: AGA Health Foundation. Study pages: study-specific copy. |

---

## Change log

| Date | Change |
|------|--------|
| 2026-07-02 | Initial decisions recorded from stakeholder review |
| 2026-07-03 | v1.0.0 platform implementation shipped |
