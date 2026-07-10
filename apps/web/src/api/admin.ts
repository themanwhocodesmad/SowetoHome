import type {
  AdminAnalyticsDto,
  ModeratePropertyInput,
  PaginatedResult,
  PlatformSettingsDto,
  PropertyDto,
  ReviewHostApplicationInput,
  SuspendUserInput,
  UpdatePlatformSettingsInput,
  UserDto,
  BookingDto,
} from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const adminApi = {
  listUsers: (page = 1, limit = 20) =>
    apiFetch<PaginatedResult<UserDto>>(`/api/admin/users?page=${page}&limit=${limit}`),
  suspendUser: (id: string, input: SuspendUserInput) =>
    apiFetch<UserDto>(`/api/admin/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  listHostApplications: (page = 1, limit = 20, status = 'pending') =>
    apiFetch<PaginatedResult<UserDto>>(
      `/api/admin/host-applications?page=${page}&limit=${limit}&status=${status}`,
    ),
  reviewHostApplication: (id: string, input: ReviewHostApplicationInput) =>
    apiFetch<UserDto>(`/api/admin/host-applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  listProperties: (page = 1, limit = 20, status?: string) =>
    apiFetch<PaginatedResult<PropertyDto>>(
      `/api/admin/properties?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`,
    ),
  moderateProperty: (id: string, input: ModeratePropertyInput) =>
    apiFetch<PropertyDto>(`/api/admin/properties/${id}/moderate`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  listBookings: (page = 1, limit = 20, status?: string) =>
    apiFetch<PaginatedResult<BookingDto>>(
      `/api/admin/bookings?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`,
    ),

  getSettings: () => apiFetch<PlatformSettingsDto>('/api/admin/settings'),
  updateSettings: (input: UpdatePlatformSettingsInput) =>
    apiFetch<PlatformSettingsDto>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  getAnalytics: () => apiFetch<AdminAnalyticsDto>('/api/admin/analytics'),
};
