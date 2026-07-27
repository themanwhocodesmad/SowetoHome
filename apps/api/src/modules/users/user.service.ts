import type { UpdateProfileInput, UserDto } from '@soweto-stays/shared';
import { AppError } from '../../common/errors/AppError.js';
import type { UserDocument } from '@soweto-stays/db';
import { enqueueEmail } from '../../common/queue/notify.js';
import { userRepository } from './user.repository.js';

export function toUserDto(user: UserDocument): UserDto {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    phone: user.phone,
    isSuspended: user.isSuspended,
    hostRatingAvg: user.hostRatingAvg,
    hostRatingCount: user.hostRatingCount,
    guestRatingAvg: user.guestRatingAvg,
    guestRatingCount: user.guestRatingCount,
    payoutDetails: user.payoutDetails
      ? {
          bankName: user.payoutDetails.bankName,
          accountNumber: user.payoutDetails.accountNumber,
          accountHolder: user.payoutDetails.accountHolder,
        }
      : undefined,
    createdAt: user.createdAt.toISOString(),
  };
}

export const userService = {
  async findOrCreateFromGoogleProfile(profile: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<UserDocument> {
    const existing = await userRepository.findByGoogleId(profile.googleId);
    if (existing) return existing;
    const user = await userRepository.createFromGoogleProfile(profile);
    await enqueueEmail('welcome', { userId: user._id.toString() });
    return user;
  },

  async getById(id: string): Promise<UserDocument> {
    const user = await userRepository.findById(id);
    if (!user) throw AppError.notFound('User not found');
    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserDocument> {
    const user = await this.getById(userId);
    if (input.name !== undefined) user.name = input.name;
    if (input.phone !== undefined) user.phone = input.phone;
    if (input.payoutDetails !== undefined) {
      if (!user.roles.includes('host')) {
        throw AppError.forbidden('Only hosts can save payout bank details');
      }
      user.payoutDetails = input.payoutDetails;
    }
    return userRepository.save(user);
  },

  // Only an admin can turn a user into a host - there is no self-service application
  // flow. Used directly from the admin Users page, and implicitly when an admin creates
  // a listing on behalf of a user who isn't a host yet.
  async grantHostRole(userId: string): Promise<UserDocument> {
    const user = await this.getById(userId);
    if (!user.roles.includes('host')) {
      user.roles = [...user.roles, 'host'];
      await userRepository.save(user);
    }
    return user;
  },

  async setSuspended(userId: string, isSuspended: boolean): Promise<UserDocument> {
    const user = await this.getById(userId);
    user.isSuspended = isSuspended;
    return userRepository.save(user);
  },

  async listPaginated(page: number, limit: number, role?: string) {
    return userRepository.listPaginated(page, limit, role);
  },
};
