import type { UpdateProfileInput, UserDto } from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const usersApi = {
  updateProfile: (input: UpdateProfileInput) =>
    apiFetch<UserDto>('/api/users/profile', { method: 'PATCH', body: JSON.stringify(input) }),
  applyToHost: (message?: string) =>
    apiFetch<UserDto>('/api/users/host-application', {
      method: 'POST',
      body: JSON.stringify({ message: message || undefined }),
    }),
};
