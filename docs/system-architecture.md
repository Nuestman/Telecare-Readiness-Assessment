# AGA Telehealth Readiness Survey — System Documentation

## 1. Overview

This is a full-stack web application built for the **AGA Health Foundation** (Obuasi mine) research team. It collects anonymous survey responses from mine employees and contractors to assess the readiness and willingness to use telehealth/telecare services for non-communicable disease (NCD) management and routine follow-up care. The system also provides an authenticated admin dashboard for the research team to view responses and aggregate statistics.

## 2. Project Structure

The project is a `pnpm` monorepo with shared libraries and two main artifacts:

```
workspace/
├── artifacts/
│   ├── api-server/          # Express API server
│   └── telehealth-survey/   # React + Vite public/admin web app
├── lib/
│   ├── api-spec/            # OpenAPI spec + Orval codegen
│   ├── api-client-react/    # Generated TanStack Query hooks
│   ├── api-zod/             # Generated Zod schemas for API validation
│   └── db/                  # Drizzle ORM + PostgreSQL schema
└── docs/
    └── system-architecture.md  # This document
```

## 3. Technology Stack

- **Monorepo / package manager:** pnpm workspaces
- **Runtime:** Node.js 24
- **Language:** TypeScript 5.9
- **Frontend:** React 19, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter
- **Backend:** Express 5, Zod validation
- **Database:** PostgreSQL + Drizzle ORM + Drizzle Kit
- **API contract:** OpenAPI 3.1 + Orval codegen
- **Auth:** Simple shared admin key (`x-admin-key` header)

## 4. Artifacts & Workflows

| Artifact | Purpose | Workflow |
|---|---|---|
| `artifacts/telehealth-survey` | Public survey + admin dashboard | `pnpm --filter @workspace/telehealth-survey run dev` |
| `artifacts/api-server` | REST API + DB access | `pnpm --filter @workspace/api-server run dev` |
| `artifacts/mockup-sandbox` | Canvas component preview (unused by default) | `pnpm --filter @workspace/mockup-sandbox run dev` |

The web app is served under the base path configured by Vite (`import.meta.env.BASE_URL`), and API calls are routed to `/api`.

## 5. Database Schema

The `surveys` table (`lib/db/src/schema/surveys.ts`) stores every submission with the following logical sections:

1. **Demographics:** `age_group`, `gender`, `employment_type`, `contractor_company`, `work_area`, `years_at_aga`
2. **Health background:** `has_ncd`, `ncd_types`, `other_ncd`, `currently_on_treatment`, `treatment_location`
3. **Follow-up behaviour:** `attends_followup`, `missed_followup_reasons`, `other_missed_reason`
4. **Technology access:** `has_smartphone`, `smartphone_usage`, `has_internet`, `internet_quality`, `comfortable_with_video_call`
5. **Telehealth awareness:** `heard_of_telehealth`, `telehealth_sources`, `used_telehealth_before`
6. **Readiness & willingness:** `willing_to_use_telehealth`, `preferred_telehealth_mode`, `preferred_telehealth_use`, `willing_for_ncd_telecare`, `willing_for_followup_telecare`
7. **Concerns:** `privacy_concern`, `technical_difficulty_concern`, `effectiveness_concern`, `other_concerns`
8. **Open-ended / consent:** `suggestions`, `consent_given`, `submitted_at`

Multi-select answers are stored as comma-separated strings; all free-text fields are nullable.

## 6. API Contract

