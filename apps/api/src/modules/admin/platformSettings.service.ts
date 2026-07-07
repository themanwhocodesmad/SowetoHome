import type { UpdatePlatformSettingsInput } from '@soweto-stays/shared';
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
};
