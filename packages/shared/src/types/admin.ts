import type { PropertyDto } from './property.js';
import type { SectionSpacingPreset } from '../constants/platform.js';

export interface AdminAnalyticsDto {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalAdminFees: number;
  totalHostPayouts: number;
}

export interface PlatformSettingsDto {
  adminFeePercent: number;
  cancellationFreeWindowHours: number;
  sectionSpacingPreset: SectionSpacingPreset;
}

export type SiteImagesDto = Record<string, string>;

export interface HomepageStatDto {
  value: string;
  label: string;
}

export interface HomepageStepDto {
  number: string;
  title: string;
  copy: string;
}

export interface HomepageContentDto {
  heroEyebrow: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  discoveryEyebrow: string;
  discoveryTitle: string;
  discoverySubtitle: string;
  trustStats: HomepageStatDto[];
  valuePropEyebrow: string;
  valuePropTitle: string;
  valuePropTitleAccent: string;
  valuePropCopy1: string;
  valuePropCopy2: string;
  valueSteps: HomepageStepDto[];
}

export interface AdminHomepageDto {
  siteImages: SiteImagesDto;
  content: HomepageContentDto;
  featuredPropertyIds: string[];
}

export interface PublicHomepageDto {
  siteImages: SiteImagesDto;
  content: HomepageContentDto;
  featuredProperties: PropertyDto[];
  sectionSpacingPreset: SectionSpacingPreset;
}