import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PROVINCES } from '@soweto-stays/shared';
import { propertiesApi } from '../api/properties.js';
import { siteContentApi } from '../api/siteContent.js';
import { apiBaseUrl } from '../api/client.js';
import { PropertyCard } from '../components/PropertyCard.js';

const PRICE_BANDS = [
  { label: 'All Prices', minPrice: undefined as number | undefined, maxPrice: undefined as number | undefined },
  { label: 'Under R1,000', minPrice: undefined, maxPrice: 1000 },
  { label: 'R1,000 - R2,500', minPrice: 1000, maxPrice: 2500 },
  { label: 'R2,500 - R5,000', minPrice: 2500, maxPrice: 5000 },
  { label: 'R5,000+', minPrice: 5000, maxPrice: undefined },
];

const TRUST_STATS = [
  { value: '12K+', label: 'Properties Managed' },
  { value: '98%', label: 'Client Retention' },
  { value: 'R4.2B', label: 'Portfolio Value' },
];

const VALUE_STEPS = [
  {
    number: '01',
    title: 'Stay Strategy',
    copy: 'We match every guest with a signature estate tailored to the occasion, from weekend escapes to extended corporate stays.',
  },
  {
    number: '02',
    title: 'Acquisition & Handover',
    copy: 'Our advisory team manages onboarding, styling, and a seamless handover, so every property is booking-ready from day one.',
  },
  {
    number: '03',
    title: 'Asset Management',
    copy: 'Ongoing stewardship keeps each estate performing, from guest relations to maintenance and revenue optimisation.',
  },
];

interface DiscoveryFilters {
  keyword: string;
  priceBandIndex: number;
  province: string;
}

export function HomePage() {
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [discovery, setDiscovery] = useState<DiscoveryFilters>({
    keyword: '',
    priceBandIndex: 0,
    province: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const buildFilters = (overrides: Partial<DiscoveryFilters> = {}) => {
    const next = { ...discovery, ...overrides };
    const band = PRICE_BANDS[next.priceBandIndex];
    return {
      city: next.keyword || city || undefined,
      checkIn: checkIn ? new Date(checkIn).toISOString() : undefined,
      checkOut: checkOut ? new Date(checkOut).toISOString() : undefined,
      guests: guests ? Number(guests) : undefined,
      minPrice: band?.minPrice,
      maxPrice: band?.maxPrice,
      province: next.province || undefined,
      page: 1,
      limit: 20,
    };
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', 'search', appliedFilters],
    queryFn: () => propertiesApi.search(appliedFilters),
  });

  const { data: siteImages } = useQuery({
    queryKey: ['site-content', 'images'],
    queryFn: siteContentApi.getImages,
  });

  const handleSearch = () => setAppliedFilters(buildFilters());

  const updateDiscovery = (patch: Partial<DiscoveryFilters>) => {
    const next = { ...discovery, ...patch };
    setDiscovery(next);
    setAppliedFilters(buildFilters(patch));
  };

  // Admin-uploaded photo (see /admin/site-images) takes priority; falls back to the first
  // listing's photo so the hero still shows something before one is uploaded.
  const heroImage = siteImages?.homeHero ?? data?.items[0]?.images[0];

  return (
    <div className="marketing-page">
      <section className="hero">
        <div className="hero__content">
          <span className="hero__eyebrow">Premium Vacation &amp; Boutique Stays</span>
          <h1 className="hero__title">
            Elevating the standard of <span className="hero__title-accent">modern stays</span>
          </h1>
          <p className="hero__subtitle">
            Discover signature estates and boutique properties, curated and managed end-to-end by
            BookMyStay&rsquo;s advisory team &mdash; from first search to seamless check-in.
          </p>

          <div className="search-pill">
            <label>
              <span>Where</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Soweto" />
            </label>
            <label>
              <span>Check in</span>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </label>
            <label>
              <span>Check out</span>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </label>
            <label>
              <span>Guests</span>
              <input type="number" min={1} value={guests} onChange={(e) => setGuests(e.target.value)} />
            </label>
            <button type="button" onClick={handleSearch} aria-label="Search">
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="white" strokeWidth="2" fill="none">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>

          <div className="hero__ctas">
            <a href="#discovery" className="button button--lg">
              Explore Properties
            </a>
            <a href="/contact" className="button button--outline button--lg">
              Schedule Consultation
            </a>
          </div>
        </div>

        <div className="hero__media">
          <div className="hero__media-frame">
            {heroImage && <img src={`${apiBaseUrl()}${heroImage}`} alt="Featured signature estate" />}
          </div>
          <div className="hero__badge">
            <span>Est.</span>
            <strong>2026</strong>
          </div>
        </div>
      </section>

      <div className="hero__stats">
        {TRUST_STATS.map((stat) => (
          <div className="hero__stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      <section className="discovery" id="discovery">
        <div className="discovery-header">
          <div>
            <h2>Featured Signature Estates</h2>
            <p>Hand-picked stays available for booking right now.</p>
          </div>
          <div className="filter-bar">
            <input
              type="text"
              value={discovery.keyword}
              onChange={(e) => updateDiscovery({ keyword: e.target.value })}
              placeholder="Search by city or suburb"
            />
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

        {isLoading && <p>Loading properties...</p>}
        {error && <p className="error">Could not load properties.</p>}

        {data && (
          <p className="results-bar">
            {data.total} stay{data.total === 1 ? '' : 's'}
          </p>
        )}

        <div className="property-grid">
          {data?.items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        {data && data.items.length === 0 && <p>No properties match your search yet.</p>}
      </section>

      <section className="value-prop">
        <div className="value-prop__inner">
          <div className="value-prop__grid">
            <div>
              <span className="value-prop__eyebrow">Strategic Asset Stewardship</span>
              <h2 className="value-prop__title">
                A hands-on approach to every guest stay and every property we manage
              </h2>
            </div>
            <div>
              <p className="value-prop__copy">
                Guests get a consistent, concierge-level experience across every stay we list, while
                owners get an advisory partner who treats their property like an asset, not just a
                listing.
              </p>
              <p className="value-prop__copy">
                From onboarding through day-to-day operations, our team handles the details so
                properties perform and guests keep coming back.
              </p>
            </div>
          </div>

          <div className="value-prop__steps">
            {VALUE_STEPS.map((step) => (
              <div className="value-prop__step" key={step.number}>
                <div className="value-prop__step-number">{step.number}</div>
                <h3 className="value-prop__step-title">{step.title}</h3>
                <p className="value-prop__step-copy">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
