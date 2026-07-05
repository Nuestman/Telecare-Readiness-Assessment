# Clinician Telehealth Readiness — Questionnaire Specification

**Study slug:** `clinician-telehealth-readiness`  
**Status:** Design (pre-implementation)  
**Last updated:** 2026-07-02  
**Programme:** AGA Telehealth Readiness Programme (community arm + clinician arm)  
**Prerequisite:** Sign-off of study #1 (`telehealth-readiness`) before build

---

## 1. Study purpose

Assess **readiness and willingness among clinical staff** at AGA Health Foundation to deliver telehealth/telecare services — complementing the community survey (`telehealth-readiness`) which measures patient-side readiness among mine employees and contractors.

**Primary research questions**

1. What proportion of clinicians are aware of and have used telehealth/telecare?
2. How confident are they in using common telecare modalities (video, messaging, remote monitoring)?
3. What workflow, facility, and policy barriers limit adoption in an Obuasi hospital setting?
4. For which clinical scenarios are they willing to offer virtual care (NCD follow-up, routine review, triage)?
5. What training and support would increase willingness?

**Estimated completion time:** 10–15 minutes  
**Language:** English (Twi translation deferred to a later phase)

---

## 2. Target population & sampling

| Criterion | Detail |
|-----------|--------|
| **Who** | Clinical staff at AGA Health Foundation (doctors, nurses/midwives, allied health) |
| **Setting** | Outpatient, NCD clinic, emergency/urgent care, community health outreach (self-reported department) |
| **Recruitment** | Facility-based link/QR distributed by unit heads; optional email/WhatsApp to staff groups |
| **Exclusions** | Non-clinical admin staff (separate optional study if needed); students on short rotation (PI discretion) |

**Sample size:** [Target n — e.g. 80% of clinical FTE or minimum 60 responses] — complete before ethics submission.

---

## 3. Ethics & data handling (differs from community survey)

| Aspect | Community survey (`telehealth-readiness`) | Clinician survey (this study) |
|--------|-------------------------------------------|-------------------------------|
| Identifiers | None collected | **No names**; role + department collected (semi-identifiable) |
| Consent | Anonymous voluntary participation | Voluntary; staff may skip any non-required item |
| Storage | Aggregate + row-level for authorized staff | Same; restrict export to PI/analyst roles |
| Ethics | [Existing reference] | **Separate ethics amendment or sub-study** required |

**Consent statement (display on Section 0):**

> This survey asks about your experience and views on telehealth/telecare at AGA Health Foundation. Your responses are confidential. We do not ask for your name. Department and job role are collected only to analyse differences between staff groups. Participation is voluntary and will not affect your employment. You may skip questions or withdraw at any time before submitting.

---

## 4. Instrument structure overview

| Step | Section | Questions | Est. time |
|------|---------|-----------|-----------|
| 0 | Informed consent | 1 | 1 min |
| 1 | Professional profile | 5–6 | 2 min |
| 2 | Awareness & prior use | 4–5 | 2 min |
| 3 | Self-efficacy | 5 | 2 min |
| 4 | Workflow fit | 4–5 | 2 min |
| 5 | Facility enablers | 5 | 2 min |
| 6 | Barriers & concerns | 6 | 2 min |
| 7 | Training needs | 3 | 1 min |
| 8 | Willingness to deliver telecare | 5–6 | 2 min |
| 9 | Open feedback | 1 | 1 min |

