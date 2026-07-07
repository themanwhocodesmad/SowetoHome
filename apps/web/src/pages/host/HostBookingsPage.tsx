import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../../api/bookings.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { HOST_NAV_ITEMS } from '../../components/dashboardNav.js';
import { pillClass } from '../../components/pillVariant.js';

export function HostBookingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings', 'mine', 'host'],
    queryFn: bookingsApi.listMineAsHost,
  });

  return (
    <DashboardLayout title="Bookings" navItems={HOST_NAV_ITEMS}>
      <div className="section-head">
        <h2>Bookings for my properties</h2>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Could not load bookings.</p>}
      {data?.length === 0 && <p>No bookings yet.</p>}

      {data && data.length > 0 && (
        <div className="panel panel--flush">
          <table>
            <thead>
              <tr>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Total</th>
                <th>Payout</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <Link to={`/bookings/${booking.id}`}>{new Date(booking.checkIn).toLocaleDateString()}</Link>
                  </td>
                  <td>{new Date(booking.checkOut).toLocaleDateString()}</td>
                  <td>{booking.numGuests}</td>
                  <td>R{booking.totalPrice.toFixed(2)}</td>
                  <td>R{booking.hostPayoutAmount.toFixed(2)}</td>
                  <td>
                    <span className={pillClass(booking.bookingStatus)}>
                      {booking.bookingStatus.replace(/_/g, ' ')}
                    </span>
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
