import type { UserDto } from '@soweto-stays/shared';
import { apiBaseUrl, apiFetch } from './client.js';

export const authApi = {
  me: () => apiFetch<UserDto>('/api/auth/me'),
  logout: () => apiFetch<{ loggedOut: boolean }>('/api/auth/logout', { method: 'POST' }),
};

export function googleLoginUrl(): string {
  return `${apiBaseUrl()}/api/auth/google`;
}
