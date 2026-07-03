# Platform — Conceptual Design

**Status:** Implemented (v1.0.0)  
**Last updated:** 2026-07-03  
**Decisions:** [decisions.md](./decisions.md)

---

## 1. Purpose

Define how the **AGA Health Foundation Research Platform** organizes multiple studies under one hospital-facing application, with clear separation between:

1. **Public / participant** flows — discover and complete surveys
2. **Study-team admin** flows — view responses, export, manage study users (existing pattern)
3. **System admin** flows — register studies, set collection windows, grant study access to research-team accounts

---

## 2. High-level architecture

```mermaid
flowchart TB
  subgraph public [Public]
    Landing["/ — Platform landing"]
    StudyLanding["/studies/{slug} — Study landing"]
    Survey["/studies/{slug}/survey"]
  end

  subgraph studyAdmin [Study team admin]
    StudyLogin["/studies/{slug}/admin/login"]
    StudyDash["/studies/{slug}/admin/*"]
  end

  subgraph systemAdmin [System admin]
    SysLogin["/system/admin/login"]
    SysDash["/system/admin/*"]
  end

  subgraph api [API server]
    PublicAPI["/api/studies/{slug}/..."]
    StudyAuthAPI["/api/auth/* — study team"]
    SystemAPI["/api/system/*"]
  end

  subgraph db [(PostgreSQL)]
    Studies[(studies)]
    SysAdmins[(system_admins)]
    AdminUsers[(admin_users)]
    Access[(admin_user_study_access)]
    THTable[(telehealth_readiness_surveys)]
    ClinTable[(clinician_telehealth_readiness_surveys)]
  end

  Landing --> StudyLanding
  StudyLanding --> Survey
  StudyLanding --> StudyLogin
  StudyLogin --> StudyDash
  Landing --> SysLogin
  SysLogin --> SysDash

  Survey --> PublicAPI
  StudyDash --> StudyAuthAPI
  StudyDash --> PublicAPI
  SysDash --> SystemAPI

  SystemAPI --> Studies
  SystemAPI --> SysAdmins
  SystemAPI --> AdminUsers
  SystemAPI --> Access
  PublicAPI --> THTable
  PublicAPI --> ClinTable
  StudyAuthAPI --> AdminUsers
  StudyAuthAPI --> Access
```

---

## 3. Access tiers

| Tier | Who | Entry URL | Session type | Scope |
|------|-----|-----------|--------------|-------|
| **Participant** | Mine employees, contractors, clinicians | **Direct study URL** — `/studies/{slug}/survey` (or study landing first) | None | One study at a time |
| **Study team** | PI, analysts, coordinators | `/studies/{slug}/admin/login` | Study-team session (`admin_users`) | Studies they are granted |
| **System admin** | IT, platform operator, research leadership | `/system/admin/login` | System session (`system_admins`) | All studies + registry |

### Important rules

- **Study-team login stays at the study path.** Coordinators bookmark `/studies/telehealth-readiness/admin/login`; that does not move to a global URL.
- **System admin is separate.** Different table, different login route, different session fields. A person can be both (two accounts or linked later — out of scope for v1).
- **Study-team users are global accounts with per-study permissions.** One email can access study A as `analyst` and study B as `viewer` via `admin_user_study_access`.
- **Participants use direct study links** for recruitment (QR codes, SMS, posters → `/studies/{slug}/survey`). The hub `/` is secondary — for staff and optional discovery ([decisions.md](./decisions.md) P1).

---

## 4. Route map

### 4.1 Public & participant routes

| Path | Page | Auth | Notes |
|------|------|------|-------|
| `/` | **Hub landing** | No | Study directory for staff/discovery — **not** primary participant entry |
| `/studies` | Redirect → `/` | No | Optional alias |
| `/studies/{slug}` | Study landing | No | Per-study intro, ethics, CTA (existing `LandingPage` pattern) |
| `/studies/{slug}/survey` | Survey | No | Existing multi-step form |

### 4.2 Study-team admin routes (unchanged URLs)

