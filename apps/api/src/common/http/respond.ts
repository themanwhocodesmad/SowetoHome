import type { Response } from 'express';
import type { PaginatedResult } from '@soweto-stays/shared';

export function ok<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, 201);
}

export function paginated<T>(
  res: Response,
  items: T[],
  page: number,
  limit: number,
  total: number,
) {
  const result: PaginatedResult<T> = {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
  return ok(res, result);
}
