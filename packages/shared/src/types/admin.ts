export interface AdminAnalyticsDto {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalAdminFees: number;
  totalHostPayouts: number;
}

export interface PlatformSettingsDto {
  adminFeePercent: number;
  cancellationFreeWindowHours: number;
}
