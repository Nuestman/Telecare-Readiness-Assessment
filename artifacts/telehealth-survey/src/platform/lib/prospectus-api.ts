import type {
  ProspectusDetailResponse,
  ProspectusListItem,
  ProspectusPublic,
  ProspectusReview,
  ProspectusStatus,
} from '@/platform/lib/types';

async function prospectusApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export function fetchProspectusTemplate() {
  return prospectusApi<Record<string, unknown>>('/api/prospectus/template');
}

export function createProspectus(body: {
  submitterEmail: string;
  submitterName: string;
  title?: string;
}) {
  return prospectusApi<ProspectusPublic>('/api/prospectus', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function fetchProspectus(publicId: string) {
  return prospectusApi<ProspectusPublic>(`/api/prospectus/${publicId}`);
}

export function patchProspectus(publicId: string, body: Record<string, unknown>) {
  return prospectusApi<ProspectusPublic>(`/api/prospectus/${publicId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function submitProspectus(publicId: string) {
  return prospectusApi<ProspectusPublic>(`/api/prospectus/${publicId}/submit`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function withdrawProspectus(publicId: string) {
  return prospectusApi<ProspectusPublic>(`/api/prospectus/${publicId}/withdraw`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function fetchProspectusAttachments(publicId: string) {
  return prospectusApi<{ attachments: ProspectusPublic['attachments'] }>(
    `/api/prospectus/${publicId}/attachments`,
  );
}

export async function uploadProspectusAttachment(publicId: string, file: File) {
  const contentBase64 = await fileToBase64(file);
  return prospectusApi<{ id: number; filename: string }>(
    `/api/prospectus/${publicId}/attachments`,
    {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        contentBase64,
      }),
    },
  );
}

export function deleteProspectusAttachment(publicId: string, attachmentId: number) {
  return prospectusApi<{ ok: boolean }>(
    `/api/prospectus/${publicId}/attachments/${attachmentId}`,
    { method: 'DELETE' },
  );
}

export function fetchSystemProspectuses(status?: ProspectusStatus) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return prospectusApi<{ prospectuses: ProspectusListItem[] }>(`/api/system/prospectus${qs}`);
}

export function fetchSystemProspectusDetail(id: number) {
  return prospectusApi<ProspectusDetailResponse>(`/api/system/prospectus/${id}`);
}

export function addProspectusReview(
  id: number,
  body: { decision: 'comment' | 'revision_requested'; comments: string; isInternal?: boolean },
) {
  return prospectusApi<ProspectusDetailResponse>(`/api/system/prospectus/${id}/reviews`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function recordProspectusApproval(
  id: number,
  body: {
    approvalRole: 'research_leadership' | 'platform_ops';
    decision: 'approved' | 'rejected';
    comments?: string;
  },
) {
  return prospectusApi<ProspectusDetailResponse>(`/api/system/prospectus/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function provisionStudyFromProspectus(
  id: number,
  body?: { slug?: string; shortTitle?: string },
) {
  return prospectusApi<{ slug: string; message: string }>(
    `/api/system/prospectus/${id}/provision-study`,
    {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    },
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not read file'));
        return;
      }
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Could not encode file'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export type { ProspectusDetailResponse, ProspectusReview };
