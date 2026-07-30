import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { PROVINCES } from '@soweto-stays/shared';
import { propertiesApi } from '../api/properties.js';
import { PropertyCard } from '../components/PropertyCard.js';
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

export function PropertiesPage() {
  const [searchParams] = useSearchParams();
  const city = searchParams.get('city') ?? '';
  const checkIn = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const guests = searchParams.get('guests') ?? '';

  const [discovery, setDiscovery] = useState<DiscoveryFilters>({
    keyword: city,
    priceBandIndex: 0,
    province: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const discoverySpacing = useSectionSpacingClass('homeDiscovery');

  const buildFilters = (overrides: Partial<DiscoveryFilters> = {}) => {
    const next = { ...discovery, ...overrides };
    const band = PRICE_BANDS[next.priceBandIndex];
    return {
      city: next.keyword || undefined,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests: guests ? Number(guests) : undefined,
      minPrice: band?.minPrice,
      maxPrice: band?.maxPrice,
      province: next.province || undefined,
      page: 1,
      limit: 24,
    };
  };

  // Re-applies whenever the URL search changes (a navbar/hero SearchBar submission,
  // back/forward nav, or a shared link landing here with query params already set).
  useEffect(() => {
    setDiscovery((d) => ({ ...d, keyword: city }));
    setAppliedFilters(buildFilters({ keyword: city }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, checkIn, checkOut, guests]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', 'search', appliedFilters],
    queryFn: () => propertiesApi.search(appliedFilters),
  });

  const updateDiscovery = (patch: Partial<DiscoveryFilters>) => {
    const next = { ...discovery, ...patch };
    setDiscovery(next);
    setAppliedFilters(buildFilters(patch));
  };

  const listingItems = data?.items ?? [];
  const listingTotal = data?.total ?? 0;

  return (
    <div className="marketing-page">
      <section className={`discovery-section ${discoverySpacing}`}>
        <div className="discovery">
          <p className="discovery-header__eyebrow">— Find Your Stay</p>
          <div className="discovery-header">
            <h2>Browse all properties</h2>
          </div>
          <p className="discovery-header__subtitle">
            Search by location, price, or region to find a stay that fits your trip.
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

          {isLoading && <p>Loading properties...</p>}
          {error && <p className="error">Could not load properties.</p>}

          {listingTotal > 0 && (
            <p className="results-bar">
              {listingTotal} stay{listingTotal === 1 ? '' : 's'}
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
    </div>
  );
}
