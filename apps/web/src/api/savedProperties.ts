import type { PropertyDto } from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const savedPropertiesApi = {
  list: () => apiFetch<PropertyDto[]>('/api/saved-properties'),
  listIds: () => apiFetch<string[]>('/api/saved-properties/ids'),
  save: (propertyId: string) =>
    apiFetch<{ saved: boolean }>(`/api/saved-properties/${propertyId}`, { method: 'POST' }),
  unsave: (propertyId: string) =>
    apiFetch<{ saved: boolean }>(`/api/saved-properties/${propertyId}`, { method: 'DELETE' }),
};
