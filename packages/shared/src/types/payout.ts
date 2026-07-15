import type { PayoutStatus } from '../constants/enums.js';
import type { PayoutDetailsDto } from './user.js';

export interface PayoutDto {
  id: string;
  hostId: string;
  bookingId: string;
  amount: number;
  status: PayoutStatus;
  method: 'manual_eft';
  paidAt?: string;
  paidBy?: string;
  notes?: string;
  createdAt: string;
}

export interface AdminPayoutDto extends PayoutDto {
  hostName: string;
  hostEmail: string;
  hostPayoutDetails?: PayoutDetailsDto;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
}