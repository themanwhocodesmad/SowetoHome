import type {
  AboutContentDto,
  ContactContentDto,
  PublicHomepageDto,
  ServicesContentDto,
  SiteImagesDto,
  SiteThemeDto,
} from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const siteContentApi = {
  getImages: () => apiFetch<SiteImagesDto>('/api/site-content/images'),
  getHomepage: () => apiFetch<PublicHomepageDto>('/api/site-content/homepage'),
  getTheme: () => apiFetch<SiteThemeDto>('/api/site-content/theme'),
  getAbout: () => apiFetch<AboutContentDto>('/api/site-content/about'),
  getServices: () => apiFetch<ServicesContentDto>('/api/site-content/services'),
  getContact: () => apiFetch<ContactContentDto>('/api/site-content/contact'),
};
