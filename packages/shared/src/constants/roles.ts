// 'host' was removed as a grantable user role - the platform (admin) is the sole host of
// every listing now (see property.service.ts createByAdmin). Property.hostId / booking
// .hostId / user.hostRatingAvg etc. keep their existing field names (an admin account is
// still "the host" of a property/booking, just never a separate non-admin user).
export const ROLES = ['guest', 'admin'] as const;
export type Role = (typeof ROLES)[number];
