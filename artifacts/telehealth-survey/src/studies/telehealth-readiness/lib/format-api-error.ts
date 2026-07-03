import { ApiError } from '@workspace/api-client-react';

function readErrorField(data: unknown, key: string): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function isPermissionError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

export function formatApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const fromBody =
      readErrorField(error.data, 'error') ??
      readErrorField(error.data, 'message') ??
      readErrorField(error.data, 'detail');

    if (fromBody) return fromBody;

    if (error.status === 404) {
      return 'This action is not available. Restart the API server and try again.';
    }
    if (error.status === 403) {
      return fromBody ?? 'You do not have permission to perform this action.';
    }
    if (error.status === 401) {
      return 'Your session has expired. Sign in again.';
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
