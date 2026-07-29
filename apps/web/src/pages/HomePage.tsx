import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { DEFAULT_HOMEPAGE_CONTENT, PROVINCES } from '@soweto-stays/shared';
import { propertiesApi } from '../api/properties.js';
import { siteContentApi } from '../api/siteContent.js';
import { apiBaseUrl } from '../api/client.js';
import { PropertyCard } from '../components/PropertyCard.js';
import { SearchBar } from '../components/SearchBar.js';
import { useSectionSpacingClass } from '../hooks/useSiteTheme.js';

const PRICE_BANDS = [
  { label: 'All Prices', minPrice: undefined as number | undefined, maxPrice: undefined as number | undefined },
  { label: 'Under R1,000', minPrice: undefined, maxPrice: 1000 },
  { label: 'R1,000 - R2,500', minPrice: 1000, maxPrice: 2500 },
  { label: 'R2,500 - R5,000', minPrice: 2500, maxPrice: 5000 },
  { label: 'R5,000+', minPrice: 5000, maxPrice: undefined },
];

interface DiscoveryFilters {
  keyword: string;
  priceBandIndex: number;
  province: string;
}

function hasActiveSearch(filters: DiscoveryFilters, city: string, checkIn: string, checkOut: string, guests: string) {
  return Boolean(
    filters.keyword ||
      filters.province ||
      filters.priceBandIndex > 0 ||
      city ||
      checkIn ||
      checkOut ||
      guests,
  );
}

export function HomePage() {
  // The primary stay search (Where/Check-in/Check-out/Guests) lives in the URL, not
  // local state - it's edited from the SearchBar component (rendered in the Navbar on
  // desktop, in this hero on mobile - see index.css), which navigates here with the
  // search encoded as query params. That keeps both instances in sync for free and
  // makes a search shareable/bookmarkable.
  const [searchParams] = useSearchParams();
  const city = searchParams.get('city') ?? '';
  const checkIn = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const guests = searchParams.get('guests') ?? '';

  const [discovery, setDiscovery] = useState<DiscoveryFilters>({
    keyword: '',
    priceBandIndex: 0,
    province: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const homepageQuery = useQuery({
    queryKey: ['site-content', 'homepage'],
    queryFn: siteContentApi.getHomepage,
  });

  const buildFilters = (overrides: Partial<DiscoveryFilters> = {}) => {
    const next = { ...discovery, ...overrides };
    const band = PRICE_BANDS[next.priceBandIndex];
    return {
      city: next.keyword || city || undefined,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests: guests ? Number(guests) : undefined,
      minPrice: band?.minPrice,
      maxPrice: band?.maxPrice,
      province: next.province || undefined,
      page: 1,
      limit: 20,
    };
  };

  // Re-applies whenever the URL search changes (a SearchBar submission, back/forward
  // nav, or a shared link landing here with query params already set).
  useEffect(() => {
    setAppliedFilters(buildFilters());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, checkIn, checkOut, guests]);

  const searchActive = hasActiveSearch(discovery, city, checkIn, checkOut, guests);

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', 'search', appliedFilters],
    queryFn: () => propertiesApi.search(appliedFilters),
    enabled: searchActive || !homepageQuery.data?.featuredProperties.length,
  });

  const updateDiscovery = (patch: Partial<DiscoveryFilters>) => {
    const next = { ...discovery, ...patch };
    setDiscovery(next);
    setAppliedFilters(buildFilters(patch));
  };

  const content = homepageQuery.data?.content;
  const siteImages = homepageQuery.data?.siteImages;
  const featuredProperties = homepageQuery.data?.featuredProperties ?? [];
  const listingItems = searchActive ? data?.items ?? [] : featuredProperties.length > 0 ? featuredProperties : data?.items ?? [];
  const listingTotal = searchActive ? data?.total ?? 0 : featuredProperties.length > 0 ? featuredProperties.length : data?.total ?? 0;

  const heroImage = siteImages?.homeHero ?? listingItems[0]?.images[0];
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
            <a href="#discovery" className="button button--lg">
              Explore Properties
            </a>
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

      <section className={`discovery-section ${discoverySpacing}`} id="discovery">
        <div className="discovery">
          <p className="discovery-header__eyebrow">
            — {content?.discoveryEyebrow ?? DEFAULT_HOMEPAGE_CONTENT.discoveryEyebrow}
          </p>
          <div className="discovery-header">
            <h2>{content?.discoveryTitle ?? DEFAULT_HOMEPAGE_CONTENT.discoveryTitle}</h2>
            <Link to="/" className="discovery-header__all">
              View All Listings
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
          <p className="discovery-header__subtitle">
            {content?.discoverySubtitle ?? DEFAULT_HOMEPAGE_CONTENT.discoverySubtitle}
          </p>

          <div className="filter-bar">
            <div className="filter-bar__search">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={discovery.keyword}
                onChange={(e) => updateDiscovery({ keyword: e.target.value })}
                placeholder="Search by name or location"
              />
            </div>
            <div className="filter-bar__dropdowns">
              <select
                value={discovery.priceBandIndex}
                onChange={(e) => updateDiscovery({ priceBandIndex: Number(e.target.value) })}
              >
                {PRICE_BANDS.map((band, index) => (
                  <option key={band.label} value={index}>
                    {band.label}
                  </option>
                ))}
              </select>
              <select value={discovery.province} onChange={(e) => updateDiscovery({ province: e.target.value })}>
                <option value="">All Regions</option>
                {PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {searchActive && isLoading && <p>Loading properties...</p>}
          {searchActive && error && <p className="error">Could not load properties.</p>}
          {homepageQuery.isLoading && !searchActive && featuredProperties.length === 0 && (
            <p>Loading featured stays...</p>
          )}

          {listingTotal > 0 && (
            <p className="results-bar">
              {listingTotal} stay{listingTotal === 1 ? '' : 's'}
              {!searchActive && featuredProperties.length > 0 ? ' (featured)' : ''}
            </p>
          )}

          <div className="property-grid">
            {listingItems.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          {listingItems.length === 0 && !isLoading && <p>No properties match your search yet.</p>}
        </div>
      </section>

      <section className={`value-prop ${valuePropSpacing}`}>
        <div className="value-prop__inner">
          <div className="value-prop__grid">
            <div>
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
            <div>
              <p className="value-prop__copy">{content?.valuePropCopy1 ?? DEFAULT_HOMEPAGE_CONTENT.valuePropCopy1}</p>
              <p className="value-prop__copy">{content?.valuePropCopy2 ?? DEFAULT_HOMEPAGE_CONTENT.valuePropCopy2}</p>
              {valuePropImage && (
                <img
                  src={`${apiBaseUrl()}${valuePropImage}`}
                  alt="Property stewardship"
                  className="value-prop__image"
                />
              )}
            </div>
          </div>

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
