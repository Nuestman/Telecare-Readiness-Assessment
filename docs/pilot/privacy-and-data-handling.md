# Privacy and Data Handling — Telehealth Readiness Pilot

**Organization:** AGA Health Foundation  
**Study:** Telehealth Readiness Survey (Obuasi Mine)  
**Status:** Template — review with hospital leadership before publication

## What we collect

Anonymous survey responses including:

- Demographics (age group, gender, employment type, work area)
- Self-reported health and follow-up behaviour
- Technology access and telehealth readiness
- No names, employee IDs, phone numbers, or addresses

## How data is stored

- PostgreSQL database (hosted; connection via `DATABASE_URL`)
- Each row tagged with `study_slug = telehealth-readiness`
- Access restricted to authenticated research staff

## Who can access data

- Named admin accounts with role-based permissions
- Session-based login (no shared passwords in production)
- CSV export limited to `analyst` and `admin` roles

## Retention

Configure in study config (`artifacts/telehealth-survey/src/studies/telehealth-readiness/config.ts`). Default statement: retained for the research study period and reported in aggregate.

## Participant rights

- Participation is voluntary
- No penalty for non-participation
- Responses are anonymous; withdrawal = close the browser before submitting

## Security measures

- HTTPS in production (Replit deployment)
- Rate limiting on survey submission
- Honeypot spam field
- Optional survey open/close dates
- CORS restricted in production when `CORS_ORIGINS` is set

## Contact

Update contact details in study config before go-live.
