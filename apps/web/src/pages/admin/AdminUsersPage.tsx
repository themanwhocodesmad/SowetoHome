import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';

export function AdminUsersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.listUsers(1, 50),
  });

  const toggleSuspend = async (id: string, isSuspended: boolean) => {
    await adminApi.suspendUser(id, { isSuspended: !isSuspended });
    await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  return (
    <DashboardLayout title="Users" navItems={ADMIN_NAV_ITEMS}>
      <div className="section-head">
        <h2>Users</h2>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Could not load users.</p>}

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
                <td>
                  <button type="button" onClick={() => void toggleSuspend(user.id, user.isSuspended)}>
                    {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
