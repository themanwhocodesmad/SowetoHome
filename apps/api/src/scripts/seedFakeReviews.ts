import { Types } from 'mongoose';
import { connectDb, disconnectDb, PropertyModel, PropertyReviewModel, UserModel } from '@soweto-stays/db';
import { env } from '../common/config/env.js';
import { logger } from '../common/logger.js';

// Demo dev/test data only - matches the fixed property ids from seed.ts (run that first if
// these properties don't exist yet). Reviews are inserted directly (bypassing the normal
// "review a real completed booking" flow in review.service.ts) since this is just seeding
// realistic-looking star ratings and comments for local development / demos, not simulating
// real guest activity - bookingId/guestId are synthetic, fixed ids so re-running this script
// replaces the same 20 reviews instead of piling up duplicates.
const DEMO_PROPERTY_IDS = [
  '000000000000000000000101',
  '000000000000000000000102',
  '000000000000000000000103',
  '000000000000000000000104',
  '000000000000000000000105',
  '000000000000000000000106',
];


const GUEST_NAMES = [
  'Lindiwe Dlamini',
  'Sipho Mokoena',
  'Anele Zulu',
  'Thabo Mahlangu',
  'Nomvula Khumalo',
  'Kagiso Molefe',
  'Zanele Ndlovu',
  'Bongani Sithole',
  'Precious Radebe',
  'Tshepo Mabaso',
  'Ayanda Cele',
  'Karabo Motaung',
  'Nokuthula Ngcobo',
  'Sibusiso Mthembu',
  'Refilwe Tau',
  'Mpho Nkosi',
  'Lerato Mahlaba',
  'Vusi Nxumalo',
  'Zodwa Buthelezi',
  'Themba Skosana',
] as const;

interface ReviewSeed {
  propertyIndex: number;
  guestIndex: number;
  rating: number;
  comment: string;
  daysAgo: number;
}

// Skewed positive (mostly 4-5 stars, a couple of honest 3s) - realistic for a hospitality
// platform where guests who bother to leave a review usually had a good stay.
const REVIEWS: ReviewSeed[] = [
  { propertyIndex: 0, guestIndex: 0, rating: 5, comment: 'Beautiful home right by Vilakazi Street - walked to the museums in five minutes. Spotless and the host replied instantly on WhatsApp.', daysAgo: 4 },
  { propertyIndex: 0, guestIndex: 1, rating: 5, comment: 'Loved the garden and the secure parking. Kids had space to run around. Would book again for sure.', daysAgo: 11 },
  { propertyIndex: 0, guestIndex: 2, rating: 4, comment: 'Great location and comfy beds. Kitchen was a little short on pots but nothing a quick shop couldn’t fix.', daysAgo: 19 },
  { propertyIndex: 0, guestIndex: 3, rating: 5, comment: 'Exactly as pictured. Check-in was smooth and the neighbourhood felt very safe at night.', daysAgo: 27 },

  { propertyIndex: 1, guestIndex: 4, rating: 4, comment: 'Cosy room, very affordable for what you get. Shared kitchen was always clean when I used it.', daysAgo: 6 },
  { propertyIndex: 1, guestIndex: 5, rating: 5, comment: 'Host gave amazing tips for getting around Diepkloof and the taxi routes. Felt like staying with family.', daysAgo: 14 },
  { propertyIndex: 1, guestIndex: 6, rating: 3, comment: 'Decent stay, but the room faced the road so it got a bit noisy in the mornings.', daysAgo: 22 },

  { propertyIndex: 2, guestIndex: 7, rating: 5, comment: 'The pool made our family trip! Braai area was well equipped and the townhouse is even bigger than the photos suggest.', daysAgo: 3 },
  { propertyIndex: 2, guestIndex: 8, rating: 5, comment: 'Booked for a group of 8 and everyone had space. Aircon was a lifesaver in summer. Highly recommend.', daysAgo: 9 },
  { propertyIndex: 2, guestIndex: 9, rating: 4, comment: 'Lovely modern finishes throughout. Wifi dropped once but the host sorted it same day.', daysAgo: 17 },
  { propertyIndex: 2, guestIndex: 10, rating: 5, comment: 'Meadowlands is quieter than I expected and the security at the complex is excellent.', daysAgo: 25 },

  { propertyIndex: 3, guestIndex: 11, rating: 5, comment: 'Walking distance to Walter Sisulu Square - perfect base for exploring the markets. Warm, welcoming host.', daysAgo: 5 },
  { propertyIndex: 3, guestIndex: 12, rating: 4, comment: 'Simple but comfortable, and full of character. Great value for the price.', daysAgo: 13 },
  { propertyIndex: 3, guestIndex: 13, rating: 5, comment: 'Our host recommended the best local food spots. Felt like a proper Soweto experience.', daysAgo: 21 },

  { propertyIndex: 4, guestIndex: 14, rating: 3, comment: 'Budget-friendly and did the job for a couple of nights passing through. Basic but clean.', daysAgo: 8 },
  { propertyIndex: 4, guestIndex: 15, rating: 4, comment: 'Great for backpackers - close to the shops and easy to find transport into the city.', daysAgo: 16 },
  { propertyIndex: 4, guestIndex: 16, rating: 4, comment: 'Friendly household, felt safe the whole stay. Wouldn’t expect luxury at this price and didn’t get any surprises.', daysAgo: 24 },

  { propertyIndex: 5, guestIndex: 17, rating: 5, comment: 'The braai deck was the highlight - spent every evening out there. Private entrance made it feel like our own place.', daysAgo: 2 },
  { propertyIndex: 5, guestIndex: 18, rating: 5, comment: 'Quiet street, secure parking, and an easy drive to all the main Soweto sights. Loved it.', daysAgo: 10 },
  { propertyIndex: 5, guestIndex: 19, rating: 4, comment: 'Cottage was cosy and well kept. Only downside was patchy signal in the bathroom, otherwise great.', daysAgo: 18 },
];

