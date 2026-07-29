import { useQuery } from '@tanstack/react-query';
import { DEFAULT_SECTION_SPACING, type SectionKey } from '@soweto-stays/shared';
import { siteContentApi } from '../api/siteContent.js';

// Fetched once and cached by react-query's query-key dedup - every page/component that
// needs typography or a section's spacing preset calls this same hook rather than each
// issuing its own network request.
export function useSiteTheme() {
  return useQuery({
    queryKey: ['site-theme'],
    queryFn: siteContentApi.getTheme,
    staleTime: 5 * 60 * 1000,
  });
}

// e.g. useSectionSpacingClass('homeHero') -> 'spacing-standard'
export function useSectionSpacingClass(key: SectionKey): string {
  const { data } = useSiteTheme();
  const preset = data?.sectionSpacing[key] ?? DEFAULT_SECTION_SPACING[key];
  return `spacing-${preset}`;
}
