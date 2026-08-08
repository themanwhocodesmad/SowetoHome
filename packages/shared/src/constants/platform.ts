// Centralized "policy" numbers referenced from claude_plan.md so they aren't duplicated
// (and drift) across the api, worker, and web apps.

export const MAX_PROPERTY_IMAGES = 8;
export const CANCELLATION_FREE_WINDOW_HOURS = 48;
export const REMINDER_BEFORE_CHECKIN_HOURS = 24;
export const RATING_PROMPT_AFTER_CHECKOUT_HOURS = 24;

// Editable marketing-page image slots, exposed via the admin "Site Images" page so the
// client can swap these demo photos themselves without a code deploy. Add a new slot here
// to make it editable - no other backend change needed, storage is a flexible key/value map.
export const SITE_IMAGE_SLOTS = [
  { key: 'siteLogo', label: 'Site logo (navbar & hero, transparent PNG recommended)' },
  { key: 'homeHero', label: 'Homepage hero photo' },
  { key: 'homeHero2', label: 'Homepage hero slideshow photo 2 (optional)' },
  { key: 'homeHero3', label: 'Homepage hero slideshow photo 3 (optional)' },
  { key: 'homeHero4', label: 'Homepage hero slideshow photo 4 (optional)' },
  { key: 'valuePropImage', label: 'Value proposition section photo (optional)' },
] as const;

export const MAX_FEATURED_LISTINGS = 12;

export type SiteImageKey = (typeof SITE_IMAGE_SLOTS)[number]['key'];

export const SITE_IMAGE_KEYS = SITE_IMAGE_SLOTS.map((slot) => slot.key) as SiteImageKey[];

// Named multipliers applied to each section's existing (already responsive) vertical
// padding via a `--spacing-scale` CSS custom property - see index.css's "Section spacing
// presets". One of these is picked per section (see SECTION_KEYS below), not globally.
export const SECTION_SPACING_PRESETS = ['compact', 'standard', 'comfortable', 'spacious'] as const;
export type SectionSpacingPreset = (typeof SECTION_SPACING_PRESETS)[number];
export const DEFAULT_SECTION_SPACING_PRESET: SectionSpacingPreset = 'standard';

// Every independently-adjustable section across the site. Add a key here + a matching
// CSS class hook to make a new section's padding admin-editable.
export const SECTION_KEYS = [
  'homeHero',
  'homeDiscovery',
  'homeValueProp',
  'about',
  'services',
  'contact',
  'footer',
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  homeHero: 'Homepage — Hero',
  homeDiscovery: 'Homepage — Featured Estates',
  homeValueProp: 'Homepage — Capabilities',
  about: 'About page',
  services: 'Services page',
  contact: 'Contact page',
  footer: 'Footer (all pages)',
};

export type SectionSpacingMap = Record<SectionKey, SectionSpacingPreset>;

export const DEFAULT_SECTION_SPACING: SectionSpacingMap = SECTION_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: DEFAULT_SECTION_SPACING_PRESET }),
  {} as SectionSpacingMap,
);

// Curated font pairings, preloaded in index.html so switching is instant (no extra
// network round-trip for a new <link>). Each `family` is a ready-to-use CSS font-family
// stack, mirroring the shape of the existing --font-heading/--font-body defaults.
export const HEADING_FONT_OPTIONS = [
  {
    key: 'playfair',
    label: 'Playfair Display (classic serif)',
    family: "'Playfair Display', Georgia, 'Times New Roman', serif",
  },
  {
    key: 'merriweather',
    label: 'Merriweather (editorial serif)',
    family: "'Merriweather', Georgia, serif",
  },
  {
    key: 'poppins',
    label: 'Poppins (modern sans)',
    family: "'Poppins', 'Segoe UI', sans-serif",
  },
] as const;
export type HeadingFontKey = (typeof HEADING_FONT_OPTIONS)[number]['key'];

export const BODY_FONT_OPTIONS = [
  {
    key: 'manrope',
    label: 'Manrope (default)',
    family:
      "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  {
    key: 'inter',
    label: 'Inter',
    family:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  {
    key: 'sourceSans',
    label: 'Source Sans 3',
    family:
      "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
] as const;
export type BodyFontKey = (typeof BODY_FONT_OPTIONS)[number]['key'];

export const BASE_SIZE_SCALES = ['small', 'medium', 'large'] as const;
export type BaseSizeScale = (typeof BASE_SIZE_SCALES)[number];
// Applied as `html { font-size: X% }` - scales every rem-based size/spacing in tandem.
export const BASE_SIZE_SCALE_PERCENT: Record<BaseSizeScale, number> = {
  small: 93.75,
  medium: 100,
  large: 108,
};

export interface TypographySettings {
  headingFont: HeadingFontKey;
  bodyFont: BodyFontKey;
  baseSizeScale: BaseSizeScale;
}

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  headingFont: 'playfair',
  bodyFont: 'manrope',
  baseSizeScale: 'medium',
};
