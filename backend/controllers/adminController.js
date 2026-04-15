import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Login admin
export const login = async (req, res) => {
  try {
    // Check missing fields
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    // Check type
    if (
      typeof req.body.email !== 'string' ||
      typeof req.body.password !== 'string'
    ) {
      return res.status(400).json({ message: 'Invalid input format' });
    }

    const email = req.body.email.toLowerCase().trim();
    const password = req.body.password;

    // Find user by email
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register new admin (SuperAdmin only)
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({ message: 'Invalid input format' });
    }

    const emailStr = email.toLowerCase().trim();

    // check if email is valid or not
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user exists
    const existingUser = await Admin.findOne({ email: emailStr });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Check password length    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new Admin({
      name: name.trim(),
      email: emailStr,
      password: hashedPassword,
      role: typeof role === 'string' ? role : 'admin'
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all admins (SuperAdmin only)
export const getAllAdmins = async (req, res) => {
  try {
    const users = await Admin.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get admins and sub-admins that can be assigned to events
export const getAssignableAdmins = async (req, res) => {
  try {
    const users = await Admin.find({
      role: { $in: ['admin', 'subadmin'] }
    }).select('-password');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update admin
export const updateAdmin = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (
      (email && typeof email !== 'string') ||
      (name && typeof name !== 'string') ||
      (role && typeof role !== 'string')
    ) {
      return res.status(400).json({ message: 'Invalid input format' });
    }

    const updateData = {
      name: name?.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      role
    };

    const user = await Admin.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete admin (SuperAdmin only)
export const deleteAdmin = async (req, res) => {
  try {
    const user = await Admin.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
