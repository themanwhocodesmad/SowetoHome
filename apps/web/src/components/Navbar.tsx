import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { googleLoginUrl } from '../api/auth.js';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        <svg viewBox="0 0 32 32">
          <path fill="currentColor" d="M16 2C10 9 4 15.5 4 21a12 12 0 0 0 24 0c0-5.5-6-12-12-19Z" />
        </svg>
        Book<span>My</span>Stay
      </Link>
      <nav className="navbar__links">
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
        {user && !user.roles.includes('host') && <Link to="/become-host">Become a host</Link>}
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
