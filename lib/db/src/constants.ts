export const TELEHEALTH_STUDY_SLUG = "telehealth-readiness" as const;
export const CLINICIAN_TELEHEALTH_STUDY_SLUG = "clinician-telehealth-readiness" as const;

export const TELEHEALTH_RESPONSES_TABLE = "telehealth_readiness_surveys" as const;
export const CLINICIAN_TELEHEALTH_RESPONSES_TABLE =
  "clinician_telehealth_readiness_surveys" as const;

export type StudyStatus = "draft" | "active" | "paused" | "closed" | "archived";
export type AdminRole = "viewer" | "analyst" | "admin";
export type AdminStatus = "pending" | "approved" | "rejected";
export type SessionKind = "study" | "system";
