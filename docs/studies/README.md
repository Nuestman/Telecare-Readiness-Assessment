# Study documentation

Per-study design and operations documents.

| Study | Slug | Registry status | Documents |
|-------|------|-----------------|-----------|
| Community telehealth readiness | `telehealth-readiness` | **active** | [Ops guide](../pilot/telehealth-readiness.md) |
| Clinician telehealth readiness | `clinician-telehealth-readiness` | **draft** | [Questionnaire](./clinician-telehealth-readiness/questionnaire.md) · [Technical plan](./clinician-telehealth-readiness/technical-plan.md) |

## Implementation notes

- **Study #1** is the live pilot at `/studies/telehealth-readiness`.
- **Study #2** has a full survey UI and API but is `draft` in the registry — it does not appear on the public hub until activated via system admin.
- Activate study #2: `/system/admin/studies/clinician-telehealth-readiness` → set status to `active`.

## Build gate

Study #2 was built alongside the platform. Hospital sign-off for study #1 remains recommended before promoting study #2 to `active`.
