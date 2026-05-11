// testLogin.js — diagnose the 500 error on login
require('dotenv').config();
const connectDB = require('./config/db');

const testLogin = async () => {
  await connectDB();
  const User = require('./models/User');

  const username = 'admin';
  const password = 'admin@123';

  console.log('\n--- Step 1: Find user ---');
  const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
  
  if (!user) {
    console.log('❌ No user found with username:', username);
    console.log('\nAll users in DB:');
    const all = await User.find().select('username role schoolLevel');
    console.log(all);
    process.exit(0);
  }

  console.log('✅ User found:', { username: user.username, role: user.role, schoolLevel: user.schoolLevel });
  console.log('   Password hash exists:', !!user.password);

  console.log('\n--- Step 2: Match password ---');
  try {
    const isMatch = await user.matchPassword(password);
    console.log('Password match result:', isMatch);
    if (isMatch) {
      console.log('✅ Login should work! The issue is elsewhere.');
    } else {
      console.log('❌ Password does NOT match. Run: node resetAdmin.js');
    }
  } catch (err) {
    console.error('❌ matchPassword threw an error:', err.message);
  }

  process.exit(0);
};

testLogin().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
