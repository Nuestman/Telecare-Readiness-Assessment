import type {
  ProspectusApprovalRole,
  ProspectusStudyType,
  StudyTemplate,
} from "./constants";

/** Field help text for the public prospectus submission form. */
export const prospectusFormTemplate = {
  version: "1.0.0",
  sections: [
    {
      id: "identity",
      title: "Principal investigator",
      fields: ["submitterName", "submitterEmail", "principalInvestigator", "coInvestigators", "department"],
    },
    {
      id: "title",
      title: "Working title",
      fields: ["title", "studyType", "studyTemplate", "proposedSlug"],
    },
    {
      id: "background",
      title: "Introduction and background",
      fields: ["background"],
    },
    {
      id: "problem",
      title: "Research problem and questions",
      fields: ["researchProblem", "researchQuestions", "aims", "objectives"],
    },
    {
      id: "literature",
      title: "Literature overview",
      fields: ["literatureOverview", "theoreticalFramework"],
    },
    {
      id: "methodology",
      title: "Proposed methodology",
      fields: ["methodology"],
    },
    {
      id: "significance",
      title: "Significance of the study",
      fields: ["significance"],
    },
    {
      id: "ethics",
      title: "Ethics and data handling",
      fields: ["ethicsNotes", "identifiableData", "ethicsReference", "dataRetention"],
    },
    {
      id: "timeline",
      title: "Timeline and work plan",
      fields: ["timeline"],
    },
    {
      id: "references",
      title: "Preliminary references",
      fields: ["referencesText"],
    },
    {
      id: "attachments",
      title: "Supporting documents",
      fields: ["attachments"],
      help: "Upload protocol drafts or consent forms (PDF, max 10 MB each).",
    },
  ],
  fieldHelp: {
    title: "Concise working title reflecting topic, population, and approach.",
    researchProblem: "Specific, focused, and researchable — not a broad topic area.",
    proposedSlug: "Suggested URL slug (lowercase, hyphens). Reviewer may edit at approval.",
    studyTemplate: {
      "telehealth-readiness-clone": "Reuse community telehealth readiness survey structure.",
      "clinician-clone": "Reuse clinician telehealth readiness survey structure.",
      custom: "New instrument — requires developer build after approval.",
    } satisfies Record<StudyTemplate, string>,
    studyType: {
      survey: "Primarily survey-based data collection.",
      mixed_methods: "Combines surveys with interviews or other methods.",
      other: "Observational, secondary data, or non-survey design.",
    } satisfies Record<ProspectusStudyType, string>,
    identifiableData:
      "If yes, compliance review is required before dual approval can complete.",
  },
  dualApproval: {
    roles: ["research_leadership", "platform_ops"] as ProspectusApprovalRole[],
    description:
      "Both research leadership and platform operations must approve before a study is provisioned.",
  },
  amendmentPolicy:
    "Approved prospectuses cannot be edited. Submit an amendment prospectus linked to the original.",
} as const;

export type ProspectusFormTemplate = typeof prospectusFormTemplate;
