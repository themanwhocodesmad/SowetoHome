import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { connectDb, disconnectDb, PropertyModel, UserModel } from '@soweto-stays/db';
import { env } from '../common/config/env.js';
import { logger } from '../common/logger.js';

// Real, freely-licensed (CC0 / CC-BY) photos - not tied to any specific real address, so
// they're safe to use as generic listing photos rather than depicting someone's actual home.
// Each entry has a branded SVG in seed-assets/ used as a fallback when the download fails,
// so the seed always produces a fully-illustrated demo even offline or if a URL dies.
const PHOTOS = {
  exteriorBrick: {
    url: 'https://cdn.stocksnap.io/img-thumbs/960w/CLD6T4J9VZ.jpg',
    fallback: 'exterior-brick.svg',
  },
  exteriorModern: {
    url: 'https://cdn.stocksnap.io/img-thumbs/960w/87ONRC5PWV.jpg',
    fallback: 'exterior-modern.svg',
  },
  exteriorSuburb: {
    url: 'https://cdn.stocksnap.io/img-thumbs/960w/6KJ12UWOKQ.jpg',
    fallback: 'exterior-suburb.svg',
  },
  exteriorRedRoof: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Modern_house_exterior_with_red_roof_and_landscaped_garden_under_clear_blue_sky.jpg/960px-Modern_house_exterior_with_red_roof_and_landscaped_garden_under_clear_blue_sky.jpg',
    fallback: 'exterior-redroof.svg',
  },
  loungeBright: { url: 'https://cdn.stocksnap.io/img-thumbs/960w/HIH67XC5G0.jpg', fallback: 'lounge-bright.svg' },
  loungeCosy: { url: 'https://cdn.stocksnap.io/img-thumbs/960w/NF6P1OX124.jpg', fallback: 'lounge-cosy.svg' },
  bedroom: { url: 'https://cdn.stocksnap.io/img-thumbs/960w/XCOZ3XTV7M.jpg', fallback: 'bedroom.svg' },
  kitchen: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Modern_kitchen_interior_featuring_wooden_shelving_and_organized_dishware_in_a_cozy_setting.jpg/960px-Modern_kitchen_interior_featuring_wooden_shelving_and_organized_dishware_in_a_cozy_setting.jpg',
    fallback: 'kitchen.svg',
  },
  bathroom: { url: 'https://cdn.stocksnap.io/img-thumbs/960w/SX2H0BU5EG.jpg', fallback: 'bathroom.svg' },
  pool: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Backyardpool.jpg/960px-Backyardpool.jpg',
    fallback: 'pool.svg',
  },
} as const;

type PhotoDef = (typeof PHOTOS)[keyof typeof PHOTOS];

const SEED_ASSETS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../seed-assets');

const DEMO_HOST_ID = new Types.ObjectId('000000000000000000000001');

