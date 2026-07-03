# Platform — Hosting & Neon Database Migration

**Status:** Design (pre-implementation)  
**Last updated:** 2026-07-02

---

## 1. Purpose

Plan for moving from **Replit-hosted** (current — **stay here for platform v1**) to **self-managed hosting** (Render, Railway, etc.) with a **standalone Neon PostgreSQL** project.

---

## 2. Current state (typical Replit setup)

| Component | Today |
|-----------|-------|
| App host | **Replit** (platform v1 — no move required for hub launch) |
| Database | PostgreSQL via Replit Secrets — often Neon under the hood |
| Connection URL | `DATABASE_URL` in Replit Secrets |
| Dev URL quirk | Some Replit dev URLs use host `helium` — **only resolves inside Replit** |
| Schema apply | Manual `drizzle-kit push` per environment |
| Frontend | Vite build served by Replit or static deploy |

---

## 3. Target state

```mermaid
flowchart TB
  subgraph hosting [Hosting — Render / Railway / etc.]
    Web[Static frontend OR combined Node service]
    API[Express API server]
  end

  subgraph neon [Neon — your account]
    Main[main branch — production]
    Dev[dev branch — optional]
    Staging[staging branch — optional]
  end

  Users[Users] --> Web
  Web --> API
  API --> Main
  Dev -.->|local .env| API
```

| Component | Target |
|-----------|--------|
| Database | Neon project in **your** Neon account (not Replit-bundled) |
| App | Render Web Service, Railway, or similar |
| DNS | Custom domain e.g. `research.agahealthfoundation.org` |
| Secrets | Host env vars — not Replit Secrets |
| Migrations | `pnpm db:migrate` on deploy ([migrations doc](./migrations-and-drizzle.md)) |

---

## 4. Neon project setup

### 4.1 Create project

