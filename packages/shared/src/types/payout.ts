import type { PayoutStatus } from '../constants/enums.js';

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
