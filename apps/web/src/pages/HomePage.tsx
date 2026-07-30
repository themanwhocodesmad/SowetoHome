import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DEFAULT_HOMEPAGE_CONTENT } from '@soweto-stays/shared';
import { propertiesApi } from '../api/properties.js';
import { siteContentApi } from '../api/siteContent.js';
import { apiBaseUrl } from '../api/client.js';
import { PropertyCard } from '../components/PropertyCard.js';
import { SearchBar } from '../components/SearchBar.js';
import { useSectionSpacingClass } from '../hooks/useSiteTheme.js';

export function HomePage() {
  const homepageQuery = useQuery({
    queryKey: ['site-content', 'homepage'],
    queryFn: siteContentApi.getHomepage,
  });

  const curatedProperties = homepageQuery.data?.featuredProperties ?? [];

  // Falls back to a plain search when no admin has curated a "featured properties"
  // list yet, so the homepage isn't just an empty gap until someone does that setup.
  const fallbackQuery = useQuery({
    queryKey: ['properties', 'homepage-fallback'],
    queryFn: () => propertiesApi.search({ page: 1, limit: 6 }),
    enabled: homepageQuery.isSuccess && curatedProperties.length === 0,
  });

  const content = homepageQuery.data?.content;
  const siteImages = homepageQuery.data?.siteImages;
  const displayedProperties = curatedProperties.length > 0 ? curatedProperties : fallbackQuery.data?.items ?? [];

  const heroImage = siteImages?.homeHero ?? displayedProperties[0]?.images[0];
  const valuePropImage = siteImages?.valuePropImage;
  const heroSpacing = useSectionSpacingClass('homeHero');
  const discoverySpacing = useSectionSpacingClass('homeDiscovery');
  const valuePropSpacing = useSectionSpacingClass('homeValueProp');

  return (
    <div className="marketing-page">
      <section className={`hero ${heroSpacing}`}>
        <div className="hero__content">
          <span className="hero__eyebrow">{content?.heroEyebrow ?? DEFAULT_HOMEPAGE_CONTENT.heroEyebrow}</span>
          <h1 className="hero__title">
            {content?.heroTitle ?? DEFAULT_HOMEPAGE_CONTENT.heroTitle}
            <span className="hero__title-accent">
              {content?.heroTitleAccent ?? DEFAULT_HOMEPAGE_CONTENT.heroTitleAccent}
            </span>
          </h1>
          <p className="hero__subtitle">{content?.heroSubtitle ?? DEFAULT_HOMEPAGE_CONTENT.heroSubtitle}</p>

          <SearchBar className="hero__search-mobile" />

          <div className="hero__ctas">
            <Link to="/properties" className="button button--lg">
              Explore Properties
            </Link>
            <a href="/contact" className="button button--outline button--lg">
              Schedule Consultation
            </a>
          </div>

          <div className="hero__stats">
            {(content?.trustStats ?? DEFAULT_HOMEPAGE_CONTENT.trustStats).map((stat) => (
              <div className="hero__stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero__media">
          <div className="hero__media-frame">
            {heroImage && <img src={`${apiBaseUrl()}${heroImage}`} alt="Featured signature estate" />}
          </div>
          <div className="hero__badge">
            <span>Verified</span>
            <strong>Hosts</strong>
          </div>
        </div>
      </section>

      {displayedProperties.length > 0 && (
        <section className={`discovery-section ${discoverySpacing}`} id="discovery">
          <div className="discovery">
            <p className="discovery-header__eyebrow">
              — {content?.discoveryEyebrow ?? DEFAULT_HOMEPAGE_CONTENT.discoveryEyebrow}
            </p>
            <div className="discovery-header">
              <h2>{content?.discoveryTitle ?? DEFAULT_HOMEPAGE_CONTENT.discoveryTitle}</h2>
              <Link to="/properties" className="discovery-header__all">
                View All Listings
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
            <p className="discovery-header__subtitle">
              {content?.discoverySubtitle ?? DEFAULT_HOMEPAGE_CONTENT.discoverySubtitle}
            </p>

            <div className="property-grid property-grid--static">
              {displayedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={`value-prop ${valuePropSpacing}`}>
        <div className="value-prop__inner">
          <div className="value-prop__heading">
            <span className="value-prop__eyebrow">
              {content?.valuePropEyebrow ?? DEFAULT_HOMEPAGE_CONTENT.valuePropEyebrow}
            </span>
            <h2 className="value-prop__title">
              {content?.valuePropTitle ?? DEFAULT_HOMEPAGE_CONTENT.valuePropTitle}
              <br />
              <span className="value-prop__title-accent">
                {content?.valuePropTitleAccent ?? DEFAULT_HOMEPAGE_CONTENT.valuePropTitleAccent}
              </span>
            </h2>
          </div>

          <div className="value-prop__copy-grid">
            <p className="value-prop__copy value-prop__copy--card">
              {content?.valuePropCopy1 ?? DEFAULT_HOMEPAGE_CONTENT.valuePropCopy1}
            </p>
            <p className="value-prop__copy value-prop__copy--card">
              {content?.valuePropCopy2 ?? DEFAULT_HOMEPAGE_CONTENT.valuePropCopy2}
            </p>
          </div>

          {valuePropImage && (
            <img
              src={`${apiBaseUrl()}${valuePropImage}`}
              alt="Property stewardship"
              className="value-prop__image"
            />
          )}

          <div className="value-prop__steps">
            <div className="value-prop__steps-track">
              {(content?.valueSteps ?? DEFAULT_HOMEPAGE_CONTENT.valueSteps).map((step) => (
                <div className="value-prop__step" key={step.number}>
                  <div className="value-prop__step-number">{step.number}</div>
                  <h3 className="value-prop__step-title">{step.title}</h3>
                  <p className="value-prop__step-copy">{step.copy}</p>
                </div>
              ))}
              {/* Duplicate set, hidden from assistive tech - only shown on mobile to
                  give the auto-scrolling carousel a seamless loop back to the start. */}
              {(content?.valueSteps ?? DEFAULT_HOMEPAGE_CONTENT.valueSteps).map((step) => (
                <div className="value-prop__step" key={`${step.number}-dup`} aria-hidden="true">
                  <div className="value-prop__step-number">{step.number}</div>
                  <h3 className="value-prop__step-title">{step.title}</h3>
                  <p className="value-prop__step-copy">{step.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
