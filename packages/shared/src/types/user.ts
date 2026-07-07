import type { Role } from '../constants/roles.js';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: Role[];
  phone?: string;
  isSuspended: boolean;
  hostRatingAvg: number;
  hostRatingCount: number;
  guestRatingAvg: number;
  guestRatingCount: number;
  createdAt: string;
}
