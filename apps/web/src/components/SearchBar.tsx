import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { openDatePicker } from '../utils/openDatePicker.js';

function toDateInputValue(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

// Rendered in two places (Navbar on desktop, the homepage hero on mobile) so the
// primary stay search is always reachable regardless of screen size - see
// index.css for which one is visible at a given breakpoint. Submitting always
// navigates to "/properties" with the search encoded in the URL, which is what
// PropertiesPage reads to build its property query, so either instance works
// identically and a search is shareable/bookmarkable.
export function SearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [checkIn, setCheckIn] = useState(toDateInputValue(searchParams.get('checkIn')));
  const [checkOut, setCheckOut] = useState(toDateInputValue(searchParams.get('checkOut')));
  const [guests, setGuests] = useState(searchParams.get('guests') ?? '');

  // Keep this instance's fields in sync when the URL changes from elsewhere
  // (the other SearchBar instance submitting, browser back/forward, a shared
  // link) rather than only reading the URL once on mount.
  useEffect(() => {
    setCity(searchParams.get('city') ?? '');
    setCheckIn(toDateInputValue(searchParams.get('checkIn')));
    setCheckOut(toDateInputValue(searchParams.get('checkOut')));
    setGuests(searchParams.get('guests') ?? '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (checkIn) params.set('checkIn', new Date(checkIn).toISOString());
    if (checkOut) params.set('checkOut', new Date(checkOut).toISOString());
    if (guests) params.set('guests', guests);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <form className={`search-pill${className ? ` ${className}` : ''}`} onSubmit={handleSearch}>
      <label>
        <span>Where</span>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Cape Town, Kruger, Garden Route..."
        />
        <Chevron />
      </label>
      {/* Grouped so the stacked mobile-card variant (see .hero__search-mobile in
          index.css) can render "Check-in — Check-out" as one row, matching the
          reference design, while desktop keeps its existing single-row look
          unchanged (the group is just two adjacent flex items there too). */}
      <div className="search-pill__dates">
        <label>
          <span>Check in</span>
          <CalendarIcon />
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            onClick={openDatePicker}
            onFocus={openDatePicker}
          />
        </label>
        <span className="search-pill__dash" aria-hidden="true">–</span>
        <label>
          <span>Check out</span>
          <CalendarIcon />
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            onClick={openDatePicker}
            onFocus={openDatePicker}
          />
        </label>
      </div>
      <label>
        <span>Guests</span>
        <GuestIcon />
        <input type="number" min={1} value={guests} onChange={(e) => setGuests(e.target.value)} />
        <Chevron />
      </label>
      <button type="submit" aria-label="Search">
        <svg className="search-pill__search-icon" viewBox="0 0 24 24" width="15" height="15" stroke="white" strokeWidth="2" fill="none">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="search-pill__cta-label">Find your escape</span>
      </button>
    </form>
  );
}

// Purely decorative - the fields underneath are still plain inputs, these just echo the
// chevron/calendar/person icons from the reference design so the pill reads the same way at
// a glance. Hidden by default, shown only where index.css opts a variant in (currently just
// the navbar's desktop instance) so the already-approved stacked mobile card stays as-is.
function Chevron() {
  return (
    <svg className="search-pill__chevron" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="search-pill__cal-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function GuestIcon() {
  return (
    <svg className="search-pill__guest-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
