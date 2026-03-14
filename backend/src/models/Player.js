import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      enum: ["Batsman", "Bowler", "All-rounder", "Wicketkeeper"],
      required: true,
    },
    yearsOfExperience: {
      type: Number,
      required: true,
    },
    battingStyle: {
      type: String,
      enum: ["Right", "Left"],
      required: true,
    },
    bowlingStyle: {
      type: String,
      enum: ["Pace", "Spin", "Medium", "None"],
      default: "None",
    },
    contactDetails: {
      phone: String,
      address: String,
    },
    registeredInTournaments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tournament",
      },
    ],
    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "REGISTERED",
        "QUALIFIED", 
        "AUCTIONED",
        "REJECTED", 
        "SOLD", 
        "UNSOLD",
        "TOURNAMENT_COMPLETED",
        "FREE_AGENT"
      ],
      default: "AVAILABLE",
    },
    tournamentHistory: [
      {
        tournamentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Tournament",
        },
        teamId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
        },
        status: String,
        soldPrice: Number,
        category: String,
        score: Number,
      }
    ],
    category: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", null],
      default: null,
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    soldPrice: {
      type: Number,
      default: 0,
    },
    soldTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Player", playerSchema);
