import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { MAX_PROPERTY_IMAGES } from '@soweto-stays/shared';
import { env } from '../../common/config/env.js';
import { AppError } from '../../common/errors/AppError.js';

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function propertyUploadDir(propertyId: string): string {
  return path.join(env.UPLOAD_DIR, 'properties', propertyId);
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = propertyUploadDir(req.params.id as string);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

export const propertyImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: MAX_PROPERTY_IMAGES },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(AppError.badRequest('Only JPEG, PNG, or WEBP images are allowed'));
      return;
    }
    cb(null, true);
  },
}).array('images', MAX_PROPERTY_IMAGES);

export function toPublicImagePath(propertyId: string, filename: string): string {
  return `/uploads/properties/${propertyId}/${filename}`;
}
