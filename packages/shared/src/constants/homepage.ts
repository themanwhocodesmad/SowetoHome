import type { HomepageContentDto } from '../types/admin.js';

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContentDto = {
  heroEyebrow: "— South Africa's Premier Stays",
  heroTitle: 'Elevating the standard of ',
  heroTitleAccent: 'modern stays',
  heroSubtitle:
    'Discover signature estates and boutique properties, curated and managed end-to-end by BookMyStaySA’s advisory team — from first search to seamless check-in.',
  discoveryEyebrow: 'Explore Properties',
  discoveryTitle: 'Featured Signature Estates',
  discoverySubtitle: 'Hand-picked stays available for booking right now.',
  trustStats: [
    { value: '1,200+', label: 'Verified Stays' },
    { value: '98%', label: 'Guest Retention' },
    { value: '4.9★', label: 'Average Rating' },
  ],
  valuePropEyebrow: 'Strategic Asset Stewardship',
  valuePropTitle: 'A hands-on approach to every guest stay and every property we ',
  valuePropTitleAccent: 'manage.',
  valuePropCopy1:
    'Guests get a consistent, concierge-level experience across every stay we list, while owners get an advisory partner who treats their property like an asset, not just a listing.',
  valuePropCopy2:
    'From onboarding through day-to-day operations, our team handles the details so properties perform and guests keep coming back.',
  valueSteps: [
    {
      number: '01',
      title: 'Stay Strategy',
      copy: 'We match every guest with a signature estate tailored to the occasion, from weekend escapes to extended corporate stays.',
    },
    {
      number: '02',
      title: 'Acquisition & Handover',
      copy: 'Our advisory team manages onboarding, styling, and a seamless handover, so every property is booking-ready from day one.',
    },
    {
      number: '03',
      title: 'Asset Management',
      copy: 'Ongoing stewardship keeps each estate performing, from guest relations to maintenance and revenue optimisation.',
    },
  ],
};
