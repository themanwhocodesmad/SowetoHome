// Centralized "policy" numbers referenced from claude_plan.md so they aren't duplicated
// (and drift) across the api, worker, and web apps.

export const DEFAULT_ADMIN_FEE_PERCENT = 10;
export const MAX_PROPERTY_IMAGES = 8;
export const CANCELLATION_FREE_WINDOW_HOURS = 48;
export const REMINDER_BEFORE_CHECKIN_HOURS = 24;
export const RATING_PROMPT_AFTER_CHECKOUT_HOURS = 24;

// Editable marketing-page image slots, exposed via the admin "Site Images" page so the
// client can swap these demo photos themselves without a code deploy. Add a new slot here
// to make it editable - no other backend change needed, storage is a flexible key/value map.
export const SITE_IMAGE_SLOTS = [
  { key: 'homeHero', label: 'Homepage hero photo' },
  { key: 'valuePropImage', label: 'Value proposition section photo (optional)' },
] as const;

export const MAX_FEATURED_LISTINGS = 12;

export type SiteImageKey = (typeof SITE_IMAGE_SLOTS)[number]['key'];

export const SITE_IMAGE_KEYS = SITE_IMAGE_SLOTS.map((slot) => slot.key) as SiteImageKey[];
