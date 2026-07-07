import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';

interface DashboardNavItem {
  to: string;
  label: string;
}

interface DashboardLayoutProps {
  title: string;
  navItems: DashboardNavItem[];
  children: ReactNode;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function DashboardLayout({ title, navItems, children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="dash-layout">
      <aside className="sidebar">
        <Link to="/" className="navbar__brand">
          <svg viewBox="0 0 32 32">
            <path fill="currentColor" d="M16 2C10 9 4 15.5 4 21a12 12 0 0 0 24 0c0-5.5-6-12-12-19Z" />
          </svg>
          Soweto Stays
        </Link>

        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className={location.pathname === item.to ? 'active' : ''}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-foot">
          <Link to="/">← Back to Soweto Stays</Link>
        </div>
      </aside>

      <div className="dash-main">
        <div className="dash-topbar">
          <h1>{title}</h1>
          {user && (
            <div className="owner-chip">
              <div>
                {user.name}
                <span className="sub">{user.roles.join(', ')}</span>
              </div>
              <div className="avatar">{initials(user.name)}</div>
            </div>
          )}
        </div>
        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
}
