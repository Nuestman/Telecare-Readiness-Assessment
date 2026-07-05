import { z } from "zod";
import type { ProspectusApprovalRole } from "@workspace/db";

export const PROSPECTUS_APPROVAL_ROLES = [
  "research_leadership",
  "platform_ops",
] as const satisfies readonly ProspectusApprovalRole[];

const methodologySchema = z.object({
  approach: z.enum(["quantitative", "qualitative", "mixed_methods"]),
  design: z.string(),
  population: z.string(),
  sampling: z.string(),
  instruments: z.string(),
  analysis: z.string(),
});

const timelinePhaseSchema = z.object({
  phase: z.string(),
  start: z.string(),
  end: z.string(),
});

export const CreateProspectusBody = z.object({
  submitterEmail: z.string().email(),
  submitterName: z.string().min(1),
  title: z.string().optional(),
  principalInvestigator: z.string().optional(),
});

const coInvestigatorSchema = z.object({
  name: z.string(),
  role: z.string(),
});

export const PatchProspectusBody = z.object({
  submitterEmail: z.string().email().optional(),
  submitterName: z.string().min(1).optional(),
  title: z.string().optional(),
  principalInvestigator: z.string().optional(),
  coInvestigators: z.array(coInvestigatorSchema).optional(),
  organization: z.string().optional(),
  department: z.string().nullable().optional(),
  background: z.string().optional(),
  researchProblem: z.string().optional(),
  researchQuestions: z.array(z.string()).optional(),
  aims: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  literatureOverview: z.string().optional(),
  theoreticalFramework: z.string().nullable().optional(),
  methodology: methodologySchema.optional(),
  significance: z.string().optional(),
  ethicsNotes: z.string().optional(),
  identifiableData: z.boolean().optional(),
  ethicsReference: z.string().nullable().optional(),
  dataRetention: z.string().nullable().optional(),
  timeline: z.array(timelinePhaseSchema).optional(),
  referencesText: z.string().optional(),
  proposedSlug: z
    .union([
      z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(64),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  studyType: z.enum(["survey", "mixed_methods", "other"]).optional(),
  studyTemplate: z
    .enum(["telehealth-readiness-clone", "clinician-clone", "custom"])
    .optional(),
  parentProspectusId: z.number().int().positive().nullable().optional(),
  isAmendment: z.boolean().optional(),
});

export const ProspectusReviewBody = z.object({
  decision: z.enum(["comment", "revision_requested"]),
  comments: z.string().min(1),
  isInternal: z.boolean().optional(),
});

export const ProspectusApprovalBody = z.object({
  approvalRole: z.enum(["research_leadership", "platform_ops"]),
  decision: z.enum(["approved", "rejected"]),
  comments: z.string().optional(),
});

export const ProvisionStudyBody = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(64)
    .optional(),
  responsesTable: z.string().min(1).optional(),
  shortTitle: z.string().min(1).optional(),
});

export const UploadAttachmentBody = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  /** Base64-encoded file bytes (scaffold — swap to multipart in UI) */
  contentBase64: z.string().min(1),
});

export type PublicProspectusApproval = {
  role: ProspectusApprovalRole;
  decision: "approved" | "rejected" | null;
  comments: string | null;
  decidedAt: string | null;
};

export const PROSPECTUS_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const PROSPECTUS_ATTACHMENT_MIME_ALLOWLIST = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
