import type { ListClinicianSurveysParams } from "@workspace/api-client-react";

function buildExportQuery(params: ListClinicianSurveysParams): string {
  const search = new URLSearchParams();
  if (params.clinical_role) search.set("clinical_role", params.clinical_role);
  if (params.department) search.set("department", params.department);
  if (params.date_from) search.set("date_from", params.date_from);
  if (params.date_to) search.set("date_to", params.date_to);
  if (params.min_willingness !== undefined) {
    search.set("min_willingness", String(params.min_willingness));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function downloadClinicianSurveyExport(
  filters: ListClinicianSurveysParams,
): Promise<void> {
  const url = `/api/studies/clinician-telehealth-readiness/surveys/export${buildExportQuery(filters)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Export failed");
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `clinician-telehealth-readiness-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
