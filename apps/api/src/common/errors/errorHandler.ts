import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';
import { logger } from '../logger.js';
import { AppError } from './AppError.js';

const MULTER_ERROR_MESSAGES: Partial<Record<MulterError['code'], string>> = {
  LIMIT_FILE_SIZE: 'File too large (max 5MB per image)',
  LIMIT_FILE_COUNT: 'Too many files (max 8 images)',
  LIMIT_UNEXPECTED_FILE: 'Too many files (max 8 images)',
};

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(AppError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    // The generic "Validation failed" string used to be the ENTIRE message shown to the
    // user - the actual per-field reasons only ever reached `details`, which the frontend's
    // apiFetch() never reads (it just throws new Error(body.error.message)). Building the
    // real field-by-field summary into `message` itself means every caller gets it for
    // free, with no frontend change needed - `details` (still Zod's .flatten()) stays
    // available for anything that wants to render it more richly per-field later.
    const summary = err.errors
      .map((issue) => `${issue.path.length ? issue.path.join('.') : 'value'}: ${issue.message}`)
      .join('; ');
    res.status(400).json({
      success: false,
      error: {
        message: summary || 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof MongooseError.ValidationError) {
    const summary = Object.entries(err.errors)
      .map(([field, e]) => `${field}: ${e.message}`)
      .join('; ');
    res.status(400).json({
      success: false,
      error: {
        message: summary || 'Some required fields are missing or invalid',
        code: 'VALIDATION_ERROR',
        details: Object.fromEntries(
          Object.entries(err.errors).map(([field, e]) => [field, e.message]),
        ),
      },
    });
    return;
  }

  if (err instanceof MulterError) {
    res.status(400).json({
      success: false,
      error: { message: MULTER_ERROR_MESSAGES[err.code] ?? err.message, code: err.code },
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, err.message);
    }
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code, details: err.details },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
  });
}
