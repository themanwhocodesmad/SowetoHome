import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../../api/bookings.js';

export function MyBookingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings', 'mine', 'guest'],
    queryFn: bookingsApi.listMineAsGuest,
  });

  if (isLoading) return <p>Loading your bookings...</p>;
  if (error) return <p className="error">Could not load your bookings.</p>;

  return (
    <div>
      <h1>My bookings</h1>
      {data?.length === 0 && <p>You haven't booked a stay yet.</p>}
      <ul className="booking-list">
        {data?.map((booking) => (
          <li key={booking.id}>
            <Link to={`/bookings/${booking.id}`}>
              {new Date(booking.checkIn).toLocaleDateString()} -{' '}
              {new Date(booking.checkOut).toLocaleDateString()} - {booking.bookingStatus}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
