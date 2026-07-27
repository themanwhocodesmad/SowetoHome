import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Collapse the mobile menu automatically whenever the route changes (link click,
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
          Book<span>My</span>Stay
        </Link>
        <button
          type="button"
          className="navbar__toggle"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {isMenuOpen ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
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
