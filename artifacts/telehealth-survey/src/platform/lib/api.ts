export type PublicStudyCard = {
  slug: string;
  shortTitle: string;
  fullTitle: string;
  status: 'active' | 'paused';
  organization: string;
  estimatedMinutes: string | null;
  collectionOpen: boolean;
  href: string;
  surveyHref: string;
};

export type SystemAdminUser = {
  id: number;
  email: string;
  name: string;
  createdAt: string;
};

export type SystemStudy = {
  slug: string;
  responsesTable: string;
  shortTitle: string;
  fullTitle: string;
  organization: string;
  location: string | null;
  status: string;
  estimatedMinutes: string | null;
  collectionOpen: boolean;
  opensAt: string | null;
  closesAt: string | null;
};

export type SystemHealth = {
  checkedAt: string;
  api: {
    status: 'ok' | 'error';
    uptimeSeconds: number;
    nodeEnv: string;
    port: string | null;
  };
  database: {
    status: 'ok' | 'error';
    studyCount: number;
  };
  smokeTests: {
    status: 'idle' | 'running' | 'passed' | 'failed';
    testsAvailable: boolean;
    runner: 'builtin';
    startedAt: string | null;
    finishedAt: string | null;
    exitCode: number | null;
    summary: string | null;
    output: string;
  };
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
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

export function fetchPublicStudies() {
  return api<{ studies: PublicStudyCard[] }>('/api/studies');
}

export function systemLogin(email: string, password: string) {
  return api<{ user: SystemAdminUser }>('/api/system/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function systemLogout() {
  return api<{ ok: boolean }>('/api/system/auth/logout', { method: 'POST' });
}

export function fetchSystemMe() {
  return api<{ user: SystemAdminUser }>('/api/system/auth/me');
}

export function fetchSystemDashboard() {
  return api<{
    studyCount: number;
    activeStudies: number;
    totalResponses: number;
    pendingProspectuses: number;
    responsesByStudy: { slug: string; count: number }[];
  }>('/api/system/dashboard');
}

export function fetchSystemStudies() {
  return api<{ studies: SystemStudy[] }>('/api/system/studies');
}

export function patchSystemStudy(slug: string, body: Record<string, unknown>) {
  return api<SystemStudy>(`/api/system/studies/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function fetchStudyAccess(slug: string) {
  return api<{
    access: {
      id: number;
      adminUserId: number;
      email: string;
      name: string;
      role: string;
      grantedAt: string;
    }[];
  }>(`/api/system/studies/${slug}/access`);
}

export function grantStudyAccess(slug: string, adminUserId: number, role: string) {
  return api(`/api/system/studies/${slug}/access`, {
    method: 'POST',
    body: JSON.stringify({ admin_user_id: adminUserId, role }),
  });
}

export function fetchSystemUsers() {
  return api<{
    users: {
      id: number;
      email: string;
      name: string;
      role: string;
      status: string;
      studyAccess: { slug: string; role: string }[];
    }[];
  }>('/api/system/users');
}

export function fetchSystemHealth() {
  return api<SystemHealth>('/api/system/health');
}

export function runSystemSmokeTests() {
  return api<SystemHealth>('/api/system/health/run-tests', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
