export const ROLES = ['guest', 'host', 'admin'] as const;
export type Role = (typeof ROLES)[number];
