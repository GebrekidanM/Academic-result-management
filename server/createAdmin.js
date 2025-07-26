// createAdmin.js
const dotenv = require('dotenv');
const User = require('./models/User'); // Adjust path if needed
const connectDB = require('./config/db'); // Adjust path if needed

dotenv.config();
connectDB();

const createAdminUser = async () => {
    try {
        // Check if an admin already exists
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin user already exists.');
            process.exit();
        }

        // --- DEFINE YOUR ADMIN CREDENTIALS HERE ---
        const adminUser = {
            fullName: 'Administrator',
            username: 'admin',
            password: 'Almi.21',
            role: 'admin'
        };

        await User.create(adminUser);

        console.log('Admin user created successfully!');
        process.exit();

    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdminUser();