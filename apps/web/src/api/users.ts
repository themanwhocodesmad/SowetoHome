import type { UpdateProfileInput, UserDto } from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const usersApi = {
  updateProfile: (input: UpdateProfileInput) =>
    apiFetch<UserDto>('/api/users/profile', { method: 'PATCH', body: JSON.stringify(input) }),
  becomeHost: () =>
    apiFetch<UserDto>('/api/users/become-host', {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    }),
};
