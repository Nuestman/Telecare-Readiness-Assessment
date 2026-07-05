# AGA Health Foundation — Research Platform Documentation

**Status:** Implemented (v1.1.0)  
**Last updated:** 2026-07-05  
**Decisions:** [decisions.md](./decisions.md)  
**Audience:** Developers, IT, research leadership

This folder documents the **multi-study research platform** layer. v1.1.0 adds the research prospectus gate; see [CHANGELOG.md](../../CHANGELOG.md) for full release notes.

---

## What we built

A **hospital-facing research platform** with:

- **Hub shell** — landing `/`, system admin (code in `artifacts/telehealth-survey/src/platform/`)
- **Study #1** — `telehealth-readiness` (active) in `artifacts/telehealth-survey/src/studies/telehealth-readiness/`
- **Study #2** — `clinician-telehealth-readiness` (draft in registry; UI + API implemented)
- **System admin** — platform operators; study registry, access control, health checks, **prospectus review**
- **Research prospectus** — public intake at `/research/prospectus`; dual approval before new study activation
- **Study admin** — research-team login at `/studies/{slug}/admin`

Participants primarily use **direct study links**; hub `/` is for staff and optional discovery.

---

## Document index

| Document | Contents |
|----------|----------|
| [decisions.md](./decisions.md) | **Approved decisions** — read first |
| [conceptual-design.md](./conceptual-design.md) | Hub vs study artifacts, routes, API map |
| [compliance.md](./compliance.md) | Ghana DPA requirements |
| [system-admin.md](./system-admin.md) | System admin APIs, UI, env vars, health page |
| [landing-page.md](./landing-page.md) | Hub `/` landing — layout, behaviour |
| [database-schema.md](./database-schema.md) | Per-study tables, registry, migrations |
| [migrations-and-drizzle.md](./migrations-and-drizzle.md) | Drizzle Kit workflow and scripts |
| [hosting-and-neon-migration.md](./hosting-and-neon-migration.md) | Replit now; Neon/Render later |
| [research-prospectus.md](./research-prospectus.md) | Prospectus intake, dual approval, Vercel Blob |

---

## Related docs

| Document | Relationship |
|----------|--------------|
| [../system-architecture.md](../system-architecture.md) | Current technical reference (updated for v1.1.0) |
| [../hub-roadmap.md](../hub-roadmap.md) | Hub vision and phase completion status |
| [../studies/README.md](../studies/README.md) | Per-study documentation index |
| [../pilot/telehealth-readiness.md](../pilot/telehealth-readiness.md) | Ops guide for study #1 |

---

## Implementation status (v1.1.0)

| Phase | Status |
|-------|--------|
| Platform DB schema + migration | Done |
| API — `/api/system/*`, study access, table dispatch | Done |
| Hub landing + system admin UI | Done |
| Study-scoped permissions + registration | Done |
| System health + smoke tests | Done |
| Research prospectus intake + dual approval | Done |
| Physical `artifacts/research-hub` extraction | Deferred (study #2 shipped in monolith) |
| OpenAPI coverage for all system routes | Partial |

---

## Glossary

| Term | Meaning |
|------|---------|
| **Platform** | The whole application (API + web app + database) |
| **System admin** | Operator with cross-study control (study registry, user access) |
| **Study admin / research team** | Named user with roles (`viewer`, `analyst`, `admin`) on one or more studies |
| **Hub** | Platform shell — `/`, system admin (in `telehealth-survey/src/platform/`) |
| **Study slug** | URL identifier (`telehealth-readiness`) |
| **Responses table** | Dedicated PostgreSQL table per study |
