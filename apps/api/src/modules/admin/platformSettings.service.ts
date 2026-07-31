import type {
  AboutContentDto,
  ContactContentDto,
  HomepageContentDto,
  SectionSpacingMap,
  ServicesContentDto,
  TypographySettings,
  UpdateAboutContentInput,
  UpdateContactContentInput,
  UpdateHomepageInput,
  UpdatePlatformSettingsInput,
  UpdateSectionSpacingInput,
  UpdateServicesContentInput,
  UpdateTypographyInput,
} from '@soweto-stays/shared';
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_CONTACT_CONTENT,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_SECTION_SPACING,
  DEFAULT_SERVICES_CONTENT,
  DEFAULT_TYPOGRAPHY,
} from '@soweto-stays/shared';
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

export function resolveAboutContent(stored: AboutContentDto | undefined | null): AboutContentDto {
  return stored ?? DEFAULT_ABOUT_CONTENT;
}

export function resolveServicesContent(
  stored: ServicesContentDto | undefined | null,
): ServicesContentDto {
  return stored ?? DEFAULT_SERVICES_CONTENT;
}

export function resolveContactContent(
  stored: ContactContentDto | undefined | null,
): ContactContentDto {
  return stored ?? DEFAULT_CONTACT_CONTENT;
}

export function resolveSectionSpacing(
  stored: Partial<SectionSpacingMap> | undefined | null,
): SectionSpacingMap {
  return { ...DEFAULT_SECTION_SPACING, ...stored };
}

export function resolveTypography(
  stored: Partial<TypographySettings> | undefined | null,
): TypographySettings {
  return { ...DEFAULT_TYPOGRAPHY, ...stored };
}

export const platformSettingsService = {
  getOrCreate,

  async getCancellationFreeWindowHours(): Promise<number> {
    const settings = await getOrCreate();
    return settings.cancellationFreeWindowHours;
  },

  async update(input: UpdatePlatformSettingsInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    if (input.cancellationFreeWindowHours !== undefined) {
      settings.cancellationFreeWindowHours = input.cancellationFreeWindowHours;
    }
    return settings.save();
  },

  async updateSectionSpacing(input: UpdateSectionSpacingInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    settings.sectionSpacing = { ...settings.sectionSpacing, ...input };
    settings.markModified('sectionSpacing');
    return settings.save();
  },

  async updateTypography(input: UpdateTypographyInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    settings.typography = { ...settings.typography, ...input };
    settings.markModified('typography');
    return settings.save();
  },

  async updateAboutContent(input: UpdateAboutContentInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    settings.aboutContent = input;
    settings.markModified('aboutContent');
    return settings.save();
  },

  async updateServicesContent(input: UpdateServicesContentInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    settings.servicesContent = input;
    settings.markModified('servicesContent');
    return settings.save();
  },

  async updateContactContent(input: UpdateContactContentInput): Promise<PlatformSettingsDocument> {
    const settings = await getOrCreate();
    settings.contactContent = input;
    settings.markModified('contactContent');
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

  async getSectionSpacing(): Promise<SectionSpacingMap> {
    const settings = await getOrCreate();
    return resolveSectionSpacing(settings.sectionSpacing);
  },

  async getTypography(): Promise<TypographySettings> {
    const settings = await getOrCreate();
    return resolveTypography(settings.typography);
  },

  async getAboutContent(): Promise<AboutContentDto> {
    const settings = await getOrCreate();
    return resolveAboutContent(settings.aboutContent);
  },

  async getServicesContent(): Promise<ServicesContentDto> {
    const settings = await getOrCreate();
    return resolveServicesContent(settings.servicesContent);
  },

  async getContactContent(): Promise<ContactContentDto> {
    const settings = await getOrCreate();
    return resolveContactContent(settings.contactContent);
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