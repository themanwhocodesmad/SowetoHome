import { SavedPropertyModel, type SavedPropertyDocument } from '@soweto-stays/db';

export const savedPropertyRepository = {
  findOne(userId: string, propertyId: string): Promise<SavedPropertyDocument | null> {
    return SavedPropertyModel.findOne({ userId, propertyId });
  },

  create(userId: string, propertyId: string): Promise<SavedPropertyDocument> {
    return SavedPropertyModel.create({ userId, propertyId });
  },

  deleteOne(userId: string, propertyId: string): Promise<{ deletedCount?: number }> {
    return SavedPropertyModel.deleteOne({ userId, propertyId });
  },

  listByUser(userId: string): Promise<SavedPropertyDocument[]> {
    return SavedPropertyModel.find({ userId }).sort({ createdAt: -1 });
  },
};
