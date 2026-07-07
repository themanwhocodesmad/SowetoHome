import { UserModel, type UserDocument } from '@soweto-stays/db';

export const userRepository = {
  findById(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id);
  },

  findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return UserModel.findOne({ googleId });
  },

  createFromGoogleProfile(input: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<UserDocument> {
    return UserModel.create({ ...input, roles: ['guest'] });
  },

  async listPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      UserModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserModel.countDocuments(),
    ]);
    return { items, total };
  },

  save(user: UserDocument): Promise<UserDocument> {
    return user.save();
  },
};
