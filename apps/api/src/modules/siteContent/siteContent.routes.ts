import { Router } from 'express';
import * as siteContentController from './siteContent.controller.js';

export const siteContentRouter = Router();

// Public/unauthenticated - these images render on marketing pages before a visitor logs in.
siteContentRouter.get('/images', siteContentController.getImages);
siteContentRouter.get('/homepage', siteContentController.getHomepage);
siteContentRouter.get('/theme', siteContentController.getTheme);
siteContentRouter.get('/about', siteContentController.getAbout);
siteContentRouter.get('/services', siteContentController.getServices);
siteContentRouter.get('/contact', siteContentController.getContact);
