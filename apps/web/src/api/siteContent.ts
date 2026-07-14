import type { SiteImagesDto } from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const siteContentApi = {
  getImages: () => apiFetch<SiteImagesDto>('/api/site-content/images'),
};
