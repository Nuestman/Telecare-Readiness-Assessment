import type { AdminLayoutStudyConfig } from "@/components/layout/AdminLayout";
import { studyPaths, STUDY_SLUG, surveyPublicUrl } from "./paths";

export const clinicianAdminLayout: AdminLayoutStudyConfig = {
  studySlug: STUDY_SLUG,
  studyPaths,
  surveyPublicUrl,
  shareDescription:
    "Share this link or QR code with clinical staff at AGA Health Foundation.",
};
