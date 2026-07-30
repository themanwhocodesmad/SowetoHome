import { UserModel, type UserDocument } from '@soweto-stays/db';

export const userRepository = {
  findById(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id);
  },

  findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return UserModel.findOne({ googleId });
  },

  findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase().trim() });
  },

  // passwordHash is `select: false` on the schema, so login needs it explicitly.
  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  },

  createFromGoogleProfile(input: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<UserDocument> {
    return UserModel.create({ ...input, roles: ['guest'] });
  },

  createWithPassword(input: { email: string; name: string; passwordHash: string }): Promise<UserDocument> {
    return UserModel.create({ ...input, roles: ['guest'] });
  },

  // passwordResetTokenHash is `select: false` - reset needs it explicitly, and needs the
  // expiry filtered in the query itself so an expired token never matches a document.
  findByResetTokenHash(tokenHash: string): Promise<UserDocument | null> {
    return UserModel.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpires');
  },

  async listPaginated(page: number, limit: number, role?: string) {
    const filter = role ? { roles: role } : {};
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserModel.countDocuments(filter),
    ]);
    return { items, total };
  },

  save(user: UserDocument): Promise<UserDocument> {
    return user.save();
  },
};
