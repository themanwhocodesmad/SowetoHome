import type { Role } from '../constants/roles.js';

export interface PayoutDetailsDto {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: Role[];
  phone?: string;
  isSuspended: boolean;
  payoutDetails?: PayoutDetailsDto;
  hostRatingAvg: number;
  hostRatingCount: number;
  guestRatingAvg: number;
  guestRatingCount: number;
  createdAt: string;
}