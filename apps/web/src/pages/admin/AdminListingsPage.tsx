import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PropertyStatus } from '@soweto-stays/shared';
import { adminApi } from '../../api/admin.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';
import { pillClass } from '../../components/pillVariant.js';

const STATUSES: PropertyStatus[] = ['draft', 'pending_review', 'published', 'suspended'];

export function AdminListingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'properties', statusFilter],
    queryFn: () => adminApi.listProperties(1, 50, statusFilter || undefined),
  });

  const moderate = async (id: string, status: PropertyStatus) => {
    await adminApi.moderateProperty(id, { status });
    await queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
  };

  return (
    <DashboardLayout title="Listings" navItems={ADMIN_NAV_ITEMS}>
      <div className="section-head">
        <h2>All listings</h2>
        <Link to="/admin/listings/new" className="button">
          + Create listing for a host
        </Link>
      </div>

      <label style={{ maxWidth: 240 }}>
        Filter by status
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Could not load listings.</p>}

      <div className="panel panel--flush">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Host</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((property) => (
              <tr key={property.id}>
                <td>
                  <Link to={`/properties/${property.id}`}>{property.title}</Link>
                </td>
                <td>{property.hostId}</td>
                <td>
                  <span className={pillClass(property.status)}>{property.status}</span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {property.status !== 'published' && (
                    <button type="button" onClick={() => void moderate(property.id, 'published')}>
                      Approve
                    </button>
                  )}{' '}
                  {property.status !== 'suspended' && (
                    <button type="button" onClick={() => void moderate(property.id, 'suspended')}>
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