| Path | Page | Auth | Min role |
|------|------|------|----------|
| `/studies/{slug}/admin/login` | Study login | No | — |
| `/studies/{slug}/registration` | Self-registration | No | Open with approval workflow |
| `/studies/{slug}/admin` | Dashboard | Study session + study access | `viewer` |
| `/studies/{slug}/admin/report` | Pilot report | Study session + study access | `viewer` |
| `/studies/{slug}/admin/users` | User management | Study session + study access | `admin` (study role) |
| `/studies/{slug}/admin/responses/:id` | Response detail | Study session + study access | `viewer` |

### 4.3 System admin routes (new)

| Path | Page | Auth |
|------|------|------|
| `/system/admin/login` | System admin login | No |
| `/system/admin` | Dashboard — study list, stats summary | System session |
| `/system/admin/studies` | Study registry CRUD | System session |
| `/system/admin/studies/:slug` | Edit study metadata, collection window | System session |
| `/system/admin/studies/:slug/access` | Grant/revoke study-team access | System session |
| `/system/admin/users` | List all study-team accounts (read-only overview) | System session |
| `/system/admin/settings` | Platform settings (future) | System session |

### 4.4 Legacy redirects (keep working)

| Legacy path | Redirect to |
|-------------|-------------|
| `/survey` | `/studies/telehealth-readiness/survey` |
| `/admin`, `/admin/login`, etc. | Corresponding `/studies/telehealth-readiness/admin/...` |

**Change:** `/` no longer redirects to telehealth study landing; it becomes the platform landing. Old QR codes that pointed at `/survey` still work.

---

## 5. API namespaces

| Namespace | Purpose | Auth |
|-----------|---------|------|
| `/api/healthz` | Health check | Public |
| `/api/studies/{slug}/status` | Collection window | Public |
| `/api/studies/{slug}/surveys` | Submit + admin read (routes to study-specific table) | Public POST; study session + access for GET |
| `/api/auth/*` | Study-team register, login, logout, me, user CRUD | Study session |
| `/api/system/auth/*` | System admin login, logout, me | System session |
| `/api/system/studies` | Study registry CRUD | System session |
| `/api/system/studies/{slug}/access` | Manage study-team memberships | System session |
| `/api/system/studies/{slug}/status` | Override collection window (DB-backed) | System session |

Legacy `/api/surveys*` mounts remain as deprecated aliases until all clients use namespaced paths.

---

## 6. Monorepo structure: hub vs study artifacts

The **hub is not `telehealth-survey`**. The pilot artifact becomes study #1; a new hub artifact owns platform routes.

```
workspace/
├── artifacts/
│   ├── research-hub/              # Platform shell — landing /, system admin
│   ├── telehealth-survey/         # Study #1 — slug: telehealth-readiness
│   ├── clinician-telehealth-survey/  # Study #2 (planned) — slug: clinician-telehealth-readiness
│   └── api-server/                # Shared API — dispatches by study slug
├── lib/
│   ├── db/src/schema/
│   │   ├── studies.ts             # Registry
│   │   ├── telehealth-readiness-surveys.ts   # Was: surveys.ts
│   │   └── clinician-telehealth-readiness-surveys.ts  # Future
│   └── study-runtime/             # Optional shared routing helpers (extract at study #2)
```

### Slug ↔ artifact ↔ table mapping

| Study slug | Artifact | Responses table |
|------------|----------|-----------------|
| `telehealth-readiness` | `artifacts/telehealth-survey` | `telehealth_readiness_surveys` |
| `clinician-telehealth-readiness` | `artifacts/clinician-telehealth-survey` | `clinician_telehealth_readiness_surveys` |

The `studies` registry row stores `responses_table` (or derives it by convention: slug → snake_case + `_surveys`).

### Registry (database — `studies` table)

Source of truth for:

- Which studies exist and are visible on `/`
- `status`: `draft` | `active` | `paused` | `closed` | `archived`
- `responses_table` — dedicated PostgreSQL table for that study's submissions
- Collection window (`opens_at`, `closes_at`)
- Display metadata: title, organization, PI, ethics ref, contact

