import { Router } from 'express';
import { subscribeNewsletterSchema } from '@soweto-stays/shared';
import { validate } from '../../common/middleware/validate.js';
import * as newsletterController from './newsletter.controller.js';

export const newsletterRouter = Router();

newsletterRouter.post('/subscribe', validate(subscribeNewsletterSchema), newsletterController.subscribe);
