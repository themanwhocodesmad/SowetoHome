import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.js';
import * as savedPropertyController from './savedProperty.controller.js';

export const savedPropertyRouter = Router();

savedPropertyRouter.use(authenticate);

savedPropertyRouter.get('/', savedPropertyController.listProperties);
savedPropertyRouter.get('/ids', savedPropertyController.listIds);
savedPropertyRouter.post('/:propertyId', savedPropertyController.save);
savedPropertyRouter.delete('/:propertyId', savedPropertyController.unsave);
