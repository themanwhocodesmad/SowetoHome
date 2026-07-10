import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  CreatePropertyInput,
  PropertyDto,
  PropertySearchQuery,
  UpdatePropertyInput,
} from '@soweto-stays/shared';
import { env } from '../../common/config/env.js';
import { AppError } from '../../common/errors/AppError.js';
import { userService } from '../users/user.service.js';
import { findBookedPropertyIds } from '../bookings/availability.js';
import type { PropertyDocument } from '@soweto-stays/db';
import { propertyRepository } from './property.repository.js';

interface AuthUser {
  id: string;
  roles: string[];
}

export function toPropertyDto(property: PropertyDocument, hostName?: string): PropertyDto {
  return {
    id: property._id.toString(),
    hostId: property.hostId.toString(),
    hostName,
    title: property.title,
    description: property.description,
    images: property.images,
    location: property.location,
    stayRate: property.stayRate,
    minNights: property.minNights,
    maxNights: property.maxNights,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    beds: property.beds,
    amenities: property.amenities,
    propertyType: property.propertyType,
    houseRules: property.houseRules,
    checkInTime: property.checkInTime,
    checkOutTime: property.checkOutTime,
    isAvailable: property.isAvailable,
    status: property.status,
    ratingAvg: property.ratingAvg,
    ratingCount: property.ratingCount,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  };
}

function assertCanManage(property: PropertyDocument, requester: AuthUser) {
  const isOwner = property.hostId.toString() === requester.id;
  const isAdmin = requester.roles.includes('admin');
  if (!isOwner && !isAdmin) {
    throw AppError.forbidden('You do not have access to this property');
  }
}

export const propertyService = {
  async createByHost(hostId: string, input: CreatePropertyInput): Promise<PropertyDocument> {
    return propertyRepository.create({
      ...input,
      hostId,
      status: 'pending_review',
    });
  },

  // Admins never own listings (see claude_plan.md §2/§10) - they act on behalf of an
  // existing host, who gains the host role automatically if they don't already have it.
  async createByAdmin(targetHostId: string, input: CreatePropertyInput): Promise<PropertyDocument> {
    const targetUser = await userService.getById(targetHostId);
    if (!targetUser.roles.includes('host')) {
      await userService.grantHostRole(targetHostId);
    }
    return propertyRepository.create({
      ...input,
      hostId: targetUser._id,
      status: 'published',
    });
  },

  async getManageable(propertyId: string, requester: AuthUser): Promise<PropertyDocument> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw AppError.notFound('Property not found');
    assertCanManage(property, requester);
    return property;
  },

  async getPublicById(propertyId: string, requester?: AuthUser): Promise<PropertyDocument> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw AppError.notFound('Property not found');

    const isOwnerOrAdmin =
      !!requester &&
      (property.hostId.toString() === requester.id || requester.roles.includes('admin'));
    if (property.status !== 'published' && !isOwnerOrAdmin) {
      throw AppError.notFound('Property not found');
    }
    return property;
  },

  async update(
    propertyId: string,
    requester: AuthUser,
    input: UpdatePropertyInput,
  ): Promise<PropertyDocument> {
    const property = await this.getManageable(propertyId, requester);

    Object.assign(property, input);
    const minNights = property.minNights;
    const maxNights = property.maxNights;
    if (maxNights < minNights) {
      throw AppError.badRequest('maxNights must be greater than or equal to minNights');
    }

    // A host editing their own published listing sends it back for re-review; an admin
    // edit is trusted and does not reset moderation status.
    if (!requester.roles.includes('admin') && property.status === 'published') {
      property.status = 'pending_review';
    }

    return propertyRepository.save(property);
  },

  async setStatus(propertyId: string, status: PropertyDocument['status']): Promise<PropertyDocument> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw AppError.notFound('Property not found');
    property.status = status;
    return propertyRepository.save(property);
  },

  async addImages(
    propertyId: string,
    requester: AuthUser,
    relativePaths: string[],
  ): Promise<PropertyDocument> {
    const property = await this.getManageable(propertyId, requester);
    const total = property.images.length + relativePaths.length;
    if (total > 8) {
      throw AppError.badRequest(
        `A property can have at most 8 images (already has ${property.images.length})`,
      );
    }
    property.images = [...property.images, ...relativePaths];
    return propertyRepository.save(property);
  },

  async removeImage(
    propertyId: string,
    requester: AuthUser,
    imagePath: string,
  ): Promise<PropertyDocument> {
    const property = await this.getManageable(propertyId, requester);
    property.images = property.images.filter((img) => img !== imagePath);
    const saved = await propertyRepository.save(property);

    const absolutePath = path.join(env.UPLOAD_DIR, imagePath.replace(/^\/?uploads\//, ''));
    await fs.unlink(absolutePath).catch(() => {
      // Best-effort cleanup - a missing file on disk shouldn't block removing the reference.
    });

    return saved;
  },

  async listMine(hostId: string): Promise<PropertyDocument[]> {
    return propertyRepository.listByHost(hostId);
  },

  async listForAdmin(page: number, limit: number, status?: string, hostId?: string) {
    return propertyRepository.listForAdmin(page, limit, { status, hostId });
  },

  async search(query: PropertySearchQuery) {
    let excludedPropertyIds: string[] = [];
    if (query.checkIn && query.checkOut) {
      excludedPropertyIds = await findBookedPropertyIds(
        new Date(query.checkIn),
        new Date(query.checkOut),
      );
    }
    return propertyRepository.search(query, excludedPropertyIds);
  },
};
