import type { ApiErrorResponse } from '@english-office/shared';

/** Backend origin; empty = same origin (Vite dev proxy). Set in client/.env.production for deploys. */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function postJson<TResponse>(path: string, body: unknown, signal?: AbortSignal): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError('Server is unreachable. Is the backend running?', 0, 'NETWORK_ERROR');
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = isApiErrorResponse(payload)
      ? payload.error
      : { code: 'HTTP_ERROR', message: `Request failed with status ${response.status}` };
    throw new ApiError(error.message, response.status, error.code);
  }
  return payload as TResponse;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const { error } = value as { error: unknown };
  return typeof error === 'object' && error !== null && 'message' in error && 'code' in error;
}
