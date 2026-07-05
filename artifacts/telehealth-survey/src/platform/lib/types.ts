export type ProspectusStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export type ProspectusApprovalRole = 'research_leadership' | 'platform_ops';

export type StudyTemplate = 'telehealth-readiness-clone' | 'clinician-clone' | 'custom';

export type ProspectusStudyType = 'survey' | 'mixed_methods' | 'other';

export type MethodologyApproach = 'quantitative' | 'qualitative' | 'mixed_methods';

export type ProspectusMethodology = {
  approach: MethodologyApproach;
  design: string;
  population: string;
  sampling: string;
  instruments: string;
  analysis: string;
};

export type ProspectusTimelinePhase = {
  phase: string;
  start: string;
  end: string;
};

export type ProspectusApprovalSlot = {
  role: ProspectusApprovalRole;
  decision: 'approved' | 'rejected' | null;
  comments: string | null;
  decidedAt: string | null;
};

export type ProspectusAttachment = {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  downloadUrl?: string;
};

export type CoInvestigator = {
  name: string;
  role: string;
};

/** Standard co-investigator roles for the prospectus form dropdown */
export const CO_INVESTIGATOR_ROLES = [
  'Co-PI',
  'Statistician',
  'Methodologist',
  'Data analyst',
  'Research coordinator',
  'Clinical lead',
  'Community partner',
  'Student investigator',
  'Supervisor / mentor',
  'Other',
] as const;

export type CoInvestigatorRole = (typeof CO_INVESTIGATOR_ROLES)[number];

/** Client-only stable key for list rows in the form UI */
export type CoInvestigatorFormRow = CoInvestigator & { clientId: string };

export type ProspectusPublic = {
  id: number;
  publicId: string;
  status: ProspectusStatus;
  submitterEmail: string;
  submitterName: string;
  title: string;
  principalInvestigator: string;
  coInvestigators: CoInvestigator[];
  organization: string;
  department: string | null;
  background: string;
  researchProblem: string;
  researchQuestions: string[];
  aims: string;
  objectives: string[];
  literatureOverview: string;
  theoreticalFramework: string | null;
  methodology: ProspectusMethodology;
  significance: string;
  ethicsNotes: string;
  identifiableData: boolean;
  ethicsReference: string | null;
  dataRetention: string | null;
  timeline: ProspectusTimelinePhase[];
  referencesText: string;
  proposedSlug: string | null;
  studyType: ProspectusStudyType;
  studyTemplate: StudyTemplate;
  parentProspectusId: number | null;
  isAmendment: boolean;
  linkedStudySlug: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  approvals: ProspectusApprovalSlot[];
  attachmentCount: number;
  attachments?: ProspectusAttachment[];
};

export type ProspectusFormValues = {
  principalInvestigator: string;
  coInvestigators: CoInvestigatorFormRow[];
  department: string;
  title: string;
  studyType: ProspectusStudyType;
  studyTemplate: StudyTemplate;
  proposedSlug: string;
  background: string;
  researchProblem: string;
  researchQuestions: string[];
  aims: string;
  objectives: string[];
  literatureOverview: string;
  theoreticalFramework: string;
  methodology: ProspectusMethodology;
  significance: string;
  ethicsNotes: string;
  identifiableData: boolean;
  ethicsReference: string;
  dataRetention: string;
  timeline: ProspectusTimelinePhase[];
  referencesText: string;
};

export type ProspectusReview = {
  id: number;
  decision: 'comment' | 'revision_requested';
  comments: string | null;
  isInternal: boolean;
  createdAt: string;
};

export type ProspectusListItem = {
  id: number;
  publicId: string;
  status: ProspectusStatus;
  title: string;
  submitterName: string;
  submitterEmail: string;
  principalInvestigator: string;
  proposedSlug: string | null;
  linkedStudySlug: string | null;
  submittedAt: string | null;
  updatedAt: string;
};

export type ProspectusDetailResponse = {
  prospectus: ProspectusPublic;
  reviews: ProspectusReview[];
};

export function isProspectusEditable(status: ProspectusStatus): boolean {
  return status === 'draft' || status === 'revision_requested';
}

export const PROSPECTUS_SECTIONS = [
  'Principal investigator',
  'Working title',
  'Background',
  'Research problem',
  'Literature',
  'Methodology',
  'Significance',
  'Ethics & data',
  'Timeline',
  'References',
  'Attachments & submit',
] as const;
