// Amenities are free-form strings (see seed.ts / CreateListingPage.tsx - there's no fixed
// enum), so this maps the common ones we know about to an icon and falls back to a generic
// checkmark for anything else, rather than requiring every amenity ever entered to be
// registered here first.
const ICONS: Record<string, JSX.Element> = {
  wifi: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5a11 11 0 0 1 14 0M8.5 16a6.5 6.5 0 0 1 7 0M12 19.5h.01" />
    </svg>
  ),
  parking: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 16V7h3.5a2.5 2.5 0 0 1 0 5H9" />
    </svg>
  ),
  kitchen: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3v18M4 3h3v7a1.5 1.5 0 0 1-3 0V3ZM20 3v18M20 12a3 3 0 0 0-3-3V3" />
    </svg>
  ),
  washing_machine: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <path d="M8 3.5h1M11 3.5h1" />
    </svg>
  ),
  tv: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 18v3" />
    </svg>
  ),
  pool: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0M6 13V6a2 2 0 0 1 2-2h3l7 7" />
    </svg>
  ),
  air_conditioning: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="6" rx="2" />
      <path d="M6 16v3M10 16v4M14 16v3M18 16v4" />
    </svg>
  ),
  breakfast: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h13a3 3 0 0 1 0 6H5z" />
      <path d="M18 12V8a2 2 0 0 1 2 2v2M5 12V6M9 6v6M5 21h13" />
    </svg>
  ),
};

const FALLBACK = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export function amenityIcon(key: string): JSX.Element {
  return ICONS[key] ?? FALLBACK;
}

export function amenityLabel(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
