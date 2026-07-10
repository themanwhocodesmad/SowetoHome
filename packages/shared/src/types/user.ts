import type { Role } from '../constants/roles.js';
import type { HostApplicationStatus } from '../constants/enums.js';

export interface HostApplicationDto {
  status: HostApplicationStatus;
  message?: string;
  appliedAt: string;
  reviewedAt?: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: Role[];
  phone?: string;
  isSuspended: boolean;
  hostApplication?: HostApplicationDto;
  hostRatingAvg: number;
  hostRatingCount: number;
  guestRatingAvg: number;
  guestRatingCount: number;
  createdAt: string;
}
