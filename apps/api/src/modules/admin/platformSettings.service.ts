import type {
  HomepageContentDto,
  UpdateHomepageInput,
  UpdatePlatformSettingsInput,
} from '@soweto-stays/shared';
import { DEFAULT_HOMEPAGE_CONTENT } from '@soweto-stays/shared';
import {
  PLATFORM_SETTINGS_ID,
  PlatformSettingsModel,
  type PlatformSettingsDocument,
} from '@soweto-stays/db';

// Atomic upsert avoids a race on the very first read (two concurrent requests both finding
// no document and both trying to create it) - Mongoose applies schema defaults on insert.
function getOrCreate(): Promise<PlatformSettingsDocument> {
  return PlatformSettingsModel.findByIdAndUpdate(
    PLATFORM_SETTINGS_ID,
    { $setOnInsert: { _id: PLATFORM_SETTINGS_ID } },
    { upsert: true, new: true },
  );
}

export function resolveHomepageContent(
  stored: HomepageContentDto | undefined | null,
): HomepageContentDto {
  return stored ?? DEFAULT_HOMEPAGE_CONTENT;
}

export const platformSettingsService = {
  getOrCreate,

  async getAdminFeePercent(): Promise<number> {
    const settings = await getOrCreate();
    return settings.adminFeePercent;
  },

  async getCancellationFreeWindowHours(): Promise<number> {
    const settings = await getOrCreate();
    return settings.cancellationFreeWindowHours;
  },

  async update(input: UpdatePlatformSettingsInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    if (input.adminFeePercent !== undefined) settings.adminFeePercent = input.adminFeePercent;
    if (input.cancellationFreeWindowHours !== undefined) {
      settings.cancellationFreeWindowHours = input.cancellationFreeWindowHours;
    }
    return settings.save();
  },

  async getSiteImages(): Promise<Record<string, string>> {
    const settings = await getOrCreate();
    return settings.siteImages ?? {};
  },

  async setSiteImage(key: string, imagePath: string): Promise<Record<string, string>> {
    const settings = await getOrCreate();
    settings.siteImages = { ...settings.siteImages, [key]: imagePath };
    settings.markModified('siteImages');
    await settings.save();
    return settings.siteImages;
  },

  async clearSiteImage(key: string): Promise<Record<string, string>> {
    const settings = await getOrCreate();
    const { [key]: _removed, ...rest } = settings.siteImages ?? {};
    settings.siteImages = rest;
    settings.markModified('siteImages');
    await settings.save();
    return settings.siteImages;
  },

  async getHomepageContent(): Promise<HomepageContentDto> {
    const settings = await getOrCreate();
    return resolveHomepageContent(settings.homepageContent);
  },

  async getFeaturedPropertyIds(): Promise<string[]> {
    const settings = await getOrCreate();
    return settings.featuredPropertyIds ?? [];
  },

  async updateHomepage(input: UpdateHomepageInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    if (input.content !== undefined) {
      settings.homepageContent = input.content;
      settings.markModified('homepageContent');
    }
    if (input.featuredPropertyIds !== undefined) {
      settings.featuredPropertyIds = input.featuredPropertyIds;
    }
    return settings.save();
  },
};