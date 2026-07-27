import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';

// There is no guest-facing "become a host" application anymore - granting the host role
// to an existing account is entirely an admin action, done here.
export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.listUsers(1, 50),
  });

  const toggleSuspend = async (id: string, isSuspended: boolean) => {
    await adminApi.suspendUser(id, { isSuspended: !isSuspended });
    await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const grantHost = async (id: string) => {
    setError(null);
    setGrantingId(id);
    try {
      await adminApi.grantHost(id);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not grant host role');
    } finally {
      setGrantingId(null);
    }
  };

  return (
    <DashboardLayout title="Users" navItems={ADMIN_NAV_ITEMS}>
      <div className="section-head">
        <h2>Users</h2>
      </div>

      {isLoading && <p>Loading...</p>}
      {loadError && <p className="error">Could not load users.</p>}
      {error && <p className="error">{error}</p>}

      <div className="panel panel--flush">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.roles.join(', ')}</td>
                <td>
                  <span className={`pill pill--${user.isSuspended ? 'danger' : 'success'}`}>
                    {user.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td className="table-actions">
                  <button type="button" onClick={() => void toggleSuspend(user.id, user.isSuspended)}>
                    {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                  {!user.roles.includes('host') && (
                    <button
                      type="button"
                      className="button--outline"
                      disabled={grantingId === user.id}
                      onClick={() => void grantHost(user.id)}
                    >
                      {grantingId === user.id ? 'Granting...' : 'Make host'}
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
