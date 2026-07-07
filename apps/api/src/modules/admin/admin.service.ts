import type { AdminAnalyticsDto } from '@soweto-stays/shared';
import { BookingModel } from '@soweto-stays/db';

export const adminService = {
  async getAnalytics(): Promise<AdminAnalyticsDto> {
    const [totals] = await BookingModel.aggregate<AdminAnalyticsDto>([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $in: ['$bookingStatus', ['confirmed', 'completed']] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: {
              $cond: [
                { $in: ['$bookingStatus', ['cancelled_by_guest', 'cancelled_by_host']] },
                1,
                0,
              ],
            },
          },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0] } },
          totalAdminFees: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$adminFeeAmount', 0] },
          },
          totalHostPayouts: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$hostPayoutAmount', 0] },
          },
        },
      },
    ]);

    return {
      totalBookings: totals?.totalBookings ?? 0,
      confirmedBookings: totals?.confirmedBookings ?? 0,
      cancelledBookings: totals?.cancelledBookings ?? 0,
      totalRevenue: totals?.totalRevenue ?? 0,
      totalAdminFees: totals?.totalAdminFees ?? 0,
      totalHostPayouts: totals?.totalHostPayouts ?? 0,
    };
  },
};
