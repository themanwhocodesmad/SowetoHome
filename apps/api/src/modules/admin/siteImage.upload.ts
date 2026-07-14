import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { env } from '../../common/config/env.js';
import { AppError } from '../../common/errors/AppError.js';

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function siteUploadDir(): string {
  return path.join(env.UPLOAD_DIR, 'site');
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = siteUploadDir();
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

export const siteImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(AppError.badRequest('Only JPEG, PNG, or WEBP images are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('image');

export function toPublicSiteImagePath(filename: string): string {
  return `/uploads/site/${filename}`;
}