// Fixed ids so re-running the seed replaces the same listings/files instead of piling up duplicates.
const DEMO_PROPERTIES = [
  {
    _id: new Types.ObjectId('000000000000000000000101'),
    title: 'Bright family home on Vilakazi Street',
    description:
      'A sunlit family house a short walk from Vilakazi Street, Soweto\'s most famous strip of cafes and history. Three bedrooms, a fenced garden, and secure parking.',
    location: {
      address: '12 Vilakazi Street',
      suburb: 'Orlando West',
      city: 'Johannesburg',
      province: 'Gauteng',
      lat: -26.2394,
      lng: 27.9127,
    },
    stayRate: 850,
    minNights: 2,
    maxNights: 14,
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    beds: 4,
    amenities: ['wifi', 'parking', 'kitchen', 'washing_machine', 'tv'],
    propertyType: 'entire_place' as const,
    checkInTime: '14:00',
    checkOutTime: '10:00',
    images: [PHOTOS.exteriorBrick, PHOTOS.loungeBright, PHOTOS.bedroom, PHOTOS.kitchen],
  },
  {
    _id: new Types.ObjectId('000000000000000000000102'),
    title: 'Cosy private room in Diepkloof',
    description:
      'A comfortable private room in a quiet Diepkloof home, perfect for solo travellers or couples. Shared kitchen and lounge, with a host on hand for local tips.',
    location: {
      address: '45 Immink Drive',
      suburb: 'Diepkloof',
      city: 'Johannesburg',
      province: 'Gauteng',
      lat: -26.2519,
      lng: 27.9469,
    },
    stayRate: 350,
    minNights: 1,
    maxNights: 21,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    beds: 1,
    amenities: ['wifi', 'kitchen', 'breakfast'],
    propertyType: 'private_room' as const,
    checkInTime: '15:00',
    checkOutTime: '11:00',
    images: [PHOTOS.bedroom, PHOTOS.loungeCosy, PHOTOS.bathroom],
  },
  {
    _id: new Types.ObjectId('000000000000000000000103'),
    title: 'Modern townhouse with pool, Meadowlands',
    description:
      'A spacious modern townhouse in Meadowlands with a private pool and braai area - ideal for a group getaway or family reunion.',
    location: {
      address: '8 Koma Road',
      suburb: 'Meadowlands',
      city: 'Johannesburg',
      province: 'Gauteng',
      lat: -26.2033,
      lng: 27.8917,
    },
    stayRate: 1450,
    minNights: 2,
    maxNights: 10,
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    beds: 5,
    amenities: ['wifi', 'parking', 'pool', 'kitchen', 'air_conditioning', 'tv'],
    propertyType: 'entire_place' as const,
    checkInTime: '14:00',
    checkOutTime: '10:00',
    images: [PHOTOS.exteriorModern, PHOTOS.pool, PHOTOS.loungeBright, PHOTOS.kitchen],
  },
  {
    _id: new Types.ObjectId('000000000000000000000104'),
    title: 'Heritage stay near Kliptown Square',
    description:
      'Stay minutes from Walter Sisulu Square in historic Kliptown. A simple, welcoming home with a warm host and easy access to the Soweto markets.',
    location: {
      address: '23 Union Street',
      suburb: 'Kliptown',
      city: 'Johannesburg',
      province: 'Gauteng',
      lat: -26.2661,
      lng: 27.9089,
    },
    stayRate: 500,
    minNights: 1,
    maxNights: 14,
    maxGuests: 3,
    bedrooms: 2,
    bathrooms: 1,
    beds: 2,
    amenities: ['wifi', 'kitchen', 'parking'],
    propertyType: 'entire_place' as const,
    checkInTime: '13:00',
    checkOutTime: '10:00',
    images: [PHOTOS.exteriorSuburb, PHOTOS.loungeCosy, PHOTOS.bedroom],
  },
  {
    _id: new Types.ObjectId('000000000000000000000105'),
    title: 'Budget shared room, Pimville',
    description:
      'An affordable shared room in a friendly Pimville household, close to shops and taxi routes into the city. Great for backpackers on a budget.',
    location: {
      address: '5 Khumalo Street',
      suburb: 'Pimville',
      city: 'Johannesburg',
      province: 'Gauteng',
      lat: -26.2694,
      lng: 27.8917,
    },
    stayRate: 220,
    minNights: 1,
    maxNights: 30,
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    beds: 1,
    amenities: ['wifi', 'kitchen'],
    propertyType: 'shared_room' as const,
    checkInTime: '16:00',
    checkOutTime: '10:00',
    images: [PHOTOS.bedroom, PHOTOS.bathroom],
  },
  {
    _id: new Types.ObjectId('000000000000000000000106'),
    title: 'Garden cottage in Jabavu with braai deck',
    description:
      'A self-contained garden cottage in Jabavu with its own entrance, braai deck, and secure parking - a quiet base close to Soweto\'s main attractions.',
    location: {
      address: '31 Mputhi Street',
      suburb: 'Jabavu',
      city: 'Johannesburg',
      province: 'Gauteng',
      lat: -26.2453,
      lng: 27.8994,
    },
    stayRate: 700,
    minNights: 2,
    maxNights: 21,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    beds: 2,
    amenities: ['wifi', 'parking', 'kitchen', 'tv'],
    propertyType: 'entire_place' as const,
    checkInTime: '14:00',
    checkOutTime: '11:00',
    images: [PHOTOS.exteriorRedRoof, PHOTOS.loungeCosy, PHOTOS.kitchen],
  },
];

