import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { payoutsApi } from '../../api/payouts.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';
import { pillClass } from '../../components/pillVariant.js';

export function AdminPayoutsPage() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'payouts', statusFilter],
    queryFn: () => payoutsApi.listForAdmin(1, 50, statusFilter || undefined),
  });

  const markPaid = async (id: string) => {
    await payoutsApi.markPaid(id, {});
    await queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
  };

  return (
    <DashboardLayout title="Payouts" navItems={ADMIN_NAV_ITEMS}>
      <div className="section-head">
        <h2>Host payouts</h2>
      </div>
      <p className="property-card__sub">
        PayFast has no marketplace payout API, so sending a host their share means doing a real bank EFT
        yourself, then marking it paid here.
      </p>

      <label style={{ maxWidth: 240 }}>
        Filter by status
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      </label>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Could not load payouts.</p>}

      <div className="panel panel--flush">
        <table>
          <thead>
            <tr>
              <th>Host</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((payout) => (
              <tr key={payout.id}>
                <td>{payout.hostId}</td>
                <td>R{payout.amount.toFixed(2)}</td>
                <td>
                  <span className={pillClass(payout.status)}>{payout.status}</span>
                </td>
                <td>
                  {payout.status === 'pending' && (
                    <button type="button" onClick={() => void markPaid(payout.id)}>
                      Mark as paid (after sending EFT)
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
