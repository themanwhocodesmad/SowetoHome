import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';

export function AdminHostApplicationsPage() {
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['admin', 'host-applications'],
    queryFn: () => adminApi.listHostApplications(1, 50),
  });

  const review = async (id: string, approve: boolean) => {
    setError(null);
    setReviewingId(id);
    try {
      await adminApi.reviewHostApplication(id, { approve });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'host-applications'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not review application');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <DashboardLayout title="Host applications" navItems={ADMIN_NAV_ITEMS}>
      <div className="section-head">
        <h2>Pending host applications</h2>
      </div>

      {isLoading && <p>Loading...</p>}
      {loadError && <p className="error">Could not load applications.</p>}
      {error && <p className="error">{error}</p>}

      {data && data.items.length === 0 && <p>No pending applications.</p>}

      {data && data.items.length > 0 && (
        <div className="panel panel--flush">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Applied</th>
                <th>Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.hostApplication
                      ? new Date(user.hostApplication.appliedAt).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="applications__message">{user.hostApplication?.message ?? '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        disabled={reviewingId === user.id}
                        onClick={() => void review(user.id, true)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button--outline"
                        disabled={reviewingId === user.id}
                        onClick={() => void review(user.id, false)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
