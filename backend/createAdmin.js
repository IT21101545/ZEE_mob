const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@admin.com';
    let adminUser = await User.findOne({ email });

    if (adminUser) {
      console.log('Admin user already exists. Updating role and password if needed...');
      adminUser.role = 'admin';
      adminUser.password = 'password123';
      await adminUser.save();
    } else {
      console.log('Creating new admin user...');
      adminUser = await User.create({
        name: 'Super Admin',
        email,
        password: 'password123',
        role: 'admin'
      });
    }

    console.log(`Successfully created/updated admin account: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
