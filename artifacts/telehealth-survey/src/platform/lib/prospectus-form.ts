import type {
  CoInvestigator,
  CoInvestigatorFormRow,
  CoInvestigatorRole,
  ProspectusFormValues,
  ProspectusPublic,
} from '@/platform/lib/types';
import { CO_INVESTIGATOR_ROLES } from '@/platform/lib/types';

export const defaultMethodology = (): ProspectusFormValues['methodology'] => ({
  approach: 'quantitative',
  design: '',
  population: '',
  sampling: '',
  instruments: '',
  analysis: '',
});

const emptyCoInvestigator = (): CoInvestigator => ({ name: '', role: '' });

export function newCoInvestigatorFormRow(over?: Partial<CoInvestigator>): CoInvestigatorFormRow {
  return { name: '', role: '', clientId: crypto.randomUUID(), ...over };
}

/** Accept legacy string[] or { name, role }[] from API. */
export function normalizeCoInvestigators(raw: unknown): CoInvestigator[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [emptyCoInvestigator()];
  }

  return raw.map((item) => {
    if (typeof item === 'string') {
      return { name: item, role: '' };
    }
    if (typeof item === 'object' && item !== null) {
      const row = item as { name?: unknown; role?: unknown };
      return {
        name: typeof row.name === 'string' ? row.name : '',
        role: typeof row.role === 'string' ? row.role : '',
      };
    }
    return emptyCoInvestigator();
  });
}

export function coInvestigatorsToFormRows(raw: unknown): CoInvestigatorFormRow[] {
  const rows = normalizeCoInvestigators(raw);
  if (rows.length === 0) {
    return [newCoInvestigatorFormRow()];
  }
  return rows.map((c) => newCoInvestigatorFormRow(c));
}

/** Dropdown options for role, including legacy custom values not in the preset list. */
export function coInvestigatorRoleOptions(currentRole: string): string[] {
  const trimmed = currentRole.trim();
  if (trimmed && !(CO_INVESTIGATOR_ROLES as readonly string[]).includes(trimmed)) {
    return [...CO_INVESTIGATOR_ROLES, trimmed];
  }
  return [...CO_INVESTIGATOR_ROLES];
}

export function isPresetCoInvestigatorRole(role: string): role is CoInvestigatorRole {
  return (CO_INVESTIGATOR_ROLES as readonly string[]).includes(role);
}

export const defaultProspectusFormValues = (): ProspectusFormValues => ({
  principalInvestigator: '',
  coInvestigators: [newCoInvestigatorFormRow()],
  department: '',
  title: '',
  studyType: 'survey',
  studyTemplate: 'custom',
  proposedSlug: '',
  background: '',
  researchProblem: '',
  researchQuestions: [''],
  aims: '',
  objectives: [''],
  literatureOverview: '',
  theoreticalFramework: '',
  methodology: defaultMethodology(),
  significance: '',
  ethicsNotes: '',
  identifiableData: false,
  ethicsReference: '',
  dataRetention: '',
  timeline: [{ phase: '', start: '', end: '' }],
  referencesText: '',
});

export function prospectusToFormValues(data: ProspectusPublic): ProspectusFormValues {
  return {
    principalInvestigator: data.principalInvestigator,
    coInvestigators: coInvestigatorsToFormRows(data.coInvestigators),
    department: data.department ?? '',
    title: data.title,
    studyType: data.studyType,
    studyTemplate: data.studyTemplate,
    proposedSlug: data.proposedSlug ?? '',
    background: data.background,
    researchProblem: data.researchProblem,
    researchQuestions: data.researchQuestions.length > 0 ? data.researchQuestions : [''],
    aims: data.aims,
    objectives: data.objectives.length > 0 ? data.objectives : [''],
    literatureOverview: data.literatureOverview,
    theoreticalFramework: data.theoreticalFramework ?? '',
    methodology: data.methodology ?? defaultMethodology(),
    significance: data.significance,
    ethicsNotes: data.ethicsNotes,
    identifiableData: data.identifiableData,
    ethicsReference: data.ethicsReference ?? '',
    dataRetention: data.dataRetention ?? '',
    timeline: data.timeline.length > 0 ? data.timeline : [{ phase: '', start: '', end: '' }],
    referencesText: data.referencesText,
  };
}

export function formValuesToPatch(values: ProspectusFormValues): Record<string, unknown> {
  const trimList = (items: string[]) => items.map((s) => s.trim()).filter(Boolean);

  const coInvestigators = values.coInvestigators
    .map((c) => ({ name: c.name.trim(), role: c.role.trim() }))
    .filter((c) => c.name.length > 0);

  return {
    principalInvestigator: values.principalInvestigator.trim(),
    coInvestigators,
    department: values.department.trim() || null,
    title: values.title.trim(),
    studyType: values.studyType,
    studyTemplate: values.studyTemplate,
    proposedSlug: values.proposedSlug.trim() || null,
    background: values.background.trim(),
    researchProblem: values.researchProblem.trim(),
    researchQuestions: trimList(values.researchQuestions),
    aims: values.aims.trim(),
    objectives: trimList(values.objectives),
    literatureOverview: values.literatureOverview.trim(),
    theoreticalFramework: values.theoreticalFramework.trim() || null,
    methodology: {
      ...values.methodology,
      design: values.methodology.design.trim(),
      population: values.methodology.population.trim(),
      sampling: values.methodology.sampling.trim(),
      instruments: values.methodology.instruments.trim(),
      analysis: values.methodology.analysis.trim(),
    },
    significance: values.significance.trim(),
    ethicsNotes: values.ethicsNotes.trim(),
    identifiableData: values.identifiableData,
    ethicsReference: values.ethicsReference.trim() || null,
    dataRetention: values.dataRetention.trim() || null,
    timeline: values.timeline
      .filter((t) => t.phase.trim())
      .map((t) => ({ phase: t.phase.trim(), start: t.start, end: t.end })),
    referencesText: values.referencesText.trim(),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PROSPECTUS_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const PROSPECTUS_ATTACHMENT_ACCEPT =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const PROSPECTUS_ATTACHMENT_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;

const PROSPECTUS_ATTACHMENT_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function validateProspectusAttachment(file: File): string | null {
  if (file.size > PROSPECTUS_ATTACHMENT_MAX_BYTES) {
    return `File must be 10 MB or smaller (${formatBytes(file.size)} selected).`;
  }

  const extension = file.name.includes('.')
    ? `.${file.name.split('.').pop()!.toLowerCase()}`
    : '';
  const mimeOk =
    (file.type && PROSPECTUS_ATTACHMENT_MIMES.has(file.type)) ||
    PROSPECTUS_ATTACHMENT_EXTENSIONS.includes(
      extension as (typeof PROSPECTUS_ATTACHMENT_EXTENSIONS)[number],
    );

  if (!mimeOk) {
    return 'Upload PDF or Word documents only (.pdf, .doc, .docx).';
  }

  return null;
}

export function formatCoInvestigator(c: CoInvestigator): string {
  if (c.role.trim()) return `${c.name.trim()} (${c.role.trim()})`;
  return c.name.trim();
}
