import express from 'express';
const router = express.Router();

// TODO: Import controller
// import * as eventController from '../controllers/eventController.js';

// Event routes
router.get('/', (req, res) => {
  res.json({ message: 'Event routes working' });
});

// TODO: Add these routes
// POST /api/events - Create new event
// GET /api/events - Get all events
// GET /api/events/:id - Get event by ID
// PUT /api/events/:id - Update event
// DELETE /api/events/:id - Delete event

export default router;
