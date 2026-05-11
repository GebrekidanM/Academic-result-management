// resetAdmin.js — run once to reset admin credentials
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const resetAdmin = async () => {
  try {
    await connectDB();

    const User = require('./models/User');

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin@123';

    // Find existing admin
    let admin = await User.findOne({ role: 'admin' });

    if (admin) {
      console.log(`Found admin: "${admin.username}". Resetting password...`);
      // Update username and password directly
      admin.username = username;
      admin.password = password; // pre-save hook will hash it
      admin.schoolLevel = 'all';
      await admin.save();
      console.log(`✅ Admin password reset. Login with: ${username} / ${password}`);
    } else {
      console.log('No admin found. Creating new admin...');
      await User.create({
        fullName: 'Default Admin',
        username,
        password,
        role: 'admin',
        schoolLevel: 'all',
      });
      console.log(`✅ Admin created. Login with: ${username} / ${password}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

resetAdmin();
