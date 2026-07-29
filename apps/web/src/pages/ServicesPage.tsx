import { useQuery } from '@tanstack/react-query';
import { DEFAULT_SERVICES_CONTENT } from '@soweto-stays/shared';
import { siteContentApi } from '../api/siteContent.js';
import { useSectionSpacingClass } from '../hooks/useSiteTheme.js';

export function ServicesPage() {
  const { data } = useQuery({
    queryKey: ['site-content', 'services'],
    queryFn: siteContentApi.getServices,
  });
  const content = data ?? DEFAULT_SERVICES_CONTENT;
  const spacing = useSectionSpacingClass('services');

  return (
    <div className="marketing-page">
      <section className={`content-section ${spacing}`}>
        <span className="content-section__eyebrow">{content.eyebrow}</span>
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>

        <div className="card-grid">
          {content.services.map((service) => (
            <div className="panel" key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
