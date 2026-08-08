import type { PropertySearchQuery } from '@soweto-stays/shared';
import { PropertyModel, type PropertyDocument } from '@soweto-stays/db';

export interface PropertyFilter {
  status?: string;
  hostId?: string;
}

export const propertyRepository = {
  findById(id: string): Promise<PropertyDocument | null> {
    return PropertyModel.findById(id);
  },

  findPublishedByIds(ids: string[]): Promise<PropertyDocument[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return PropertyModel.find({ _id: { $in: ids }, status: 'published', isAvailable: true });
  },

  // Loosely typed on purpose: callers pass zod-validated DTOs plus a plain string hostId,
  // and Mongoose casts/validates the shape against the schema at write time.
  create(data: Record<string, unknown>): Promise<PropertyDocument> {
    return PropertyModel.create(data);
  },

  save(property: PropertyDocument): Promise<PropertyDocument> {
    return property.save();
  },

  async listByHost(hostId: string): Promise<PropertyDocument[]> {
    return PropertyModel.find({ hostId }).sort({ createdAt: -1 });
  },

  async listForAdmin(page: number, limit: number, filter: PropertyFilter) {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.hostId) query.hostId = filter.hostId;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      PropertyModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PropertyModel.countDocuments(query),
    ]);
    return { items, total };
  },

  async search(query: PropertySearchQuery, excludedPropertyIds: string[] = []) {
    const filter: Record<string, unknown> = {
      status: 'published',
      isAvailable: true,
    };
    if (query.city) filter['location.city'] = new RegExp(query.city, 'i');
    if (query.province) filter['location.province'] = query.province;
    if (query.guests) filter.maxGuests = { $gte: query.guests };
    if (query.minPrice || query.maxPrice) {
      filter.stayRate = {
        ...(query.minPrice ? { $gte: query.minPrice } : {}),
        ...(query.maxPrice ? { $lte: query.maxPrice } : {}),
      };
    }
    if (excludedPropertyIds.length > 0) {
      filter._id = { $nin: excludedPropertyIds };
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      PropertyModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      PropertyModel.countDocuments(filter),
    ]);
    return { items, total };
  },
};
