# AGA Health Foundation — Research Hub Roadmap

**Status:** v1.0.0 implemented — see [platform/](./platform/) and [CHANGELOG.md](../CHANGELOG.md)  
**Last updated:** 2026-07-03  
**Decisions:** [platform/decisions.md](./platform/decisions.md)

> **Detailed design:** [docs/platform/](./platform/README.md)

---

## 1. What the hub is

A **single hospital-facing platform** where AGA Health Foundation staff can:

- Discover active and past research studies
- Share study links with participants
- Access study-specific admin dashboards and reports
- Manage access with study-scoped roles and system-level administration

---

## 2. What exists today (v1.0.0)

| Component | Role | Status |
|-----------|------|--------|
| `artifacts/telehealth-survey/src/platform/` | Hub shell: `/`, system admin | **Implemented** |
| `artifacts/telehealth-survey/src/studies/telehealth-readiness/` | Study #1 UI | **Active** |
| `artifacts/telehealth-survey/src/studies/clinician-telehealth-readiness/` | Study #2 UI | **Implemented (draft)** |
| `artifacts/api-server` | REST API + platform routes | **Implemented** |
| `studies` registry table | Study metadata + collection windows | **Implemented** |
| `telehealth_readiness_surveys` | Study #1 responses | **Migrated** |
| `clinician_telehealth_readiness_surveys` | Study #2 responses | **Implemented** |
| `artifacts/research-hub` | Physical artifact split | **Deferred** |

---

## 3. Phase completion

| Phase | Deliverable | Status |
|-------|-------------|--------|
| H1 | Hub shell + study directory at `/` | Done |
| H2 | Study registry in DB; telehealth under hub routes | Done |
| H3 | Clinician study artifact + DB table | Done (draft status) |
| H4 | Study-scoped permissions; system admin access UI | Done |
| H5 | Cross-study reporting for leadership | Not started |
| H6 | Physical `research-hub` artifact extraction | Deferred |
| H7 | Hospital SSO evaluation | Not started |

---

## 4. Principles (unchanged)

1. **Study slug everywhere** — routes, API paths; one responses table per study.
2. **Config-driven study metadata** — registry + per-study config files.
3. **Auth that scales** — `admin_users` + `admin_user_study_access` + `system_admins`.
4. **Export and audit** — named users, role-based export.
5. **Defer abstraction** — shared libraries extracted only when needed.

---

## 5. Out of scope (still)

- Study creation wizard for non-technical staff
- Cross-study analytics dashboard
- EMR integration
- SMS/WhatsApp recruitment pipelines
- Bilingual platform shell
- Automated leadership reports

---

## 6. Resolved decisions

See [platform/decisions.md](./platform/decisions.md).

---

## 7. Change log

| Date | Change |
|------|--------|
| 2026-06-29 | Initial roadmap stub |
| 2026-07-02 | Decisions resolved; design pack in `docs/platform/` |
| 2026-07-03 | v1.0.0 platform implementation shipped |