Defined in `lib/api-spec/openapi.yaml`. Key endpoints:

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/surveys` | Submit a survey response | Public |
| `GET` | `/api/surveys` | List responses with pagination | Admin key |
| `GET` | `/api/surveys/stats` | Aggregate statistics | Admin key |
| `GET` | `/api/surveys/{id}` | Single response detail | Admin key |

The API schema is consumed by two generated libraries:
- `@workspace/api-zod` — Zod schemas used by the Express server to validate `POST /surveys`.
- `@workspace/api-client-react` — TanStack Query hooks used by the React app.

### Code generation

```bash
pnpm --filter @workspace/api-spec run codegen
```

This runs Orval against `openapi.yaml` and regenerates both libraries, then runs a library-wide typecheck.

## 7. Authentication & Authorization

There is no formal user account system. The admin dashboard is protected by a **shared admin key**:

- The server expects the key in the `x-admin-key` header or `admin_key` query parameter.
- Default key: `aga-admin` (override with `ADMIN_KEY` environment variable before production).
- The React app stores the key in `localStorage` after the login modal verifies it against `/api/surveys/stats`.
- `setExtraHeaders({ 'x-admin-key': key })` in the API client attaches the key to every request automatically.

**Security note:** Rotate the default key before deployment. This is a single shared secret suitable for a small research team; it is not a multi-user RBAC system.

## 8. Frontend Routing

Managed by Wouter with the artifact base path:

| Path | Purpose | Auth required |
|---|---|---|
| `/` | Research landing page with study info and admin login | No |
| `/survey` | Multi-step questionnaire | No |
| `/admin` | Admin dashboard | Yes |
| `/admin/survey/:id` | Single response detail | Yes |

Unauthenticated users trying to access `/admin` are redirected to `/`.

## 9. Survey Flow

The questionnaire is a single React component (`SurveyPage.tsx`) with 8 sections plus a consent screen:

1. **Informed consent** — must be accepted before any questions.
2. **Demographics** — age group, gender, employment type (with contractor company name if applicable), department dropdown (with optional manual entry), years at AGA.
3. **Health background** — NCD status, treatment details.
4. **Follow-up behaviour** — attendance patterns and reasons for missed visits.
5. **Technology access** — smartphone/internet access and comfort with video calls (1–5 scale).
6. **Telehealth awareness** — an introductory paragraph explains telehealth, then asks about prior awareness and usage.
7. **Readiness & willingness** — Likert scales and preferred modes.
8. **Concerns** — privacy, technical difficulty, effectiveness (1–5 scales).
9. **Open-ended** — suggestions.

Multi-step navigation validates the current section before allowing the user to proceed. The form schema is defined locally in `zod`; the actual submission payload is mapped to the API schema before calling `useSubmitSurvey`.

## 10. Admin Dashboard

`AdminDashboard.tsx` displays:
- Summary cards: total responses, average willingness score, NCD prevalence, smartphone ownership rate.
- Recent responses table with pagination.
- A sidebar action to copy the public survey link (`/survey`).

`SurveyDetail.tsx` shows the full response for a single submission.

## 11. Deployment & Environment

Key environment variables:

| Variable | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | `lib/db` | PostgreSQL connection string |
| `ADMIN_KEY` | `api-server` | Admin dashboard secret (default `aga-admin`) |
| `PORT` | All workflows | Assigned by Replit per artifact |
| `SESSION_SECRET` | Available secret | Not currently used by this app |

### Schema changes

Apply schema changes to the dev database with:

```bash
pnpm --filter @workspace/db run push
```

Use `push-force` only when you intentionally want to drop and recreate columns.

## 12. Development Commands

```bash
# Install dependencies
pnpm install

# Typecheck all libraries and apps
pnpm run typecheck

# Regenerate API clients from OpenAPI
pnpm --filter @workspace/api-spec run codegen

# Push DB schema
pnpm --filter @workspace/db run push

# Restart workflows after changes
# Use the Workflows tool or Replit UI
```

## 13. Common Customization Points

- **Survey questions / copy:** `artifacts/telehealth-survey/src/pages/SurveyPage.tsx`
- **Landing page copy:** `artifacts/telehealth-survey/src/pages/LandingPage.tsx`
- **Admin key:** `ADMIN_KEY` env variable; default lives in `artifacts/api-server/src/routes/surveys.ts`
- **Database schema:** `lib/db/src/schema/surveys.ts` (regenerate API after changes)
- **API contract:** `lib/api-spec/openapi.yaml` (regenerate clients after changes)
- **Styling / theme:** `artifacts/telehealth-survey/src/index.css` and Tailwind config

## 14. Known Limitations & Decisions

- **Single shared admin key:** Chosen to keep the research team workflow simple. For a larger deployment, replace with a proper auth provider (e.g., Clerk or Replit Auth).
- **No PII collected:** Survey is intentionally anonymous. Admin dashboard only sees aggregate and anonymous responses.
- **Likert values stored as strings:** The 1–5 scales are stored as strings for consistency with other categorical fields; statistics are parsed to integers in the aggregate route.
- **Multi-select stored as CSV:** Simplifies the relational schema and aggregation logic for this single-table design.

## 15. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Admin dashboard shows empty data | `x-admin-key` header missing or wrong | Check login modal, verify key, inspect network tab |
| Survey fails to submit | Validation error in payload | Check server logs for Zod error details |
| Preview blank / 404 | Workflow not running or wrong base path | Restart workflow, ensure Vite uses `PORT` env var |
| DB schema mismatch | Schema changed but not pushed | Run `pnpm --filter @workspace/db run push` |
