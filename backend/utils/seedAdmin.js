import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/icms');
    console.log('Connected to MongoDB');

    // Check if superadmin exists
    const existingAdmin = await Admin.findOne({ role: 'superadmin' });
    if (existingAdmin) {
      console.log('SuperAdmin already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create superadmin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const superAdmin = new Admin({
      name: 'Super Admin',
      email: 'admin@icms.com',
      password: hashedPassword,
      role: 'superadmin'
    });

    await superAdmin.save();
    console.log('SuperAdmin created successfully!');
    console.log('Email: admin@icms.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
