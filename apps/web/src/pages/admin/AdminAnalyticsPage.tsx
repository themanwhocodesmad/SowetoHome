import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';

export function AdminAnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: adminApi.getAnalytics,
  });

  return (
    <DashboardLayout title="Analytics" navItems={ADMIN_NAV_ITEMS}>
      <div className="section-head">
        <h2>Platform analytics</h2>
      </div>

      {isLoading && <p>Loading...</p>}
      {(error || (!isLoading && !data)) && <p className="error">Could not load analytics.</p>}

      {data && (
        <div className="stat-grid">
          <div className="stat-tile">
            <span>Total bookings</span>
            <strong>{data.totalBookings}</strong>
          </div>
          <div className="stat-tile">
            <span>Confirmed bookings</span>
            <strong>{data.confirmedBookings}</strong>
          </div>
          <div className="stat-tile">
            <span>Cancelled bookings</span>
            <strong>{data.cancelledBookings}</strong>
          </div>
          <div className="stat-tile">
            <span>Total revenue</span>
            <strong>R{data.totalRevenue.toFixed(2)}</strong>
          </div>
          <div className="stat-tile">
            <span>Total admin fees</span>
            <strong>R{data.totalAdminFees.toFixed(2)}</strong>
          </div>
          <div className="stat-tile">
            <span>Total host payouts</span>
            <strong>R{data.totalHostPayouts.toFixed(2)}</strong>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
