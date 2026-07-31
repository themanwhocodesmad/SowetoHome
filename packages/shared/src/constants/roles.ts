export const ROLES = ['guest', 'admin'] as const;
export type Role = (typeof ROLES)[number];
