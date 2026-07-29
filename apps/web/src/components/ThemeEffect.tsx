import { useEffect } from 'react';
import { BASE_SIZE_SCALE_PERCENT, BODY_FONT_OPTIONS, HEADING_FONT_OPTIONS } from '@soweto-stays/shared';
import { useSiteTheme } from '../hooks/useSiteTheme.js';

// Renders nothing - applies the admin-configured heading/body fonts and base font-size
// scale as CSS custom properties / root font-size once the site theme loads. Every
// rem-based size and the section spacing scale (also expressed in rem * a multiplier)
// scale together as a result.
export function ThemeEffect() {
  const { data } = useSiteTheme();

  useEffect(() => {
    if (!data) return;
    const root = document.documentElement;
    const heading = HEADING_FONT_OPTIONS.find((option) => option.key === data.typography.headingFont);
    const body = BODY_FONT_OPTIONS.find((option) => option.key === data.typography.bodyFont);
    if (heading) root.style.setProperty('--font-heading', heading.family);
    if (body) root.style.setProperty('--font-body', body.family);
    root.style.fontSize = `${BASE_SIZE_SCALE_PERCENT[data.typography.baseSizeScale]}%`;
  }, [data]);

  return null;
}
