import type { ListSurveysParams } from '@workspace/api-client-react';

function buildExportQuery(params: ListSurveysParams): string {
  const search = new URLSearchParams();
  if (params.employment_type) search.set('employment_type', params.employment_type);
  if (params.has_ncd) search.set('has_ncd', params.has_ncd);
  if (params.work_area) search.set('work_area', params.work_area);
  if (params.date_from) search.set('date_from', params.date_from);
  if (params.date_to) search.set('date_to', params.date_to);
  if (params.min_willingness !== undefined) {
    search.set('min_willingness', String(params.min_willingness));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function downloadSurveyExport(filters: ListSurveysParams): Promise<void> {
  const url = `/api/studies/telehealth-readiness/surveys/export${buildExportQuery(filters)}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Export failed');
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `telehealth-readiness-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
