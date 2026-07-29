import type { AboutContentDto, ContactContentDto, ServicesContentDto } from '../types/admin.js';

// Defaults mirror the copy that used to be hardcoded directly in AboutPage/ServicesPage/
// ContactPage, so switching those pages over to CMS-driven content changes nothing
// visible until an admin actually edits it (same pattern as DEFAULT_HOMEPAGE_CONTENT).
export const DEFAULT_ABOUT_CONTENT: AboutContentDto = {
  visionEyebrow: 'Our Vision',
  visionTitle: 'Redefining what a managed stay should feel like',
  visionCopy1:
    'BookMyStaySA was founded on a simple idea: South African travel and boutique stays deserve the same level of care as premium real estate. We reverse-engineered the operational discipline of high-end asset management and applied it to staycations from Cape Town to Kruger and the Garden Route, so every guest experience and every property under our care benefits from the same rigor.',
  visionCopy2:
    'Today we work with independent owners and corporate clients alike, curating a portfolio of signature estates and boutique properties that are booking-ready, well maintained, and consistently reviewed.',
  corporateEyebrow: 'Corporate Booking Solutions',
  corporateTitle: 'Built for teams, not just travellers',
  corporateCopy:
    'Beyond individual stays, we support corporate travel desks and event planners with block bookings, extended-stay rates, and a single point of contact for multi-property itineraries. Our team handles invoicing, reporting, and consultation scheduling so corporate stays are as seamless as a single-night booking.',
};

export const DEFAULT_SERVICES_CONTENT: ServicesContentDto = {
  eyebrow: 'What We Offer',
  title: 'Full-service stewardship for stays and estates',
  subtitle:
    'Whether you are booking a signature estate or entrusting us with your property, our services are built around one goal: a consistently premium experience on both sides of the stay.',
  services: [
    {
      title: 'Concierge',
      copy: 'Dedicated support before and during every stay, from itinerary planning to on-the-ground recommendations, so guests always have a direct line to help.',
    },
    {
      title: 'Property Management',
      copy: 'End-to-end operations for owners, covering maintenance, styling, pricing strategy, and turnover, so every listing performs at its best.',
    },
    {
      title: 'Guest Relations',
      copy: 'Consistent, responsive communication across the guest journey, handling requests, reviews, and issue resolution with a concierge-level standard.',
    },
  ],
};

export const DEFAULT_CONTACT_CONTENT: ContactContentDto = {
  eyebrow: 'Get In Touch',
  title: 'Talk to our stay advisory team',
  subtitle:
    'Have a question about a booking, a property, or a corporate consultation? Send us a message and a member of our team will follow up to schedule a call.',
  consultationTitle: 'Consultation Scheduling',
  consultationCopy:
    'Prefer to talk it through first? Request a consultation and we will find a time that works for corporate bookings or multi-property enquiries.',
  email: 'hello@bookmystay.co.za',
  phone: '+27 11 000 0000',
};
