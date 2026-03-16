import express from 'express';
const router = express.Router();

// TODO: Import controller
// import * as participantController from '../controllers/participantController.js';

// Participant routes
router.get('/', (req, res) => {
  res.json({ message: 'Participant routes working' });
});

// TODO: Add these routes
// POST /api/participants/import - Import participants from CSV
// GET /api/participants/event/:eventId - Get participants by event
// POST /api/participants/send-qr/:eventId - Send QR codes to participants
// POST /api/participants/attendance - Mark attendance via QR scan
// POST /api/participants/send-certificates - Send certificates
// POST /api/participants/notify - Send notifications

export default router;
