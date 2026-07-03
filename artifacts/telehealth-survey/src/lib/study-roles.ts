export type StudyRole = 'viewer' | 'analyst' | 'admin';

const ROLE_RANK: Record<StudyRole, number> = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

export function roleLabel(role: StudyRole): string {
  switch (role) {
    case 'viewer':
      return 'Viewer';
    case 'analyst':
      return 'Analyst';
    case 'admin':
      return 'Study admin';
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function hasMinStudyRole(
  current: StudyRole | undefined,
  min: StudyRole,
): boolean {
  if (!current) return false;
  return ROLE_RANK[current] >= ROLE_RANK[min];
}

export function roleRequirementMessage(
  minRole: StudyRole,
  currentRole?: StudyRole,
): string {
  if (!currentRole) {
    return `${roleLabel(minRole)} access or higher is required for this page.`;
  }
  return `${roleLabel(minRole)} access or higher is required for this page. Your current role is ${roleLabel(currentRole)}.`;
}
