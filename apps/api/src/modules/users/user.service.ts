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
    hostApplication: user.hostApplication
      ? {
          status: user.hostApplication.status,
          message: user.hostApplication.message,
          appliedAt: user.hostApplication.appliedAt.toISOString(),
          reviewedAt: user.hostApplication.reviewedAt?.toISOString(),
        }
      : undefined,
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

  // A guest applies to become a host; the role is only added once an admin approves the
  // application (still a single account with multiple roles - see claude_plan.md §2).
  async applyToHost(userId: string, message?: string): Promise<UserDocument> {
    const user = await this.getById(userId);
    if (user.roles.includes('host')) throw AppError.badRequest('You are already a host');
    if (user.hostApplication?.status === 'pending') {
      throw AppError.badRequest('Your host application is already pending review');
    }
    user.hostApplication = { status: 'pending', message, appliedAt: new Date() };
    return userRepository.save(user);
  },

  // Direct grant, bypassing the application flow - used when an admin creates a listing
  // on behalf of a user, which is an implicit approval.
  async grantHostRole(userId: string): Promise<UserDocument> {
    const user = await this.getById(userId);
    if (!user.roles.includes('host')) {
      user.roles = [...user.roles, 'host'];
      await userRepository.save(user);
    }
    return user;
  },

  async reviewHostApplication(userId: string, approve: boolean): Promise<UserDocument> {
    const user = await this.getById(userId);
    if (user.hostApplication?.status !== 'pending') {
      throw AppError.badRequest('User has no pending host application');
    }
    user.hostApplication.status = approve ? 'approved' : 'rejected';
    user.hostApplication.reviewedAt = new Date();
    if (approve && !user.roles.includes('host')) {
      user.roles = [...user.roles, 'host'];
    }
    user.markModified('hostApplication');
    return userRepository.save(user);
  },

  async listHostApplications(status: string, page: number, limit: number) {
    return userRepository.listByHostApplicationStatus(status, page, limit);
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
