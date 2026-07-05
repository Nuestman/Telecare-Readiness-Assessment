import type {
  ProspectusApproval,
  ProspectusApprovalRole,
  ProspectusStatus,
  ProspectusSubmission,
  Study,
} from "@workspace/db";
import {
  PROSPECTUS_APPROVAL_ROLES,
  type PublicProspectusApproval,
} from "./prospectus-schemas";

export function toPublicProspectus(
  row: ProspectusSubmission,
  extras?: {
    approvals?: ProspectusApproval[];
    attachmentCount?: number;
  },
): Record<string, unknown> {
  const approvals: PublicProspectusApproval[] = PROSPECTUS_APPROVAL_ROLES.map((role) => {
    const record = extras?.approvals?.find((a) => a.approval_role === role);
    return {
      role,
      decision: record?.decision ?? null,
      comments: record?.comments ?? null,
      decidedAt: record?.created_at.toISOString() ?? null,
    };
  });

  return {
    id: row.id,
    publicId: row.public_id,
    status: row.status,
    submitterEmail: row.submitter_email,
    submitterName: row.submitter_name,
    title: row.title,
    principalInvestigator: row.principal_investigator,
    coInvestigators: row.co_investigators,
    organization: row.organization,
    department: row.department,
    background: row.background,
    researchProblem: row.research_problem,
    researchQuestions: row.research_questions,
    aims: row.aims,
    objectives: row.objectives,
    literatureOverview: row.literature_overview,
    theoreticalFramework: row.theoretical_framework,
    methodology: row.methodology,
    significance: row.significance,
    ethicsNotes: row.ethics_notes,
    identifiableData: row.identifiable_data,
    ethicsReference: row.ethics_reference,
    dataRetention: row.data_retention,
    timeline: row.timeline,
    referencesText: row.references_text,
    proposedSlug: row.proposed_slug,
    studyType: row.study_type,
    studyTemplate: row.study_template,
    parentProspectusId: row.parent_prospectus_id,
    isAmendment: row.is_amendment,
    linkedStudySlug: row.linked_study_slug,
    submittedAt: row.submitted_at?.toISOString() ?? null,
    approvedAt: row.approved_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    approvals,
    attachmentCount: extras?.attachmentCount ?? 0,
  };
}

export function isProspectusEditable(status: ProspectusStatus): boolean {
  return status === "draft" || status === "revision_requested";
}

export function computeProspectusStatusAfterApproval(
  approvals: Pick<ProspectusApproval, "approval_role" | "decision">[],
): ProspectusStatus {
  if (approvals.some((a) => a.decision === "rejected")) {
    return "rejected";
  }

  const approvedRoles = new Set(
    approvals.filter((a) => a.decision === "approved").map((a) => a.approval_role),
  );

  const allApproved = PROSPECTUS_APPROVAL_ROLES.every((role) => approvedRoles.has(role));
  if (allApproved) {
    return "approved";
  }

  return "under_review";
}

export function studyMayActivate(study: Study, prospectusStatus: ProspectusStatus | null): {
  ok: boolean;
  reason?: string;
} {
  if (study.prospectus_exempt) {
    return { ok: true };
  }

  if (!study.prospectus_id) {
    return {
      ok: false,
      reason: "Study requires an approved prospectus before activation.",
    };
  }

  if (prospectusStatus !== "approved") {
    return {
      ok: false,
      reason: "Linked prospectus is not fully approved (dual approval required).",
    };
  }

  return { ok: true };
}

export function slugFromProposed(proposed: string | null | undefined, fallbackId: number): string {
  if (proposed?.trim()) {
    return proposed.trim().toLowerCase();
  }
  return `study-${fallbackId}`;
}

export function responsesTableFromSlug(slug: string): string {
  return `${slug.replace(/-/g, "_")}_surveys`;
}

export type { ProspectusApprovalRole };
