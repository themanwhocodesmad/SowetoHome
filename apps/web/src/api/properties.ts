import type {
  CreatePropertyInput,
  PaginatedResult,
  PropertyDto,
  PropertySearchQuery,
  UpdatePropertyInput,
} from '@soweto-stays/shared';
import { apiFetch } from './client.js';

function toQueryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export const propertiesApi = {
  search: (query: Partial<PropertySearchQuery>) =>
    apiFetch<PaginatedResult<PropertyDto>>(`/api/properties?${toQueryString(query)}`),
  getById: (id: string) => apiFetch<PropertyDto>(`/api/properties/${id}`),
  listMine: () => apiFetch<PropertyDto[]>('/api/properties/mine'),
  create: (input: CreatePropertyInput) =>
    apiFetch<PropertyDto>('/api/properties', { method: 'POST', body: JSON.stringify(input) }),
  createOnBehalf: (hostId: string, input: CreatePropertyInput) =>
    apiFetch<PropertyDto>(`/api/properties/on-behalf/${hostId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdatePropertyInput) =>
    apiFetch<PropertyDto>(`/api/properties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  uploadImages: (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return apiFetch<PropertyDto>(`/api/properties/${id}/images`, {
      method: 'POST',
      body: formData,
    });
  },
  removeImage: (id: string, imagePath: string) =>
    apiFetch<PropertyDto>(`/api/properties/${id}/images`, {
      method: 'DELETE',
      body: JSON.stringify({ imagePath }),
    }),
};
