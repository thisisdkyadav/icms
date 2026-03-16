import express from 'express';
const router = express.Router();

// TODO: Import controller
// import * as adminController from '../controllers/adminController.js';

// Admin routes
router.get('/', (req, res) => {
  res.json({ message: 'Admin routes working' });
});

// TODO: Add these routes
// POST /api/admin/login - Admin login
// POST /api/admin/register - Register new admin (super admin only)
// GET /api/admin/all - Get all admins (super admin only)
// DELETE /api/admin/:id - Remove admin (super admin only)

export default router;
