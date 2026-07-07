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
    if (input.payoutDetails !== undefined) user.payoutDetails = input.payoutDetails;
    return userRepository.save(user);
  },

  // A guest becomes a host by adding the role to their existing account, rather than
  // creating a second account - see claude_plan.md §2 (single account, multiple roles).
  async addHostRole(userId: string): Promise<UserDocument> {
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

  async listPaginated(page: number, limit: number) {
    return userRepository.listPaginated(page, limit);
  },
};