### Study module (per artifact)

Each study artifact contains:

- `src/config.ts` — default metadata (seeded into `studies` on deploy)
- `src/paths.ts` — route helpers under `/studies/{slug}/...`
- `src/pages/` — landing, survey, admin pages
- Study-specific components and survey schema

**Rule:** DB registry drives **visibility and windows**; the study artifact must be deployed for **survey UI and admin dashboards**. A study can be `draft` in DB before the artifact ships; it must not appear on public APIs until `active`.

### Hub module (`research-hub`)

- `src/pages/PlatformLandingPage.tsx` — `/`
- `src/pages/system-admin/*` — `/system/admin/*`
- `src/components/StudyCard.tsx`, `SystemAdminLayout.tsx`
- `src/App.tsx` — mounts hub routes + **imports route bundles** from study artifacts

Study routes remain at `/studies/{slug}/...` — the hub router composes study modules; URLs do not move into artifact-named paths like `/telehealth-survey/`.

### Adding a new study (IT + developer)

**v1 — IT/developer only** ([decisions.md](./decisions.md) O1):

1. Developer creates artifact, Drizzle schema for dedicated responses table, API handlers, hub route registration
2. IT/system admin inserts or seeds `studies` row (or runs migration)
3. System admin sets `status: active`, collection window, and grants study-team access
4. Study appears on hub landing (if `active` or `paused`)

**Later:** system admin UI to edit metadata/status; study-creation wizard still requires developer for new artifact + table.

Study #2 (`clinician-telehealth-readiness`) validates whether to extract `@workspace/study-runtime` shared library.

---

## 7. Linking studies on the hub landing

The `/` page loads **`GET /api/studies`** (public) — returns `active` and `paused` studies only (`draft` is system-admin-only; `closed`/`archived` excluded):

```json
{
  "studies": [
    {
      "slug": "telehealth-readiness",
      "shortTitle": "Telehealth Readiness Survey",
      "status": "active",
      "collectionOpen": true,
      "href": "/studies/telehealth-readiness",
      "surveyHref": "/studies/telehealth-readiness/survey"
    },
    {
      "slug": "clinician-telehealth-readiness",
      "shortTitle": "Clinician Telehealth Readiness",
      "status": "paused",
      "collectionOpen": false,
      "href": "/studies/clinician-telehealth-readiness",
      "surveyHref": "/studies/clinician-telehealth-readiness/survey"
    }
  ]
}
```

**Participant recruitment** should use `surveyHref` directly on materials — not `/`.

Each study card links to:

- **Learn more** → `/studies/{slug}` (study landing)
- **Take survey** → `/studies/{slug}/survey` (disabled when collection closed or `paused`)
- **Research team** → `/studies/{slug}/admin/login` (small link in card footer)

`paused` studies show **Temporarily unavailable** badge — listed but no survey CTA ([decisions.md](./decisions.md) B2).

System admin link in page footer: **Platform administration** → `/system/admin/login` (low prominence).

---

## 8. Collection window precedence

| Source | Precedence |
|--------|------------|
| `studies.opens_at` / `studies.closes_at` in DB | Primary (per study) |
| `SURVEY_OPENS_AT` / `SURVEY_CLOSES_AT` env | Fallback for `telehealth-readiness` only during migration |
| Omitted / null | Always open |

After migration, env vars become optional overrides documented in [system-admin.md](./system-admin.md).

---

## 9. Auth session model (two parallel sessions)

Use **one cookie name** (`connect.sid`) but **disjoint session payloads**:

| Session field | Study team | System admin |
|---------------|------------|--------------|
| `sessionKind` | `"study"` | `"system"` |
| `userId` | `admin_users.id` | `system_admins.id` |
| `email`, `name` | ✓ | ✓ |
| `role` | Study role on **current** study context | `"system_admin"` (fixed) |

Middleware:

