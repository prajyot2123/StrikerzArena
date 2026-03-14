import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const checkPlayers = async () => {
  try {
    await connectDB();
    const count = await User.countDocuments({ role: "PLAYER", email: { $regex: /p\d+@cricket\.com/ } });
    console.log(`Found ${count} player accounts.`);
    const players = await User.find({ role: "PLAYER", email: { $regex: /p\d+@cricket\.com/ } }, 'fullName email');
    console.log(players);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkPlayers();
