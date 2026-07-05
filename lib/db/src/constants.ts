export const TELEHEALTH_STUDY_SLUG = "telehealth-readiness" as const;
export const CLINICIAN_TELEHEALTH_STUDY_SLUG = "clinician-telehealth-readiness" as const;

export const TELEHEALTH_RESPONSES_TABLE = "telehealth_readiness_surveys" as const;
export const CLINICIAN_TELEHEALTH_RESPONSES_TABLE =
  "clinician_telehealth_readiness_surveys" as const;

export type StudyStatus = "draft" | "active" | "paused" | "closed" | "archived";
export type AdminRole = "viewer" | "analyst" | "admin";
export type AdminStatus = "pending" | "approved" | "rejected";
export type SessionKind = "study" | "system";

/** Prospectus workflow status */
export type ProspectusStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "approved"
  | "rejected"
  | "withdrawn";

/** Review comment / non-binding feedback */
export type ProspectusReviewDecision = "comment" | "revision_requested";

/** Dual approval roles — both must approve before study provisioning */
export type ProspectusApprovalRole = "research_leadership" | "platform_ops";

export type ProspectusApprovalDecision = "approved" | "rejected";

/** IT triage: reuse existing study artifact or build custom */
export type StudyTemplate =
  | "telehealth-readiness-clone"
  | "clinician-clone"
  | "custom";

export type ProspectusStudyType = "survey" | "mixed_methods" | "other";
