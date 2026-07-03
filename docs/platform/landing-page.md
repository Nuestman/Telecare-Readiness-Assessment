# Platform — System Landing Page (`/`)

**Status:** Design (pre-implementation)  
**Last updated:** 2026-07-02  
**Artifact:** `artifacts/research-hub`  
**Decisions:** [decisions.md](./decisions.md)

---

## 1. Purpose

The root URL `/` is the **hub landing** served by `artifacts/research-hub`. It is **not** the primary entry for participants — recruitment uses **direct study URLs** (`/studies/{slug}/survey`).

**Audiences:**

| Visitor | Goal on `/` |
|---------|-------------|
| Research coordinator / leadership | See active studies; jump to study-team login |
| Participant (optional) | Discover studies if they land here without a direct link |
| Platform operator | Footer link to system admin |

---

## 2. URL behaviour change

| Before (today) | After (platform) |
|----------------|------------------|
| `/` → 302 `/studies/telehealth-readiness` | `/` → platform landing (no redirect) |
| Single study implied | Multiple studies listed |
| `/studies/telehealth-readiness` remains study landing | Unchanged |

Legacy paths `/survey`, `/admin/*` still redirect to telehealth study equivalents.

---

## 3. Page structure (wireframe)

```
┌─────────────────────────────────────────────────────────────────┐
│  [AGA Health Foundation logo]     Research Platform             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Hospital Research Studies                                     │
│   Participate in approved research at Obuasi Mine.               │
│                                                                 │
│   ┌──────────────────────┐  ┌──────────────────────┐           │
│   │ Telehealth Readiness │  │  (future study card) │           │
│   │ Survey               │  │                      │           │
│   │ ● Accepting responses│  │                      │           │
│   │ ~5–8 minutes         │  │                      │           │
│   │                      │  │                      │           │
│   │ [Learn more] [Survey]│  │                      │           │
│   │ Research team login →│  │                      │           │
│   └──────────────────────┘  └──────────────────────┘           │
│                                                                 │
│   No studies available?                                         │
│   Check back later or contact research@agahealthfoundation.org  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Privacy · Contact · Platform administration (muted link)       │
│  © AGA Health Foundation                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Content sections

### 4.1 Hero

| Element | Copy (default) |
|---------|----------------|
| Headline | **Hospital Research Studies** |
| Subhead | Participate in approved research conducted by the AGA Health Foundation at Obuasi Mine. |
| Supporting line | Surveys are anonymous unless a study page states otherwise. |

No participant login — surveys remain anonymous one-shot flows.

### 4.2 Study cards

Data source: `GET /api/studies` (public).

Each card shows:

| Field | Source |
|-------|--------|
| Short title | `studies.short_title` |
| Status badge | Derived from `status` + `collectionOpen` |
| Estimated time | `studies.estimated_minutes` |
| Organization | `studies.organization` (optional subtitle) |

**Status badges:**

| Condition | Badge | Survey button |
|-----------|-------|---------------|
| `active` + collection open | ● Accepting responses (green) | Enabled → `/studies/{slug}/survey` |
| `active` + collection closed | ○ Collection closed (amber) | Disabled |
| `paused` | ⏸ Temporarily unavailable (gray) | Disabled — badge only, no survey CTA |
| `closed` | Not listed on public API | — |

**Actions per card:**

| Button / link | Target |
|---------------|--------|
| Learn more | `/studies/{slug}` |
| Take survey | `/studies/{slug}/survey` |
| Research team login | `/studies/{slug}/admin/login` (text link, not button) |

### 4.3 Empty state

When API returns zero studies:

> **No studies are open right now**  
> New research studies will appear here when they are active. For questions, contact [contact email from platform config].

### 4.4 Footer

| Link | Target |
|------|--------|
| Privacy & data handling | `/privacy` or static doc link (existing pilot doc) |
| Contact | `mailto:research@agahealthfoundation.org` |
| Platform administration | `/system/admin/login` — small, muted text |

---

## 5. Visual design

- Reuse existing design system: Tailwind, shadcn/ui, AGA palette from `index.css`
- **Platform pages** use neutral hospital branding (foundation name, not study-specific imagery)
- **Study landing** pages keep study-specific hero and copy (`LandingPage.tsx` pattern)
- Responsive: cards stack on mobile (1 column), 2–3 columns on desktop
- Accessibility: card actions are keyboard-focusable; status not colour-only (icon + text)

### Component plan

| Component | Location |
|-----------|----------|
| `PlatformLandingPage` | `artifacts/research-hub/src/pages/PlatformLandingPage.tsx` |
| `StudyCard` | `artifacts/research-hub/src/components/StudyCard.tsx` |
| `PlatformHeader` | `artifacts/research-hub/src/components/PlatformHeader.tsx` |
| `PlatformFooter` | `artifacts/research-hub/src/components/PlatformFooter.tsx` |

---

## 6. Data loading

```tsx
// Pseudocode
const { data, isLoading, error } = useListPublicStudies(); // GET /api/studies

if (isLoading) return <PlatformSkeleton />;
if (error) return <PlatformError retry />;
if (!data.studies.length) return <PlatformEmpty />;
return <StudyCardGrid studies={data.studies} />;
```

- Cache: TanStack Query `staleTime: 60_000` (1 min) — study list changes infrequently
- No auth required
- Refetch on window focus optional

---

## 7. SEO & metadata

```html
<title>AGA Health Foundation — Research Studies</title>
<meta name="description" content="Participate in hospital research studies at Obuasi Mine." />
```

Study pages keep their own titles: `{shortTitle} | AGA Health Foundation`.

---

## 8. Participant vs staff flows

| Flow | Path |
|------|------|
| **Participant (primary)** | QR / link → `/studies/{slug}/survey` or study landing → survey |
| **Staff discovery** | `/` → study card → study landing or admin login |

Printed materials and QR codes should **not** point at `/` — use study-specific URLs.

---

## 9. Configuration

Platform-level copy (not per-study) in:

```ts
// artifacts/research-hub/src/config.ts
export const platformConfig = {
  organization: "AGA Health Foundation",
  location: "Obuasi Mine, Ghana",
  defaultContactEmail: "research@agahealthfoundation.org",
  privacyDocPath: "/docs/privacy", // or external URL
} as const;
```

Study-specific copy remains in `studies/{slug}/config.ts` and syncs to DB via seed/admin UI.

---

## 10. Testing checklist (when implemented)

- [ ] `/` renders without auth
- [ ] Only `active` / `paused` studies appear
- [ ] Survey button disabled when `collectionOpen: false`
- [ ] Links resolve with `BASE_PATH` prefix (Replit subpath deploys)
- [ ] Empty state when no studies
- [ ] Mobile layout — cards stack, buttons tappable
- [ ] `/` no longer redirects to telehealth study

---

## 11. Change log

| Date | Change |
|------|--------|
| 2026-07-02 | Initial landing page design |
| 2026-07-02 | Hub artifact; direct study links as primary participant entry |
