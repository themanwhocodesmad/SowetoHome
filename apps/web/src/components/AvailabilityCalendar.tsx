import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BookedRangeDto } from '@soweto-stays/shared';
import { propertiesApi } from '../api/properties.js';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_FORMAT = new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' });

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isDateBooked(date: Date, ranges: BookedRangeDto[]): boolean {
  const t = date.getTime();
  return ranges.some((r) => t >= new Date(r.checkIn).setHours(0, 0, 0, 0) && t < new Date(r.checkOut).setHours(0, 0, 0, 0));
}

// Read-only visual month calendar showing which nights are already booked, so a guest can
// see availability at a glance before picking dates in the booking form above - the form's
// native date inputs don't otherwise convey that. Public endpoint (see
// property.routes.ts's /:id/booked-ranges), so this works even for a signed-out visitor.
export function AvailabilityCalendar({ propertyId }: { propertyId: string }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const rangesQuery = useQuery({
    queryKey: ['properties', propertyId, 'booked-ranges'],
    queryFn: () => propertiesApi.getBookedRanges(propertyId),
  });

  const today = useMemo(() => startOfDay(new Date()), []);
  const viewedMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset],
  );

  const weeks = useMemo(() => {
    const firstOfMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth(), 1);
    const daysInMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 0).getDate();
    const leadingBlanks = firstOfMonth.getDay();

    const cells: Array<Date | null> = [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewedMonth.getFullYear(), viewedMonth.getMonth(), i + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: Array<Array<Date | null>> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewedMonth]);

  const ranges = rangesQuery.data ?? [];

  return (
    <div className="availability-calendar panel">
      <div className="availability-calendar__header">
        <h3>When are you arriving?</h3>
        <div className="availability-calendar__nav">
          <button
            type="button"
            aria-label="Previous month"
            disabled={monthOffset === 0}
            onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <span>{MONTH_FORMAT.format(viewedMonth)}</span>
          <button type="button" aria-label="Next month" onClick={() => setMonthOffset((m) => m + 1)}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>

      {rangesQuery.isLoading ? (
        <p>Loading availability...</p>
      ) : (
        <>
          <table className="availability-calendar__grid">
            <thead>
              <tr>
                {WEEKDAY_LABELS.map((label, i) => (
                  <th key={i}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, i) => (
                <tr key={i}>
                  {week.map((date, j) => {
                    if (!date) return <td key={j} />;
                    const past = date.getTime() < today.getTime();
                    const booked = !past && isDateBooked(date, ranges);
                    const className = past
                      ? 'availability-calendar__day is-past'
                      : booked
                        ? 'availability-calendar__day is-booked'
                        : 'availability-calendar__day is-available';
                    return (
                      <td key={j}>
                        <span className={className}>{date.getDate()}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="availability-calendar__legend">
            <span><i className="availability-calendar__swatch is-available" /> Available</span>
            <span><i className="availability-calendar__swatch is-booked" /> Unavailable</span>
          </div>
        </>
      )}
    </div>
  );
}
