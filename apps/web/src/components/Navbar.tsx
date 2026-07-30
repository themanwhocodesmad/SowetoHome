import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { SearchBar } from './SearchBar.js';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Collapse the menu automatically whenever the route changes (link click,
  // back/forward nav, programmatic navigate) rather than requiring an explicit close.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="navbar">
      <div className="navbar__bar">
        <Link to="/" className="navbar__brand">
          <svg viewBox="0 0 32 32">
            <path fill="currentColor" d="M16 2C10 9 4 15.5 4 21a12 12 0 0 0 24 0c0-5.5-6-12-12-19Z" />
          </svg>
          Book<span>My</span>StaySA
        </Link>

        <Link to="/" className="navbar__icon-btn navbar__home-btn" aria-label="Home">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11.5 12 4l9 7.5" />
            <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
          </svg>
        </Link>

        {/* Hidden on narrow screens - the same search lives in the hero there instead. */}
        <SearchBar className="navbar__search" />

        <div className="navbar__actions">
          <button
            type="button"
            className="navbar__icon-btn"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isMenuOpen ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
          <button
            type="button"
            className="navbar__icon-btn navbar__icon-btn--account"
            aria-label={user ? `Account menu for ${user.name}` : 'Account menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {user ? initials(user.name) : (
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <nav className={`navbar__links${isMenuOpen ? ' navbar__links--open' : ''}`}>
        <Link to="/">Properties</Link>
        <Link to="/services">Services</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        {user?.roles.includes('host') && (
          <>
            <Link to="/host/listings">My Listings</Link>
            <Link to="/host/bookings">Host Bookings</Link>
            <Link to="/host/payouts">Payouts</Link>
          </>
        )}
        {user?.roles.includes('admin') && (
          <>
            <Link to="/admin/listings">Listings</Link>
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/payouts">Payouts</Link>
            <Link to="/admin/analytics">Analytics</Link>
            <Link to="/admin/settings">Settings</Link>
          </>
        )}
        {user && <Link to="/bookings">My Bookings</Link>}
        {user ? (
          <button
            type="button"
            onClick={() => {
              void logout().then(() => navigate('/'));
            }}
          >
            Log out ({user.name})
          </button>
        ) : (
          <Link to="/login" className="button">
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