1. Sign in at [https://neon.tech](https://neon.tech)
2. Create project: `aga-research-platform` (or similar)
3. Region: choose closest to Ghana users (e.g. `aws-eu-west-1` or US East if EU unavailable)
4. Enable connection pooling (Neon pooler) for serverless/scaling hosts

### 4.2 Branches

| Branch | Purpose | Connection |
|--------|---------|------------|
| `main` | Production | `DATABASE_URL` on Render/Railway production |
| `dev` | Local development | Local `.env` |
| `staging` | Pre-prod testing (optional) | Staging service env |

Neon **database branches** are copy-on-write — ideal for testing migrations before production.

### 4.3 Connection strings

Use the **pooled** connection string for the API server:

```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

Use **direct** (non-pooler) for one-off `drizzle-kit migrate` if pooler causes issues with migrations.

Store in password manager — never commit to git.

---

## 5. Migration checklist: Replit → Neon + new host

### Phase A — Prepare (no downtime)

| # | Task | Notes |
|---|------|-------|
| A1 | Create Neon project + `dev` branch | Test connectivity from laptop |
| A2 | Adopt versioned migrations | [migrations-and-drizzle.md](./migrations-and-drizzle.md) |
| A3 | Run `pnpm db:migrate` on Neon `dev` | Verify all tables |
| A4 | Copy production data (if needed) | `pg_dump` from Replit DB → restore to Neon `main` |
| A5 | Document all env vars | See §7 |
| A6 | Build production bundle locally | `pnpm run build` |

### Phase B — Parallel run (optional)

| # | Task | Notes |
|---|------|-------|
| B1 | Deploy API + frontend to Render/Railway pointing at Neon **staging** branch | Test full flow |
| B2 | Smoke test: survey submit, study login, system admin | |
| B3 | Load test collection window, session cookies on new domain | |

### Phase C — Cutover

| # | Task | Notes |
|---|------|-------|
| C1 | Schedule maintenance window (low traffic) | |
| C2 | Final `pg_dump` from Replit DB if still source of truth | |
| C3 | Restore to Neon `main` OR run last migrate + data sync | |
| C4 | Deploy production with `DATABASE_URL` = Neon `main` | |
| C5 | Run `pnpm db:migrate` on production | |
| C6 | Set `SYSTEM_ADMIN_BOOTSTRAP_ENABLED=false` after verify | |
| C7 | Update DNS / custom domain | |
| C8 | Update QR codes / printed materials if URL changed | |
| C9 | Keep Replit read-only for 1–2 weeks as rollback | |

### Phase D — Decommission Replit

| # | Task |
|---|------|
| D1 | Export final backup |
| D2 | Revoke Replit `DATABASE_URL` / delete Replit DB if disposable |
| D3 | Archive Replit project |

---

## 6. Host-specific notes

### Render

| Setting | Value |
|---------|-------|
| Service type | Web Service (Node) for API; Static Site for frontend **or** single service serving both |
| Build | `pnpm install && pnpm run build` |
| Start | `node artifacts/api-server/dist/index.js` (adjust to actual build output) |
| Pre-deploy | `pnpm db:migrate` |
| Env | `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`, `CORS_ORIGINS`, `SYSTEM_ADMIN_*` |

Use Render **secret files** or dashboard env vars for secrets.

### Railway

| Setting | Value |
|---------|-------|
| Deploy | Connect GitHub repo; Railway detects Node |
| Add PostgreSQL | **Skip** — use external Neon instead |
| Variables | Same as Render |
| Custom domain | Railway settings → Networking |

### Replit (remain but use external Neon)

You can keep Replit as host but point `DATABASE_URL` at Neon public URL — fixes `helium` local dev issue and unifies DB across environments.

---

## 7. Environment variables (complete list)

### Required — all environments

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Neon pooled connection string |
| `SESSION_SECRET` | 32+ random bytes |
| `NODE_ENV` | `production` |
| `PORT` | `8080` (or host default) |
| `CORS_ORIGINS` | `https://research.agahealthfoundation.org` |

### Required — first production deploy only

| Variable | Notes |
|----------|-------|
| `SYSTEM_ADMIN_EMAIL` | Bootstrap system admin |
| `SYSTEM_ADMIN_PASSWORD` | Strong password; rotate after login |
| `SYSTEM_ADMIN_BOOTSTRAP_ENABLED` | `true` first deploy, then `false` |

### Optional

| Variable | Notes |
|----------|-------|
| `SURVEY_OPENS_AT` / `SURVEY_CLOSES_AT` | Legacy fallback until DB windows used |
| `SURVEY_MIN_SECONDS` | Anti-bot timing |
| `TELEHEALTH_BASE_PATH` | `/` unless subpath deploy |

### Frontend build-time

| Variable | Notes |
|----------|-------|
| `VITE_*` | Only if needed; API via relative `/api` proxy or absolute API URL |

---

## 8. Data migration commands

### Export from source (Replit shell or any PG)

```bash
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --file=aga-research-backup.dump
```

Tables to verify in dump: `surveys`, `admin_users`, `session`, `studies`, `system_admins`, `admin_user_study_access`.

### Restore to Neon

```bash
pg_restore \
  --dbname="$NEON_DATABASE_URL" \
  --no-owner \
  --clean \
  --if-exists \
  aga-research-backup.dump
```

Run `pnpm db:migrate` after restore if target schema is ahead of dump.

### Mark migrations applied after restore

If restored DB already has full schema, baseline drizzle journal per [migrations-and-drizzle.md](./migrations-and-drizzle.md) §8.

---

## 9. Session & cookie considerations

| Concern | Action |
|---------|--------|
| New domain | Users must re-login (sessions not portable) |
| `SESSION_SECRET` | Generate new secret for new host; do not reuse if compromised |
| `secure` cookie flag | Auto in `NODE_ENV=production` |
| `sameSite` | Keep `lax` unless cross-site embed needed |

Communicate to research team: bookmark new URLs before cutover.

---

## 10. URL migration map

| Old (Replit) | New (custom domain) |
|--------------|---------------------|
| `https://xxx.replit.app/` | `https://research.agahealthfoundation.org/` |
| `.../studies/telehealth-readiness/survey` | Same path on new domain |
| `.../studies/telehealth-readiness/admin/login` | Unchanged |
| `.../system/admin/login` | New — platform admin |

Keep Replit redirects (if plan allows) for 90 days:

- Replit static page meta-refresh or reverse proxy to new domain

---

## 11. Cost estimate (rough)

| Service | Tier |
|---------|------|
| Neon | Free tier sufficient for pilot; Pro when scaling |
| Render | Free/static low traffic; $7+/mo for always-on API |
| Railway | Usage-based; similar to Render |
| Custom domain | Registrar cost only |

---

## 12. Rollback plan

If cutover fails:

1. Point DNS back to Replit
2. Replit still has last backup if not decommissioned
3. Neon `main` branch: restore from Neon PITR or pre-cutover branch snapshot

Test rollback on `staging` branch before production cutover.

---

## 13. Security before go-live

- [ ] `SYSTEM_ADMIN_BOOTSTRAP_ENABLED=false` after bootstrap
- [ ] Strong `SESSION_SECRET` in host secrets only
- [ ] Neon IP allowlist or strong password only (Neon uses SSL)
- [ ] `CORS_ORIGINS` restricted to production domain
- [ ] No `.env` in git
- [ ] Enable Neon backup / PITR on paid plan if available

---

## 14. Post-migration validation

- [ ] `GET /api/healthz` returns OK
- [ ] `GET /api/studies` lists telehealth study
- [ ] Platform landing `/` renders
- [ ] Survey submission works
- [ ] Study admin login + dashboard
- [ ] System admin login + study access grant
- [ ] Session persists across page navigation
- [ ] `pnpm db:migrate` idempotent on redeploy

---

## 15. Change log

| Date | Change |
|------|--------|
| 2026-07-02 | Initial hosting migration plan |
