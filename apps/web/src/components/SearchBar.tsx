import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function toDateInputValue(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

// Rendered in two places (Navbar on desktop, the homepage hero on mobile) so the
// primary stay search is always reachable regardless of screen size - see
// index.css for which one is visible at a given breakpoint. Submitting always
// navigates to "/" with the search encoded in the URL, which is what HomePage
// reads to build its property query, so either instance works identically and
// a search is shareable/bookmarkable.
export function SearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [checkIn, setCheckIn] = useState(toDateInputValue(searchParams.get('checkIn')));
  const [checkOut, setCheckOut] = useState(toDateInputValue(searchParams.get('checkOut')));
  const [guests, setGuests] = useState(searchParams.get('guests') ?? '');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (checkIn) params.set('checkIn', new Date(checkIn).toISOString());
    if (checkOut) params.set('checkOut', new Date(checkOut).toISOString());
    if (guests) params.set('guests', guests);
    navigate(`/?${params.toString()}`);
  };

  return (
    <div className={`search-pill${className ? ` ${className}` : ''}`}>
      <label>
        <span>Where</span>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Cape Town, Kruger, Garden Route..."
        />
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
  );
}
