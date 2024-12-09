import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const testUsers = [
  {
    username: 'user1',
    email: 'user1@test.com',
    password: 'password123'
  },
  {
    username: 'user2',
    email: 'user2@test.com',
    password: 'password123'
  },
  {
    username: 'user3',
    email: 'user3@test.com',
    password: 'password123'
  }
];

const createTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = new User({
          ...userData,
          password: hashedPassword,
          createdAt: new Date().toISOString()
        });
        await user.save();
        console.log(`Created test user: ${userData.username}`);
      }
    }

    console.log('Test users created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
};

createTestUsers(); 