function propertyUploadDir(propertyId: string): string {
  return path.resolve(env.UPLOAD_DIR, 'properties', propertyId);
}

function toPublicImagePath(propertyId: string, filename: string): string {
  return `/uploads/properties/${propertyId}/${filename}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, attempts = 4): Promise<Response> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SowetoHome-seed-script/1.0 (local dev seed data)' },
    });
    if (res.ok) return res;
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === attempts) {
      throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
    }
    await sleep(500 * 2 ** (attempt - 1));
  }
  throw new Error(`unreachable`);
}

async function downloadImage(url: string, destDir: string): Promise<string> {
  const res = await fetchWithRetry(url);
  const contentType = res.headers.get('content-type') ?? '';
  const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(path.join(destDir, filename), buffer);
  return filename;
}

async function materialiseImage(photo: PhotoDef, destDir: string): Promise<string> {
  try {
    return await downloadImage(photo.url, destDir);
  } catch (err) {
    logger.warn({ err, url: photo.url }, `Download failed - using local placeholder ${photo.fallback}`);
    const filename = `${randomUUID()}.svg`;
    await fs.copyFile(path.join(SEED_ASSETS_DIR, photo.fallback), path.join(destDir, filename));
    return filename;
  }
}

async function seedHost() {
  return UserModel.findOneAndUpdate(
    { _id: DEMO_HOST_ID },
    {
      _id: DEMO_HOST_ID,
      googleId: 'seed-demo-host',
      email: 'demo.host@sowetostays.local',
      name: 'Thandiwe Nkosi',
      roles: ['host', 'guest'],
      isSuspended: false,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function seedProperty(def: (typeof DEMO_PROPERTIES)[number]) {
  const propertyId = def._id.toString();
  const destDir = propertyUploadDir(propertyId);

  await fs.rm(destDir, { recursive: true, force: true });
  await fs.mkdir(destDir, { recursive: true });

  const images: string[] = [];
  for (const photo of def.images) {
    const filename = await materialiseImage(photo, destDir);
    images.push(toPublicImagePath(propertyId, filename));
  }

  await PropertyModel.findOneAndUpdate(
    { _id: def._id },
    {
      _id: def._id,
      hostId: DEMO_HOST_ID,
      title: def.title,
      description: def.description,
      images,
      location: def.location,
      stayRate: def.stayRate,
      minNights: def.minNights,
      maxNights: def.maxNights,
      maxGuests: def.maxGuests,
      bedrooms: def.bedrooms,
      bathrooms: def.bathrooms,
      beds: def.beds,
      amenities: def.amenities,
      propertyType: def.propertyType,
      checkInTime: def.checkInTime,
      checkOutTime: def.checkOutTime,
      isAvailable: true,
      status: 'published',
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  logger.info(`Seeded "${def.title}" with ${images.length} images`);
}

async function main() {
  await connectDb(env.MONGO_URI);
  try {
    await seedHost();
    for (const def of DEMO_PROPERTIES) {
      await seedProperty(def);
    }
    logger.info(`Done - seeded ${DEMO_PROPERTIES.length} demo properties.`);
  } finally {
    await disconnectDb();
  }
}

main().catch((err) => {
  logger.error(err, 'Seed script failed');
  process.exitCode = 1;
});
