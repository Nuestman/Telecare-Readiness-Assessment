import {
  CLINICIAN_TELEHEALTH_RESPONSES_TABLE,
  CLINICIAN_TELEHEALTH_STUDY_SLUG,
  TELEHEALTH_RESPONSES_TABLE,
  TELEHEALTH_STUDY_SLUG,
} from "./constants";
import { clinicianTelehealthReadinessSurveysTable } from "./schema/clinician-telehealth-readiness-surveys";
import { telehealthReadinessSurveysTable } from "./schema/telehealth-readiness-surveys";

export const studyResponseTables = {
  [TELEHEALTH_STUDY_SLUG]: telehealthReadinessSurveysTable,
  [CLINICIAN_TELEHEALTH_STUDY_SLUG]: clinicianTelehealthReadinessSurveysTable,
} as const;

export const studyResponseTableNames = {
  [TELEHEALTH_STUDY_SLUG]: TELEHEALTH_RESPONSES_TABLE,
  [CLINICIAN_TELEHEALTH_STUDY_SLUG]: CLINICIAN_TELEHEALTH_RESPONSES_TABLE,
} as const;

export type RegisteredStudySlug = keyof typeof studyResponseTables;

export function isRegisteredStudySlug(slug: string): slug is RegisteredStudySlug {
  return slug in studyResponseTables;
}

export function getStudyResponseTable(slug: RegisteredStudySlug) {
  return studyResponseTables[slug];
}
