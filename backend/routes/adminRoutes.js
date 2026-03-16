import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authMiddleware, superAdminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', adminController.login);

// Protected routes
router.get('/profile', authMiddleware, adminController.getProfile);
router.post('/register', authMiddleware, superAdminOnly, adminController.register);
router.get('/all', authMiddleware, superAdminOnly, adminController.getAllAdmins);
router.put('/:id', authMiddleware, superAdminOnly, adminController.updateAdmin);
router.delete('/:id', authMiddleware, superAdminOnly, adminController.deleteAdmin);

export default router;
