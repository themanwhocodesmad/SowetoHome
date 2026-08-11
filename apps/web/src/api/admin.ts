import type {
  AboutContentDto,
  AddFakeReviewInput,
  AdminAnalyticsDto,
  AdminHomepageDto,
  ContactContentDto,
  ModeratePropertyInput,
  PaginatedResult,
  PaymentGatewaySettingsDto,
  PaymentProvider,
  PlatformSettingsDto,
  PropertyDto,
  ReviewDto,
  SectionSpacingMap,
  ServicesContentDto,
  SiteImagesDto,
  SuspendUserInput,
  TypographySettings,
  UpdateAboutContentInput,
  UpdateContactContentInput,
  UpdateHomepageInput,
  UpdatePaymentGatewaySettingsInput,
  UpdatePaymentGatewaySettingsResponseDto,
  UpdatePlatformSettingsInput,
  UpdateSectionSpacingInput,
  UpdateServicesContentInput,
  UpdateTypographyInput,
  UserDto,
  BookingDto,
} from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const adminApi = {
  listUsers: (page = 1, limit = 20, role?: string) =>
    apiFetch<PaginatedResult<UserDto>>(
      `/api/admin/users?page=${page}&limit=${limit}${role ? `&role=${role}` : ''}`,
    ),
  suspendUser: (id: string, input: SuspendUserInput) =>
    apiFetch<UserDto>(`/api/admin/users/${id}/suspend`, {
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

  addFakeReview: (propertyId: string, input: AddFakeReviewInput) =>
    apiFetch<ReviewDto>(`/api/admin/properties/${propertyId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  removeFakeReview: (propertyId: string, reviewId: string) =>
    apiFetch<{ removed: boolean }>(`/api/admin/properties/${propertyId}/reviews/${reviewId}`, {
      method: 'DELETE',
    }),
  uploadReviewAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiFetch<{ avatarUrl: string }>('/api/admin/review-avatar', {
      method: 'POST',
      body: formData,
    });
  },

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
  updateSectionSpacing: (input: UpdateSectionSpacingInput) =>
    apiFetch<SectionSpacingMap>('/api/admin/settings/section-spacing', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  updateTypography: (input: UpdateTypographyInput) =>
    apiFetch<TypographySettings>('/api/admin/settings/typography', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  getPaymentSettings: () => apiFetch<PaymentGatewaySettingsDto>('/api/admin/payment-settings'),
  updatePaymentSettings: (input: UpdatePaymentGatewaySettingsInput) =>
    apiFetch<UpdatePaymentGatewaySettingsResponseDto>('/api/admin/payment-settings', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  testPaymentWebhook: (provider: PaymentProvider) =>
    apiFetch<{ ok: boolean; message: string }>('/api/admin/payment-settings/test-webhook', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    }),

  getAboutContent: () => apiFetch<AboutContentDto>('/api/admin/pages/about'),
  updateAboutContent: (input: UpdateAboutContentInput) =>
    apiFetch<AboutContentDto>('/api/admin/pages/about', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  getServicesContent: () => apiFetch<ServicesContentDto>('/api/admin/pages/services'),
  updateServicesContent: (input: UpdateServicesContentInput) =>
    apiFetch<ServicesContentDto>('/api/admin/pages/services', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  getContactContent: () => apiFetch<ContactContentDto>('/api/admin/pages/contact'),
  updateContactContent: (input: UpdateContactContentInput) =>
    apiFetch<ContactContentDto>('/api/admin/pages/contact', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  getAnalytics: () => apiFetch<AdminAnalyticsDto>('/api/admin/analytics'),

  getSiteImages: () => apiFetch<SiteImagesDto>('/api/admin/site-images'),
  uploadSiteImage: (key: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiFetch<SiteImagesDto>(`/api/admin/site-images/${key}`, {
      method: 'POST',
      body: formData,
    });
  },
  deleteSiteImage: (key: string) =>
    apiFetch<SiteImagesDto>(`/api/admin/site-images/${key}`, { method: 'DELETE' }),

  getHomepage: () => apiFetch<AdminHomepageDto>('/api/admin/homepage'),
  updateHomepage: (input: UpdateHomepageInput) =>
    apiFetch<AdminHomepageDto>('/api/admin/homepage', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
};
