import type { AdminRole } from "@workspace/db";

export const ROLE_RANK: Record<AdminRole, number> = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

export function roleLabel(role: AdminRole): string {
  switch (role) {
    case "viewer":
      return "Viewer";
    case "analyst":
      return "Analyst";
    case "admin":
      return "Study admin";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function insufficientRoleMessage(
  minRole: AdminRole,
  currentRole: AdminRole,
): string {
  return `${roleLabel(minRole)} access or higher is required for this action. Your role for this study is ${roleLabel(currentRole)}.`;
}
