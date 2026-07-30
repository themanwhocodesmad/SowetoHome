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
  register: (input: { name: string; email: string; password: string }) =>
    apiFetch<{ accessToken: string; user: UserDto }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuthRetry: true,
    }),
  login: (input: { email: string; password: string }) =>
    apiFetch<{ accessToken: string; user: UserDto }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuthRetry: true,
    }),
  forgotPassword: (email: string) =>
    apiFetch<{ requested: boolean }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuthRetry: true,
    }),
  resetPassword: (input: { token: string; password: string }) =>
    apiFetch<{ accessToken: string; user: UserDto }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuthRetry: true,
    }),
};
