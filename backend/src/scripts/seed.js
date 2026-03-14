import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Player from "../models/Player.js";
import Tournament from "../models/Tournament.js";
import TrialPerformance from "../models/TrialPerformance.js";
import Team from "../models/Team.js";
import { hashPassword } from "../utils/password.js";
import { classifyPlayer } from "../utils/mlService.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log("🧹 Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Player.deleteMany({}),
      Tournament.deleteMany({}),
      TrialPerformance.deleteMany({}),
      Team.deleteMany({}),
    ]);

    console.log("👤 Creating users...");

    // Super Admin
    const superAdmin = await User.create({
      email: "superadmin@cricket.com",
      password: await hashPassword("password123"),
      fullName: "Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    });

    // Organizer
    const organizer = await User.create({
      email: "organizer@cricket.com",
      password: await hashPassword("password123"),
      fullName: "Tournament Organizer",
      role: "ORGANIZER",
      isActive: true,
      createdBy: superAdmin._id,
    });

    // Admin
    const admin = await User.create({
      email: "admin@cricket.com",
      password: await hashPassword("password123"),
      fullName: "Tournament Admin",
      role: "ADMIN",
      isActive: true,
      organizerId: organizer._id,
    });

    // Team Owners
    const teamOwner1 = await User.create({
      email: "owner1@cricket.com",
      password: await hashPassword("password123"),
      fullName: "Team Owner 1",
      role: "TEAM_OWNER",
      isActive: true,
      organizerId: organizer._id,
    });

    const teamOwner2 = await User.create({
      email: "owner2@cricket.com",
      password: await hashPassword("password123"),
      fullName: "Team Owner 2",
      role: "TEAM_OWNER",
      isActive: true,
      organizerId: organizer._id,
    });

    // Player Accounts
    console.log("👤 Creating player login accounts...");
    const playerUsers = [
      {
        email: "virat@cricket.com",
        password: await hashPassword("password123"),
        fullName: "Virat Kohli",
        role: "PLAYER",
      },
      {
        email: "bumrah@cricket.com",
        password: await hashPassword("password123"),
        fullName: "Jasprit Bumrah",
        role: "PLAYER",
      },
      {
        email: "rohit@cricket.com",
        password: await hashPassword("password123"),
        fullName: "Rohit Sharma",
        role: "PLAYER",
      },
      {
        email: "rahul@cricket.com",
        password: await hashPassword("password123"),
        fullName: "KL Rahul",
        role: "PLAYER",
      },
      {
        email: "dhoni@cricket.com",
        password: await hashPassword("password123"),
        fullName: "MS Dhoni",
        role: "PLAYER",
      },
      {
        email: "chahal@cricket.com",
        password: await hashPassword("password123"),
        fullName: "Yuzvendra Chahal",
        role: "PLAYER",
      },
      {
        email: "hardik@cricket.com",
        password: await hashPassword("password123"),
        fullName: "Hardik Pandya",
        role: "PLAYER",
      },
      {
        email: "dhawan@cricket.com",
        password: await hashPassword("password123"),
        fullName: "Shikhar Dhawan",
        role: "PLAYER",
      },
    ];

    const createdPlayerUsers = await User.create(playerUsers);
    console.log(`✅ Created ${createdPlayerUsers.length} player accounts`);

    // Players
    const playerData = [
      {
        userId: createdPlayerUsers[0]._id,
        fullName: "Virat Kohli",
        age: 35,
        role: "Batsman",
        yearsOfExperience: 15,
        battingStyle: "Right",
        bowlingStyle: "None",
      },
      {
        userId: createdPlayerUsers[1]._id,
        fullName: "Jasprit Bumrah",
        age: 30,
        role: "Bowler",
        yearsOfExperience: 10,
        battingStyle: "Right",
        bowlingStyle: "Pace",
      },
      {
        userId: createdPlayerUsers[2]._id,
        fullName: "Rohit Sharma",
        age: 36,
        role: "Batsman",
        yearsOfExperience: 16,
        battingStyle: "Right",
        bowlingStyle: "None",
      },
      {
        userId: createdPlayerUsers[3]._id,
        fullName: "KL Rahul",
        age: 31,
        role: "All-rounder",
        yearsOfExperience: 12,
        battingStyle: "Right",
        bowlingStyle: "Medium",
      },
      {
        userId: createdPlayerUsers[4]._id,
        fullName: "MS Dhoni",
        age: 42,
        role: "Wicketkeeper",
        yearsOfExperience: 20,
        battingStyle: "Right",
        bowlingStyle: "None",
      },
      {
        userId: createdPlayerUsers[5]._id,
        fullName: "Yuzvendra Chahal",
        age: 32,
        role: "Bowler",
        yearsOfExperience: 10,
        battingStyle: "Right",
        bowlingStyle: "Spin",
      },
      {
        userId: createdPlayerUsers[6]._id,
        fullName: "Hardik Pandya",
        age: 30,
        role: "All-rounder",
        yearsOfExperience: 9,
        battingStyle: "Right",
        bowlingStyle: "Pace",
      },
      {
        userId: createdPlayerUsers[7]._id,
        fullName: "Shikhar Dhawan",
        age: 37,
        role: "Batsman",
        yearsOfExperience: 15,
        battingStyle: "Left",
        bowlingStyle: "None",
      },
    ];

    const players = await Player.create(playerData);
    console.log(`✅ Created ${players.length} players`);

    console.log("🏏 Creating tournament...");

    const now = new Date();
    const tournament = await Tournament.create({
      organizerId: organizer._id,
      name: "Cricket Premier League 2024",
      description: "Professional cricket tournament with ML-based player classification",
      format: "T20",
      totalTeams: 8,
      playersPerTeam: 11,
      pursePerTeam: 100000000, // ₹10 Crore
      registrationStartDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      trialsStartDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      trialsEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      auctionDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
      firstMatchDate: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000),
      status: "TRIALS",
      registeredPlayers: players.map((p) => p._id),
      admins: [admin._id],
      basePrices: {
        beginner: 1000000, // ₹10 Lakh
        intermediate: 3000000, // ₹30 Lakh
        advanced: 6000000, // ₹60 Lakh
      },
    });

    console.log("✅ Created tournament:", tournament.name);

    console.log("📊 Creating trial performances...");

    const trials = [
      {
        playerId: players[0]._id,
        tournamentId: tournament._id,
        battingSkill: 95,
        bowlingSkill: 20,
        fieldingSkill: 85,
        fitness: 90,
        matchAwareness: 92,
        yearsOfExperience: 15,
        evaluatedBy: admin._id,
        notes: "Exceptional batting, world-class performer",
      },
      {
        playerId: players[1]._id,
        tournamentId: tournament._id,
        battingSkill: 50,
        bowlingSkill: 98,
        fieldingSkill: 80,
        fitness: 95,
        matchAwareness: 88,
        yearsOfExperience: 10,
        evaluatedBy: admin._id,
        notes: "Outstanding bowler, excellent fitness",
      },
      {
        playerId: players[2]._id,
        tournamentId: tournament._id,
        battingSkill: 90,
        bowlingSkill: 30,
        fieldingSkill: 88,
        fitness: 85,
        matchAwareness: 90,
        yearsOfExperience: 12,
        evaluatedBy: admin._id,
        notes: "Consistent performer, strong leadership",
      },
      {
        playerId: players[3]._id,
        tournamentId: tournament._id,
        battingSkill: 80,
        bowlingSkill: 70,
        fieldingSkill: 82,
        fitness: 80,
        matchAwareness: 78,
        yearsOfExperience: 8,
        evaluatedBy: admin._id,
        notes: "Versatile all-rounder",
      },
      {
        playerId: players[4]._id,
        tournamentId: tournament._id,
        battingSkill: 85,
        bowlingSkill: 15,
        fieldingSkill: 88,
        fitness: 70,
        matchAwareness: 95,
        yearsOfExperience: 14,
        evaluatedBy: admin._id,
        notes: "Legendary keeper, great match IQ",
      },
      {
        playerId: players[5]._id,
        tournamentId: tournament._id,
        battingSkill: 45,
        bowlingSkill: 85,
        fieldingSkill: 75,
        fitness: 85,
        matchAwareness: 80,
        yearsOfExperience: 6,
        evaluatedBy: admin._id,
        notes: "Skilled spinner",
      },
      {
        playerId: players[6]._id,
        tournamentId: tournament._id,
        battingSkill: 75,
        bowlingSkill: 75,
        fieldingSkill: 80,
        fitness: 88,
        matchAwareness: 82,
        yearsOfExperience: 9,
        evaluatedBy: admin._id,
        notes: "Good all-rounder",
      },
      {
        playerId: players[7]._id,
        tournamentId: tournament._id,
        battingSkill: 85,
        bowlingSkill: 25,
        fieldingSkill: 80,
        fitness: 75,
        matchAwareness: 83,
        yearsOfExperience: 11,
        evaluatedBy: admin._id,
        notes: "Experienced batsman",
      },
    ];

    // Add ML classification to each trial
    for (let trial of trials) {
      try {
        const mlResult = await classifyPlayer(trial);
        trial.category = mlResult.category;
        trial.finalScore = mlResult.final_score;
        trial.confidence = mlResult.confidence;
      } catch (error) {
        // Fallback to deterministic classification
        const score = (trial.battingSkill * 0.3 + trial.bowlingSkill * 0.25 + trial.fieldingSkill * 0.15 + trial.fitness * 0.15 + trial.matchAwareness * 0.1 + trial.yearsOfExperience * 5);
        if (score < 45) {
          trial.category = "Beginner";
          trial.finalScore = score;
          trial.confidence = 0.75;
        } else if (score < 70) {
          trial.category = "Intermediate";
          trial.finalScore = score;
          trial.confidence = 0.75;
        } else {
          trial.category = "Advanced";
          trial.finalScore = score;
          trial.confidence = 0.75;
        }
      }
    }

    const trialsCreated = await TrialPerformance.create(trials);
    console.log(`✅ Created ${trialsCreated.length} trial performances`);

    console.log("🏢 Creating teams...");

    const team1 = await Team.create({
      tournamentId: tournament._id,
      ownerId: teamOwner1._id,
      name: "Green Warriors",
      shortName: "GW",
      colors: { primary: "#2d5016", secondary: "#d4af37" },
      totalPurse: 100000000,
      remainingPurse: 100000000,
      players: [
        { playerId: players[0]._id, biddedPrice: 15000000, role: "Batsman" },
        { playerId: players[1]._id, biddedPrice: 14000000, role: "Bowler" },
      ],
    });

    const team2 = await Team.create({
      tournamentId: tournament._id,
      ownerId: teamOwner2._id,
      name: "Golden Eagles",
      shortName: "GE",
      colors: { primary: "#d4af37", secondary: "#2d5016" },
      totalPurse: 100000000,
      remainingPurse: 100000000,
      players: [
        { playerId: players[2]._id, biddedPrice: 12000000, role: "Batsman" },
        { playerId: players[4]._id, biddedPrice: 13000000, role: "Wicketkeeper" },
      ],
    });

    tournament.teams.push(team1._id, team2._id);
    await tournament.save();

    console.log("✅ Created teams:", team1.name, team2.name);

    console.log("\n✨ Database seeding completed successfully!");
    console.log("\n📝 Sample Login Credentials:\n");
    console.log("  👑 Super Admin: superadmin@cricket.com / password123");
    console.log("  📊 Organizer: organizer@cricket.com / password123");
    console.log("  ⚙️  Admin: admin@cricket.com / password123");
    console.log("  👨‍💼 Team Owner 1: owner1@cricket.com / password123");
    console.log("  👨‍💼 Team Owner 2: owner2@cricket.com / password123");
    console.log("\n  🏏 Player Accounts:");
    console.log("    - virat@cricket.com / password123 (Virat Kohli)");
    console.log("    - bumrah@cricket.com / password123 (Jasprit Bumrah)");
    console.log("    - rohit@cricket.com / password123 (Rohit Sharma)");
    console.log("    - rahul@cricket.com / password123 (KL Rahul)");
    console.log("    - dhoni@cricket.com / password123 (MS Dhoni)");
    console.log("    - chahal@cricket.com / password123 (Yuzvendra Chahal)");
    console.log("    - hardik@cricket.com / password123 (Hardik Pandya)");
    console.log("    - dhawan@cricket.com / password123 (Shikhar Dhawan)\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
