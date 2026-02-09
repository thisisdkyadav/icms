import express from 'express';
import * as eventController from '../controllers/eventController.js';
import { authMiddleware, adminOrHigher } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Event routes
router.post('/', adminOrHigher, eventController.createEvent);
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', adminOrHigher, eventController.deleteEvent);
router.post('/:id/assign', adminOrHigher, eventController.assignUser);

export default router;
