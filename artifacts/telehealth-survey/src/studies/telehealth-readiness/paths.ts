export const STUDY_SLUG = "telehealth-readiness" as const;

export const studyPaths = {
  landing: `/studies/${STUDY_SLUG}`,
  survey: `/studies/${STUDY_SLUG}/survey`,
  adminLogin: `/studies/${STUDY_SLUG}/admin/login`,
  registration: `/studies/${STUDY_SLUG}/registration`,
  adminUsers: `/studies/${STUDY_SLUG}/admin/users`,
  /** @deprecated use registration */
  adminRegister: `/studies/${STUDY_SLUG}/registration`,
  admin: `/studies/${STUDY_SLUG}/admin`,
  adminReport: `/studies/${STUDY_SLUG}/admin/report`,
  adminResponse: (id: number | string) =>
    `/studies/${STUDY_SLUG}/admin/responses/${id}`,
} as const;

/** @deprecated Legacy paths — redirects remain for existing links */
export const legacyPaths = {
  landing: "/",
  survey: "/survey",
  admin: "/admin",
  adminResponse: (id: number | string) => `/admin/survey/${id}`,
} as const;

export function surveyPublicUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}${studyPaths.survey}`;
}
