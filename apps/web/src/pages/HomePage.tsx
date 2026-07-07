import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '../api/properties.js';
import { PropertyCard } from '../components/PropertyCard.js';

export function HomePage() {
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', 'search', appliedFilters],
    queryFn: () => propertiesApi.search(appliedFilters),
  });

  const handleSearch = () => {
    setAppliedFilters({
      city: city || undefined,
      checkIn: checkIn ? new Date(checkIn).toISOString() : undefined,
      checkOut: checkOut ? new Date(checkOut).toISOString() : undefined,
      guests: guests ? Number(guests) : undefined,
      page: 1,
      limit: 20,
    });
  };

  return (
    <div>
      <h1>Find your next stay</h1>
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
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="white" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
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
    </div>
  );
}
