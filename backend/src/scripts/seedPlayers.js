import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Player from '../models/Player.js';
import { hashPassword } from '../utils/password.js';

dotenv.config();

const playersData = [
  {
    fullName: "Aarav Sharma",
    email: "p1@cricket.com",
    password: "password123",
    age: 18,
    role: "Batsman",
    experience: 0,
    battingStyle: "Right",
    bowlingStyle: "None"
  },
  {
    fullName: "Rohan Patil",
    email: "p2@cricket.com",
    password: "password123",
    age: 19,
    role: "Bowler",
    experience: 1,
    battingStyle: "Right",
    bowlingStyle: "Pace"
  },
  {
    fullName: "Kunal Deshmukh",
    email: "p3@cricket.com",
    password: "password123",
    age: 20,
    role: "All-rounder",
    experience: 2,
    battingStyle: "Left",
    bowlingStyle: "Medium"
  },
  {
    fullName: "Aditya Kulkarni",
    email: "p4@cricket.com",
    password: "password123",
    age: 22,
    role: "Batsman",
    experience: 4,
    battingStyle: "Right",
    bowlingStyle: "None"
  },
  {
    fullName: "Saurabh Jadhav",
    email: "p5@cricket.com",
    password: "password123",
    age: 23,
    role: "Wicketkeeper",
    experience: 5,
    battingStyle: "Right",
    bowlingStyle: "None"
  },
  {
    fullName: "Pratik More",
    email: "p6@cricket.com",
    password: "password123",
    age: 25,
    role: "Bowler",
    experience: 6,
    battingStyle: "Left",
    bowlingStyle: "Spin"
  },
  {
    fullName: "Nikhil Pawar",
    email: "p7@cricket.com",
    password: "password123",
    age: 26,
    role: "All-rounder",
    experience: 7,
    battingStyle: "Right",
    bowlingStyle: "Medium"
  },
  {
    fullName: "Rahul Chavan",
    email: "p8@cricket.com",
    password: "password123",
    age: 28,
    role: "Batsman",
    experience: 9,
    battingStyle: "Left",
    bowlingStyle: "None"
  },
  {
    fullName: "Vivek Joshi",
    email: "p9@cricket.com",
    password: "password123",
    age: 30,
    role: "Bowler",
    experience: 11,
    battingStyle: "Right",
    bowlingStyle: "Pace"
  },
  {
    fullName: "Sameer Naik",
    email: "p10@cricket.com",
    password: "password123",
    age: 32,
    role: "All-rounder",
    experience: 14,
    battingStyle: "Right",
    bowlingStyle: "Pace"
  }
];

const seedPlayers = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB...");

    for (const p of playersData) {
      // Check if user exists
      const existingUser = await User.findOne({ email: p.email });
      if (existingUser) {
        console.log(`User ${p.email} already exists, skipping...`);
        continue;
      }

      console.log(`Creating user: ${p.email}...`);
      const hashedPassword = await hashPassword(p.password);
      const user = new User({
        email: p.email,
        password: hashedPassword,
        fullName: p.fullName,
        role: "PLAYER",
      });
      await user.save();

      const player = new Player({
        userId: user._id,
        fullName: p.fullName,
        age: p.age,
        role: p.role,
        yearsOfExperience: p.experience,
        battingStyle: p.battingStyle,
        bowlingStyle: p.bowlingStyle,
        status: "AVAILABLE",
        contactDetails: {
          phone: "1234567890",
          address: "123 Cricket Lane"
        }
      });
      await player.save();
      console.log(`Player profile created for ${p.fullName}.`);
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding players:", error);
    process.exit(1);
  }
};

seedPlayers();
