import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Verify JWT token
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    const user = await Admin.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// SuperAdmin only middleware
export const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. SuperAdmin only.' });
  }
  next();
};

// Admin or higher middleware  
export const adminOrHigher = (req, res, next) => {
  if (req.user.role === 'subadmin') {
    return res.status(403).json({ message: 'Access denied. Admin or higher required.' });
  }
  next();
};
