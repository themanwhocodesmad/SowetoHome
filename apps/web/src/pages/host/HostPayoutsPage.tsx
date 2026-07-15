import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { payoutsApi } from '../../api/payouts.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { HOST_NAV_ITEMS } from '../../components/dashboardNav.js';
import { pillClass } from '../../components/pillVariant.js';

export function HostPayoutsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['payouts', 'mine'],
    queryFn: payoutsApi.listMine,
  });

  return (
    <DashboardLayout title="Payouts" navItems={HOST_NAV_ITEMS}>
      <div className="section-head">
        <h2>My payouts</h2>
      </div>
      <p className="property-card__sub">
        Payouts are sent by an admin via manual EFT once a booking is confirmed.{' '}
        <Link to="/host/payment-details">Add your bank details</Link> so they know where to pay you.
      </p>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Could not load payouts.</p>}
      {data?.length === 0 && <p>No payouts yet.</p>}

      {data && data.length > 0 && (
        <div className="panel panel--flush">
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid at</th>
              </tr>
            </thead>
            <tbody>
              {data.map((payout) => (
                <tr key={payout.id}>
                  <td>R{payout.amount.toFixed(2)}</td>
                  <td>
                    <span className={pillClass(payout.status)}>{payout.status}</span>
                  </td>
                  <td>{payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