**Total:** ~30 core items (+ role/department branches).  
**Navigation:** Multi-step form with section validation (same UX pattern as study #1).

---

## 5. Role-aware branching

**Q1.1** (`clinical_role`) drives conditional items:

| Value | Label | Branch behaviour |
|-------|-------|------------------|
| `medical_officer` | Medical officer / doctor | Show prescribing / clinical decision items in Section 8 |
| `nurse_midwife` | Nurse or midwife | Show patient education / monitoring items in Section 8 |
| `allied_health` | Allied health (pharmacy, lab, physio, etc.) | Hide doctor-only items; show referral/support items |
| `other_clinical` | Other clinical role | Free-text `clinical_role_other`; conservative branching (shared items only) |

**Rule:** Branching is **show/hide only** — no change to required core scales across roles.

---

## 6. Questionnaire — full item specification

Field names below are **proposed API/DB column names** (snake_case).  
**Type key:** `single` | `multi` | `likert_1_5` | `text` | `boolean`

---

### Section 0 — Informed consent

| ID | Field | Type | Question | Required | Options / notes |
|----|-------|------|----------|----------|-----------------|
| 0.1 | `consent_given` | boolean | I have read the information above and agree to participate voluntarily. | Yes | Must be `true` to proceed |

---

### Section 1 — Professional profile

| ID | Field | Type | Question | Required | Options |
|----|-------|------|----------|----------|---------|
| 1.1 | `clinical_role` | single | What is your primary clinical role at AGA Health Foundation? | Yes | `medical_officer`, `nurse_midwife`, `allied_health`, `other_clinical` |
| 1.1a | `clinical_role_other` | text | Please specify your clinical role | If 1.1 = `other_clinical` | Max 100 chars |
| 1.2 | `department` | single | Which department or unit do you mainly work in? | Yes | `opd`, `ncd_clinic`, `emergency`, `inpatient`, `maternity`, `pharmacy`, `laboratory`, `community_health`, `other` |
| 1.2a | `department_other` | text | Please specify department | If 1.2 = `other` | Max 100 chars |
| 1.3 | `years_in_clinical_practice` | single | How many years have you worked in clinical practice (any setting)? | Yes | `less_than_2`, `2_to_5`, `6_to_10`, `more_than_10` |
| 1.4 | `years_at_aga_health` | single | How long have you worked at AGA Health Foundation? | Yes | `less_than_1`, `1_to_3`, `4_to_7`, `more_than_7` |
| 1.5 | `telehealth_exposure_in_role` | single | In your current role, how often do you interact with patients who could use telehealth for follow-up or monitoring? | Yes | `never`, `rarely`, `sometimes`, `often`, `very_often` |

---

### Section 2 — Awareness & prior use

**Intro copy (display once):**

> *Telehealth* means delivering healthcare at a distance using phone, video, or digital messaging. *Telecare* includes remote monitoring and follow-up for ongoing conditions such as hypertension and diabetes.

| ID | Field | Type | Question | Required | Options |
|----|-------|------|----------|----------|---------|
| 2.1 | `heard_of_telehealth` | single | Before today, had you heard of telehealth or telecare? | Yes | `yes`, `no`, `not_sure` |
| 2.2 | `awareness_sources` | multi | Where did you learn about telehealth? (Select all that apply) | If 2.1 = `yes` | `workplace_training`, `colleague`, `conference`, `media`, `patient_request`, `covid_period`, `professional_education`, `other` |
| 2.2a | `awareness_sources_other` | text | Other source | If `other` selected | Optional |
| 2.3 | `used_telehealth_before` | single | Have you personally used telehealth to care for patients (video, phone, or messaging)? | Yes | `never`, `during_covid_only`, `occasionally`, `regularly` |
| 2.4 | `used_modalities` | multi | Which modalities have you used? | If 2.3 ≠ `never` | `phone_voice`, `video_call`, `sms_whatsapp`, `patient_portal`, `remote_monitoring`, `other` |
| 2.5 | `national_policy_awareness` | single | Are you aware of any national guidance on telemedicine or digital health in Ghana (e.g. Ministry of Health, NHIA)? | Yes | `yes`, `no`, `not_sure` |

---

### Section 3 — Self-efficacy

**Instruction:** *For each statement, rate your confidence from 1 (not at all confident) to 5 (very confident).*

| ID | Field | Type | Statement | Required |
|----|-------|------|-----------|----------|
| 3.1 | `confidence_video_consultation` | likert_1_5 | Conducting a video consultation with a stable patient | Yes |
| 3.2 | `confidence_phone_followup` | likert_1_5 | Following up with a patient by phone for chronic disease care | Yes |
| 3.3 | `confidence_async_messaging` | likert_1_5 | Using secure messaging for non-urgent clinical questions | Yes |
| 3.4 | `confidence_remote_vitals` | likert_1_5 | Interpreting patient-reported vitals or home readings (e.g. BP, glucose) | Yes |
| 3.5 | `confidence_digital_documentation` | likert_1_5 | Documenting a telehealth encounter in the patient record | Yes |

---

### Section 4 — Workflow fit

| ID | Field | Type | Question | Required | Options |
|----|-------|------|----------|----------|---------|
| 4.1 | `time_for_telehealth` | likert_1_5 | I have enough time in my schedule to offer telehealth alongside in-person care | Yes | 1 = strongly disagree … 5 = strongly agree |
| 4.2 | `documentation_burden_concern` | likert_1_5 | Telehealth would increase my documentation burden unacceptably | Yes | 1 = strongly disagree … 5 = strongly agree |
| 4.3 | `workflow_integration` | single | How well would telehealth fit into your current clinical workflow? | Yes | `not_at_all`, `poorly`, `moderately`, `well`, `very_well` |
| 4.4 | `referral_pathway_clarity` | likert_1_5 | Referral and escalation pathways for telehealth patients would be clear to me | Yes | 1–5 agree scale |
| 4.5 | `team_coordination` | single | Telehealth at AGA would require effective coordination with other departments (lab, pharmacy, etc.) | Yes | `strongly_disagree` … `strongly_agree` (5-point) |

**Doctor-only (show if `clinical_role` = `medical_officer`):**

| ID | Field | Type | Question | Required |
|----|-------|------|----------|----------|
| 4.6 | `comfort_clinical_decisions_remotely` | likert_1_5 | Making clinical decisions remotely without an in-person examination when appropriate | Yes |

**Nurse/midwife-only (show if `clinical_role` = `nurse_midwife`):**

| ID | Field | Type | Question | Required |
|----|-------|------|----------|----------|
| 4.7 | `comfort_patient_education_remotely` | likert_1_5 | Providing patient education and self-management support remotely | Yes |

---

### Section 5 — Facility enablers

| ID | Field | Type | Question | Required | Options |
|----|-------|------|----------|----------|---------|
| 5.1 | `internet_at_workplace` | single | Internet reliability at your main workplace | Yes | `none`, `poor`, `fair`, `good`, `excellent` |
| 5.2 | `power_reliability` | single | Power (electricity) reliability during your clinical shifts | Yes | `frequent_outages`, `occasional_outages`, `mostly_stable`, `very_stable` |
| 5.3 | `device_availability` | single | Access to a suitable device for telehealth (smartphone, tablet, or computer) during work | Yes | `never`, `sometimes`, `usually`, `always` |
| 5.4 | `private_space_for_calls` | single | Availability of a private space for confidential video or phone consultations | Yes | `never`, `sometimes`, `usually`, `always` |
| 5.5 | `facility_support` | likert_1_5 | AGA Health Foundation would provide adequate technical support for telehealth | Yes | 1–5 agree scale |

---

### Section 6 — Barriers & concerns

**Instruction:** *Rate how much each factor would limit your use of telehealth (1 = not a barrier, 5 = major barrier).*

| ID | Field | Type | Concern | Required |
|----|-------|------|---------|----------|
| 6.1 | `barrier_liability` | likert_1_5 | Medico-legal liability or malpractice concerns | Yes |
| 6.2 | `barrier_privacy` | likert_1_5 | Patient privacy and confidentiality | Yes |
| 6.3 | `barrier_patient_digital_literacy` | likert_1_5 | Patients' low digital literacy or access | Yes |
| 6.4 | `barrier_language` | likert_1_5 | Language or communication barriers with patients | Yes |
| 6.5 | `barrier_technical_failure` | likert_1_5 | Technology failure during a consultation | Yes |
| 6.6 | `barrier_effectiveness` | likert_1_5 | Doubt that telehealth is as effective as in-person care | Yes |

**Optional multi-select:**

| ID | Field | Type | Question | Required | Options |
|----|-------|------|----------|----------|---------|
| 6.7 | `other_barriers` | multi | Any other barriers? (Select all that apply) | No | `cost_to_patient`, `nhia_reimbursement`, `lack_of_guidelines`, `workload`, `none`, `other` |
| 6.7a | `other_barriers_text` | text | Please describe other barriers | If `other` selected | Optional |

---

### Section 7 — Training needs

| ID | Field | Type | Question | Required | Options |
|----|-------|------|----------|----------|---------|
| 7.1 | `received_telehealth_training` | single | Have you received formal training on telehealth at AGA or elsewhere? | Yes | `yes_aga`, `yes_elsewhere`, `no` |
| 7.2 | `training_needs` | multi | What training would help you use telehealth confidently? (Select all that apply) | Yes | `basic_digital_skills`, `video_consultation_skills`, `platform_specific`, `clinical_protocols`, `documentation`, `privacy_security`, `patient_selection`, `none_needed`, `other` |
| 7.3 | `training_format_preference` | single | Preferred training format | Yes | `in_person_workshop`, `online_self_paced`, `mentorship`, `simulation`, `written_guidelines` |

---

### Section 8 — Willingness to deliver telecare

**Instruction:** *These items mirror the community survey outcomes so results can be compared across arms.*

| ID | Field | Type | Question | Required | Options |
|----|-------|------|----------|----------|---------|
| 8.1 | `willing_to_provide_telehealth` | likert_1_5 | Overall willingness to provide telehealth services at AGA | Yes | 1 = not willing … 5 = very willing |
| 8.2 | `willing_ncd_telecare` | single | Willing to provide telecare for NCD follow-up (e.g. hypertension, diabetes) | Yes | `yes`, `maybe`, `no` |
| 8.3 | `willing_routine_review` | single | Willing to provide routine review consultations remotely when clinically appropriate | Yes | `yes`, `maybe`, `no` |
| 8.4 | `willing_triage` | single | Willing to conduct initial triage or assessment remotely before in-person visit | Yes | `yes`, `maybe`, `no` |
| 8.5 | `preferred_modalities` | multi | Which modalities would you prefer to use? (Select all that apply) | Yes | `phone`, `video`, `secure_messaging`, `home_monitoring`, `none` |

**Doctor-only:**

| ID | Field | Type | Question | Required | Options |
|----|-------|------|----------|----------|---------|
| 8.6 | `willing_prescribe_after_remote` | single | Willing to prescribe or adjust treatment after a remote consultation when guidelines allow | Yes | `yes`, `maybe`, `no` |

**Nurse/midwife-only:**

| ID | Field | Type | Question | Required | Options |
|----|-------|------|----------|----------|---------|
| 8.7 | `willing_remote_monitoring` | single | Willing to review and act on remotely submitted patient readings (BP, glucose, etc.) | Yes | `yes`, `maybe`, `no` |

---

### Section 9 — Open feedback

| ID | Field | Type | Question | Required |
|----|-------|------|----------|----------|
| 9.1 | `suggestions` | text | What would make telehealth work well for you and your patients at AGA? | No | Max 1000 chars |

---

## 7. Derived scores (for analysis & dashboard)

| Score | Calculation | Use |
|-------|-------------|-----|
| **Self-efficacy index** | Mean of 3.1–3.5 (1–5) | Compare roles/departments |
| **Barrier index** | Mean of 6.1–6.6 (higher = more barrier) | Priority training/policy targets |
| **Facility readiness index** | Composite of 5.1–5.5 (normalize to 1–5) | Infrastructure investment case |
| **Overall willingness** | 8.1 | Primary outcome; compare to community `willing_to_use_telehealth` |
| **NCD telecare alignment** | % `yes` on 8.2 vs community `willing_for_ncd_telecare` | Joint programme readiness gap |

---

## 8. Skip logic summary

| Condition | Action |
|-----------|--------|
| 2.1 = `no` or `not_sure` | Hide 2.2, 2.2a; still require 2.3 |
| 2.3 = `never` | Hide 2.4 |
| 1.1 = `medical_officer` | Show 4.6, 8.6 |
| 1.1 = `nurse_midwife` | Show 4.7, 8.7 |
| 1.1 = `allied_health` or `other_clinical` | Hide 4.6, 4.7, 8.6, 8.7 |
| 1.2 = `other` | Require 1.2a |
| 1.1 = `other_clinical` | Require 1.1a |

---

## 9. Pilot testing checklist (before go-live)

- [ ] Cognitive interview with 2 doctors, 2 nurses, 1 allied health staff
- [ ] Time-on-task test (target ≤ 15 min median)
- [ ] Ethics approval or amendment filed
- [ ] Department heads briefed on recruitment approach
- [ ] Consent copy reviewed by PI
- [ ] Twi glossary for key terms (telehealth, telecare) — optional handout even if survey stays English

---

## 10. Related documents

| Document | Purpose |
|----------|---------|
| [technical-plan.md](./technical-plan.md) | Implementation blueprint for study #2 |
| [../../pilot/study-summary-for-hospital.md](../../pilot/study-summary-for-hospital.md) | Template for hospital one-pager (adapt for clinician arm) |
| [../../hub-roadmap.md](../../hub-roadmap.md) | Multi-study platform vision |
| Community questionnaire | `artifacts/telehealth-survey/src/studies/telehealth-readiness/pages/SurveyPage.tsx` |

---

## 11. Change log

| Date | Change |
|------|--------|
| 2026-07-02 | Initial questionnaire specification |
