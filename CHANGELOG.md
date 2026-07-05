# Changelog

All notable changes to the AGA Health Foundation Research Platform are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-05

### Added

- **Research prospectus system** — every new study begins with a structured prospectus, dual approval, and provision-before-activation workflow. See `docs/platform/research-prospectus.md`.
- **Prospectus database schema** — `prospectus_submissions`, `prospectus_reviews`, `prospectus_approvals`, `prospectus_attachments`; `studies.prospectus_id` and `studies.prospectus_exempt` for grandfathering.
- **Prospectus migration** — `pnpm db:migrate:prospectus` with root `.env` auto-load (`lib/db/scripts/load-root-env.ts`); idempotent startup via `ensure-prospectus-schema.ts`.
- **Public prospectus API** — create, read, patch, submit, withdraw, and attachment upload (`/api/prospectus/*`) keyed by magic-link `publicId` UUID (no login required).
- **System prospectus API** — review queue, detail, comments, dual approval (`research_leadership` + `platform_ops`), and `provision-study` (`/api/system/prospectus/*`).
- **Prospectus gates** — study activation and survey submission blocked unless linked prospectus is approved or `prospectus_exempt`.
- **Vercel Blob attachments** — PDF/Word uploads (10 MB) via `@vercel/blob`; optional `BLOB_READ_WRITE_TOKEN`.
- **Submitter UI** — multi-step `ProspectusWizard` at `/research/prospectus/*` with section navigation, read-only status view, and tracking-link resume.
- **Co-investigators** — separate name and role fields; role preset dropdown (Co-PI, Statistician, etc.) with custom text for “Other”.
- **Supporting documents UI** — drag-and-drop upload zone with client-side validation and file list.
- **System admin prospectus UI** — review queue and detail pages at `/system/admin/prospectus/*` with dual-approval UX and provision-study action.
- **OpenAPI** — prospectus and system-prospectus endpoints documented in `lib/api-spec/openapi.yaml`.

### Changed

- **Prospectus form save model** — removed debounced autosave; **Next** navigates sections without API calls; **Save draft**, prominent **Save & exit**, and **Save & submit** persist to the server.
- **Hub landing** — link to research prospectus intake from platform home.
- **System admin nav** — prospectus queue entry on dashboard and sidebar.
- **Migration scripts** — platform and prospectus migrations load root `.env` before importing `@workspace/db`.

### Fixed

- **Form refresh on save** — prospectus wizard keeps local state; parent page no longer resets fields when `updatedAt` changes after PATCH.
- **Co-investigator row stability** — client-side row IDs prevent React remounts while typing or adding rows.

### Migration notes

1. Ensure `DATABASE_URL` is set in root `.env`.
2. Run `pnpm db:migrate:prospectus` (or start API — schema applies on boot).
3. Optional: set `BLOB_READ_WRITE_TOKEN` for attachment uploads.
4. Existing studies (`telehealth-readiness`, `clinician-telehealth-readiness`) are grandfathered with `prospectus_exempt = true`.

## [1.0.0] - 2026-07-03

### Added

- **Multi-study research platform** — hub landing at `/`, study registry, per-study response tables, and study-scoped admin access.
- **System administration** — `/system/admin/*` UI and `/api/system/*` routes for study registry, access grants, user overview, and dashboard metrics.
- **System health page** — `/system/admin/health` with built-in API smoke tests runnable from the dashboard.
- **Platform database schema** — `studies`, `system_admins`, `admin_user_study_access`; renamed `surveys` → `telehealth_readiness_surveys`.
- **Idempotent migration** — `pnpm db:migrate:platform` and API startup `ensure-platform-schema`.
- **Study #2 (clinician)** — `clinician-telehealth-readiness` survey UI, API routes, and `clinician_telehealth_readiness_surveys` table (registry status: `draft` until activated).
- **Study-scoped permissions** — `admin_user_study_access` enforced on survey admin APIs; registration accepts `studySlug` for scoped membership.
- **Session kinds** — `sessionKind: "study" | "system"` with legacy session compatibility.
- **Role error messages** — descriptive 403 responses (required role vs current role) instead of generic "Forbidden".
- **Route guards** — `ProtectedStudyAdminRoute` blocks insufficient roles before page load; no pointless retry on permission errors.
- **Dev tooling** — `scripts/restart-api.ps1`, `scripts/smoke-api.ps1`; improved `scripts/dev-local.ps1` port cleanup and health polling.
- **Platform documentation** — `docs/platform/` design pack, updated architecture and hub roadmap.

### Changed

- **Hub shell** lives in `artifacts/telehealth-survey/src/platform/` (physical `artifacts/research-hub` extraction deferred).
- **Study routes** extracted to per-study `study-routes.tsx` bundles composed by `App.tsx`.
- **Admin context** exposes `studyAccess`, `hasStudyAccess`, and `getStudyRole` (study-scoped roles only).
- **Collection windows** read from per-study DB fields with env fallback via `study-collection` helper.
- **OpenAPI / codegen** extended for clinician survey endpoints.

### Fixed

- Legacy study sessions without `sessionKind` treated as study sessions.
- System admin bootstrap falls back to `INITIAL_ADMIN_*` env vars when `SYSTEM_ADMIN_*` unset.
- API dev startup port conflicts when restarting while another instance is listening.
- System health smoke tests run in-process (no PowerShell script dependency on server host).

### Migration notes

1. Set `DATABASE_URL` in `.env`.
2. Run `pnpm db:migrate:platform` (or start API — migration runs on boot).
3. Bootstrap system admin via `SYSTEM_ADMIN_*` or `INITIAL_ADMIN_*` env vars.
4. Grant study access via `/system/admin` if existing users lack `admin_user_study_access` rows.

[1.1.0]: https://github.com/AGAHealthFoundation/Telecare-Readiness-Assessment/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/AGAHealthFoundation/Telecare-Readiness-Assessment/compare/v0.0.0...v1.0.0
