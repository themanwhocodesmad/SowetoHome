import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
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
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.flatten(),
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
