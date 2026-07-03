# Platform — Compliance & Data Protection

**Status:** Design (pre-implementation)  
**Last updated:** 2026-07-02

---

## 1. Requirement

**Ghana Data Protection Act, 2012 (Act 843)** compliance review is **required** before the research platform scales beyond the single-study pilot.

This applies at **hub/platform scale** — multiple studies, named admin users, cross-study access control, and hospital-wide visibility.

---

## 2. Scope of review

| Area | Consideration |
|------|---------------|
| **Lawful basis** | Research/ethics approval per study; informed consent on survey flows |
| **Data minimization** | Anonymous participant surveys; no unnecessary PII in response tables |
| **Purpose limitation** | Per-study tables and access scoping support separation |
| **Storage & retention** | Per-study `data_retention` in registry; documented deletion/archive |
| **Access control** | Named study-team users; audit trail (phase 2) |
| **Cross-border transfer** | Hosting (Replit/Neon regions); document where data resides |
| **Data subject rights** | Anonymous surveys limit identifiability; process for any identifiable admin data |
| **Security** | Sessions, HTTPS, secrets management, breach response plan |
| **Registration** | Whether Data Protection Commission registration applies at hospital/platform level |

---

## 3. Technical measures (aligned with design)

- **Per-study response tables** — isolation and study-specific retention policies
- **Study-scoped admin access** — `admin_user_study_access`; fail closed
- **Separate system admin** — platform operators distinct from research staff
- **Export controls** — analyst role + future `audit_events` for CSV exports
- **Privacy documentation** — per-study and platform-level ([../pilot/privacy-and-data-handling.md](../pilot/privacy-and-data-handling.md))

---

## 4. Actions before wider rollout

| # | Action | Owner |
|---|--------|-------|
| 1 | Engage hospital legal / compliance or external counsel familiar with Act 843 | Research leadership |
| 2 | Data Protection Impact Assessment (DPIA) or equivalent for platform | IT + research |
| 3 | Update privacy notices on study landings and platform `/` | Research + dev |
| 4 | Document subprocessors (Replit, Neon, future host) | IT |
| 5 | Retention and deletion procedure per study table | Research |
| 6 | Review after study #2 (`clinician-telehealth-readiness`) — clinician data may differ from employee survey | Research |

---

## 5. Out of scope for v1 implementation

- Automated consent management platform
- Data subject self-service portal
- DPO appointment documentation (hospital responsibility)

---

## 6. Change log

| Date | Change |
|------|--------|
| 2026-07-02 | Initial compliance requirements documented |
