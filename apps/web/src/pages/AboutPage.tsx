import { useQuery } from '@tanstack/react-query';
import { DEFAULT_ABOUT_CONTENT } from '@soweto-stays/shared';
import { siteContentApi } from '../api/siteContent.js';
import { useSectionSpacingClass } from '../hooks/useSiteTheme.js';

export function AboutPage() {
  const { data } = useQuery({ queryKey: ['site-content', 'about'], queryFn: siteContentApi.getAbout });
  const content = data ?? DEFAULT_ABOUT_CONTENT;
  const spacing = useSectionSpacingClass('about');

  return (
    <div className="marketing-page">
      <section className={`content-section ${spacing}`}>
        <span className="content-section__eyebrow">{content.visionEyebrow}</span>
        <h1>{content.visionTitle}</h1>
        <p>{content.visionCopy1}</p>
        <p>{content.visionCopy2}</p>
      </section>

      <section className={`content-section ${spacing}`}>
        <span className="content-section__eyebrow">{content.corporateEyebrow}</span>
        <h2>{content.corporateTitle}</h2>
        <p>{content.corporateCopy}</p>
      </section>
    </div>
  );
}
