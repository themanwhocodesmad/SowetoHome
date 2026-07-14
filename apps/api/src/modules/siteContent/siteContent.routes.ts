import { Router } from 'express';
import * as siteContentController from './siteContent.controller.js';

export const siteContentRouter = Router();

// Public/unauthenticated - these images render on marketing pages before a visitor logs in.
siteContentRouter.get('/images', siteContentController.getImages);
