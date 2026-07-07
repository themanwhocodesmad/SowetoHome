const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { message: string; code?: string };
}

async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
  if (!res.ok) return null;
  const body = (await res.json()) as ApiEnvelope<{ accessToken: string }>;
  const token = body.data?.accessToken ?? null;
  setAccessToken(token);
  return token;
}

interface ApiFetchOptions extends RequestInit {
  skipAuthRetry?: boolean;
}

// Access tokens live in memory only (never localStorage) - a page load starts with none
// and silently refreshes via the httpOnly cookie set at /api/auth/google/callback.
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuthRetry, headers, ...rest } = options;
  const isFormData = rest.body instanceof FormData;

  const doFetch = (): Promise<Response> =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    });

  let res = await doFetch();

  if (res.status === 401 && !skipAuthRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await doFetch();
  }

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !body || body.success === false) {
    throw new Error(body?.error?.message ?? `Request failed with status ${res.status}`);
  }

  return body.data as T;
}

export function apiBaseUrl(): string {
  return API_URL;
}

export { refreshAccessToken };