// Builds a valid 24-hex-char ObjectId from a short numeric tag, left-padded with zeros -
// guaranteed the right length regardless of how many digits `tag` prints as.
function fixedObjectId(tag: number): Types.ObjectId {
  return new Types.ObjectId(tag.toString(16).padStart(24, '0'));
}

// Deterministic ids in the 0xc00-0xc13 range - distinct from DEMO_HOST_ID (...0001) and
// DEMO_PROPERTIES (...0101-0106) in seed.ts.
function guestObjectId(index: number): Types.ObjectId {
  return fixedObjectId(0xc00 + index);
}

// Deterministic ids in the 0xf01-0xf14 range, one per REVIEWS entry.
function reviewObjectId(index: number): Types.ObjectId {
  return fixedObjectId(0xf00 + index + 1);
}

async function seedGuests() {
  for (let i = 0; i < GUEST_NAMES.length; i++) {
    const _id = guestObjectId(i);
    await UserModel.findOneAndUpdate(
      { _id },
      {
        _id,
        googleId: `seed-fake-review-guest-${i}`,
        email: `demo.guest${i}@sowetostays.local`,
        name: GUEST_NAMES[i],
        roles: ['guest'],
        isSuspended: false,
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }
}

async function seedReviews() {
  for (let i = 0; i < REVIEWS.length; i++) {
    const seed = REVIEWS[i];
    if (!seed) continue;
    const propertyId = new Types.ObjectId(DEMO_PROPERTY_IDS[seed.propertyIndex]);
    const guestId = guestObjectId(seed.guestIndex);
    const reviewId = reviewObjectId(i);
    const bookingId = reviewId; // synthetic 1:1 stand-in, not a real Booking document
    const createdAt = new Date(Date.now() - seed.daysAgo * 24 * 60 * 60 * 1000);

    await PropertyReviewModel.findOneAndUpdate(
      { _id: reviewId },
      {
        _id: reviewId,
        bookingId,
        guestId,
        propertyId,
        rating: seed.rating,
        comment: seed.comment,
        createdAt,
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }
}

// Recompute each affected property's ratingAvg/ratingCount from ALL of its current
// PropertyReview documents (not just the ones this script just inserted), so the star
// average shown on the property page stays accurate even if it already had other reviews.
async function recomputePropertyRatings() {
  for (const idStr of DEMO_PROPERTY_IDS) {
    const propertyId = new Types.ObjectId(idStr);
    const [stats] = await PropertyReviewModel.aggregate<{ avg: number; count: number }>([
      { $match: { propertyId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await PropertyModel.findByIdAndUpdate(propertyId, {
      ratingAvg: stats ? Math.round(stats.avg * 100) / 100 : 0,
      ratingCount: stats?.count ?? 0,
    });
  }
}

async function main() {
  await connectDb(env.MONGO_URI);
  try {
    await seedGuests();
    await seedReviews();
    await recomputePropertyRatings();
    logger.info(`Done - seeded ${REVIEWS.length} fake reviews across ${DEMO_PROPERTY_IDS.length} demo properties.`);
  } finally {
    await disconnectDb();
  }
}

main().catch((err) => {
  logger.error(err, 'seedFakeReviews script failed');
  process.exitCode = 1;
});
