import type { PropertyStatus, PropertyType } from '../constants/enums.js';

export interface LocationDto {
  address: string;
  suburb: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
}

export interface PropertyDto {
  id: string;
  hostId: string;
  hostName?: string;
  title: string;
  description: string;
  images: string[];
  location: LocationDto;
  stayRate: number;
  minNights: number;
  maxNights: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  amenities: string[];
  propertyType: PropertyType;
  houseRules?: string;
  checkInTime: string;
  checkOutTime: string;
  isAvailable: boolean;
  status: PropertyStatus;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}
