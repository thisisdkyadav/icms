import express from 'express';
import * as participantController from '../controllers/participantController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Participant routes
router.post('/import/:eventId', participantController.importFromCSV);
router.get('/event/:eventId', participantController.getByEvent);
router.post('/send-qr/:eventId', participantController.sendQRCodes);
router.post('/attendance', participantController.markAttendance);
router.post('/send-certificates/:eventId', participantController.sendCertificates);
router.post('/send-receipts/:eventId', participantController.sendReceipts);
router.post('/notify/:eventId', participantController.sendNotifications);

export default router;