- `requireStudyAuth` — `sessionKind === "study"` and approved status
- `requireSystemAuth` — `sessionKind === "system"`
- `requireStudyAccess(slug)` — membership row exists for user + slug

Logging into study admin while holding a system session (or vice versa) **replaces** the session — one principal at a time per browser.

---

## 10. Frontend structure (planned)

### Hub — `artifacts/research-hub/`

```
artifacts/research-hub/src/
├── pages/
│   ├── PlatformLandingPage.tsx      # /
│   └── system-admin/
│       ├── SystemLoginPage.tsx
│       ├── SystemDashboardPage.tsx
│       ├── StudiesListPage.tsx
│       ├── StudyEditPage.tsx
│       └── StudyAccessPage.tsx
├── components/
│   ├── StudyCard.tsx
│   ├── PlatformHeader.tsx
│   ├── PlatformFooter.tsx
│   └── SystemAdminLayout.tsx
├── paths.ts                         # platformPaths, systemAdminPaths
├── context/
│   └── SystemAdminContext.tsx
└── App.tsx                          # Hub routes + import study route bundles
```

### Study #1 — `artifacts/telehealth-survey/` (slug: `telehealth-readiness`)

Today this artifact contains both study UI and legacy root redirects. **Refactor target:**

```
artifacts/telehealth-survey/src/
├── config.ts
├── paths.ts
├── pages/                           # Landing, Survey, Admin*
├── components/
└── routes.tsx                       # Export <StudyRoutes slug="telehealth-readiness" /> for hub
```

Study URLs stay `/studies/telehealth-readiness/...` — the artifact name is for repo organization only.

### Study #2 — `artifacts/clinician-telehealth-survey/` (planned)

Same layout as telehealth-survey; slug `clinician-telehealth-readiness`; own survey questions and admin views; own DB table.

### Migration from current layout

| Today | Target |
|-------|--------|
| `telehealth-survey` serves `/` redirect + all study routes | `research-hub` serves `/` + system admin |
| Study pages inside `telehealth-survey` | Stay in `telehealth-survey`; export route bundle to hub |
| Single `App.tsx` in telehealth-survey | Hub `App.tsx` composes hub + study routes |

---

## 11. Security principles

1. **Fail closed** — missing study access → 403, not empty data
2. **System admin bootstrap from env** — first system admin created on startup if table empty (see [system-admin.md](./system-admin.md))
3. **Study registration** — open with approval; study `admin` can invite users **to their study only** via registration URL scoped to slug (auto-grant membership). System admin can grant any study.
4. **Audit log** — deferred to phase 2; schema reserves `audit_events` table name in [database-schema.md](./database-schema.md)
5. **No participant PII** — unchanged from pilot privacy model
6. **Ghana DPA** — compliance review required at platform scale ([compliance.md](./compliance.md))

---

## 12. Out of scope (platform v1)

- Cross-study analytics dashboard
- Study creation wizard for non-technical staff (IT creates studies via code + migrations)
- Hospital SSO / LDAP
- Separate mobile app
- Automated email notifications
- Multi-tenant (non-AGA hospitals)
- Moving off Replit (deferred — [hosting-and-neon-migration.md](./hosting-and-neon-migration.md))

---

## 13. Resolved decisions

All open questions are decided — see [decisions.md](./decisions.md).

| Topic | Decision |
|-------|----------|
| Response storage | **One DB table per study** |
| Participant entry | **Direct study URLs**; hub `/` is secondary |
| New study creation | **IT/developer only**; UI wizard later |
| Ghana DPA | **Compliance review required** |
| Hosting | **Replit now**; migrate later |
| Study admin invite | **Yes** — scoped to their study |
| `paused` on public list | **Yes** — “Temporarily unavailable” badge |
| `draft` visibility | **System admin only** |
| Hub vs study artifact | **`research-hub` + per-study artifacts** |

---

## 14. Change log

| Date | Change |
|------|--------|
| 2026-07-02 | Initial conceptual design |
| 2026-07-02 | Hub/study artifact split; per-study tables; decisions resolved |
