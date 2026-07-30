import type { PropertyDto } from '@soweto-stays/shared';
import { PropertyModel } from '@soweto-stays/db';
import { AppError } from '../../common/errors/AppError.js';
import { toPropertyDto } from '../properties/property.service.js';
import { savedPropertyRepository } from './savedProperty.repository.js';

export const savedPropertyService = {
  async save(userId: string, propertyId: string): Promise<void> {
    const property = await PropertyModel.findById(propertyId);
    if (!property) throw AppError.notFound('Property not found');

    const existing = await savedPropertyRepository.findOne(userId, propertyId);
    if (existing) return;
    await savedPropertyRepository.create(userId, propertyId);
  },

  async unsave(userId: string, propertyId: string): Promise<void> {
    await savedPropertyRepository.deleteOne(userId, propertyId);
  },

  async listIds(userId: string): Promise<string[]> {
    const saved = await savedPropertyRepository.listByUser(userId);
    return saved.map((s) => s.propertyId.toString());
  },

  async listProperties(userId: string): Promise<PropertyDto[]> {
    const saved = await savedPropertyRepository.listByUser(userId);
    const propertyIds = saved.map((s) => s.propertyId);
    const properties = await PropertyModel.find({ _id: { $in: propertyIds } });

    // Preserve the most-recently-saved-first order from the saved list, not
    // whatever order Mongo's $in query happens to return them in.
    const byId = new Map(properties.map((p) => [p._id.toString(), p]));
    return saved
      .map((s) => byId.get(s.propertyId.toString()))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => toPropertyDto(p));
  },
};
