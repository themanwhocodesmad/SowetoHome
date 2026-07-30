import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { RegisterInput, UpdateProfileInput, UserDto } from '@soweto-stays/shared';
import { AppError } from '../../common/errors/AppError.js';
import type { UserDocument } from '@soweto-stays/db';
import { env } from '../../common/config/env.js';
import { logger } from '../../common/logger.js';
import { enqueueEmail } from '../../common/queue/notify.js';
import { userRepository } from './user.repository.js';

const PASSWORD_HASH_ROUNDS = 12;
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Best-effort: a welcome email is a nice-to-have, not something a signup should ever
// fail or hang on if the queue/Redis is briefly unavailable.
function enqueueWelcomeEmail(userId: string): void {
  void enqueueEmail('welcome', { userId }).catch((err) => {
    logger.warn({ err, userId }, 'Failed to enqueue welcome email');
  });
}

// Unlike the welcome email, a reset request failing to send IS the whole point of the
// endpoint, so this one is still fire-and-forget for latency but logs at error level.
function enqueuePasswordResetEmail(userId: string, resetUrl: string): void {
  void enqueueEmail('password-reset', { userId, resetUrl }).catch((err) => {
    logger.error({ err, userId }, 'Failed to enqueue password reset email');
  });
}

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
    enqueueWelcomeEmail(user._id.toString());
    return user;
  },

  async registerWithPassword(input: RegisterInput): Promise<UserDocument> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw AppError.badRequest('An account with this email already exists');

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);
    const user = await userRepository.createWithPassword({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    enqueueWelcomeEmail(user._id.toString());
    return user;
  },

  async loginWithPassword(email: string, password: string): Promise<UserDocument> {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user?.passwordHash) throw AppError.unauthorized('Invalid email or password');

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) throw AppError.unauthorized('Invalid email or password');

    return user;
  },

  // Always resolves the same way regardless of whether the email matches an account -
  // this prevents the endpoint from being used to enumerate registered emails.
  async requestPasswordReset(email: string): Promise<void> {
    const user = await userRepository.findByEmailWithPassword(email);
    // Google-only accounts have no passwordHash to reset - silently no-op rather than
    // erroring, since revealing that would also leak account existence/type.
    if (!user || !user.passwordHash) return;

    const token = crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
    user.passwordResetTokenHash = hashResetToken(token);
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
    await userRepository.save(user);

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    enqueuePasswordResetEmail(user._id.toString(), resetUrl);
  },

  async resetPassword(token: string, newPassword: string): Promise<UserDocument> {
    const user = await userRepository.findByResetTokenHash(hashResetToken(token));
    if (!user) throw AppError.badRequest('This reset link is invalid or has expired');

    user.passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_ROUNDS);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    return userRepository.save(user);
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
