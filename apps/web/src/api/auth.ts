import type { UserDto } from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const authApi = {
  me: () => apiFetch<UserDto>('/api/auth/me'),
  logout: () => apiFetch<{ loggedOut: boolean }>('/api/auth/logout', { method: 'POST' }),
  // skipAuthRetry: a 401 here means Google rejected the credential, not that our access
  // token expired - a silent refresh-and-retry would just repeat the same failure.
  googleSignIn: (credential: string) =>
    apiFetch<{ accessToken: string; user: UserDto }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
      skipAuthRetry: true,
    }),
};
