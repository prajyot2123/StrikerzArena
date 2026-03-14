import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    format: {
      type: String,
      enum: ["T20", "ODI", "TEST"],
      default: "T20",
    },
    totalTeams: {
      type: Number,
      required: true,
    },
    playersPerTeam: {
      type: Number,
      default: 11,
    },
    pursePerTeam: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    // Base prices (configurable by organizer)
    basePrices: {
      beginner: {
        type: Number,
        default: 1000,
      },
      intermediate: {
        type: Number,
        default: 3000,
      },
      advanced: {
        type: Number,
        default: 6000,
      },
    },
    registrationStartDate: {
      type: Date,
      required: true,
    },
    registrationEndDate: {
      type: Date,
      required: true,
    },
    trialsStartDate: {
      type: Date,
      required: true,
    },
    trialsEndDate: {
      type: Date,
      required: true,
    },
    auctionDate: {
      type: Date,
      required: true,
    },
    firstMatchDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "REGISTRATION", "TRIALS", "AUCTION", "LIVE", "COMPLETED"],
      default: "DRAFT",
    },
    registeredPlayers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    auctions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auction",
      },
    ],
    // Tracks physical trial attendance per player (PENDING / PRESENT / ABSENT)
    trialAttendance: [
      {
        playerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Player",
          required: true,
        },
        status: {
          type: String,
          enum: ["PENDING", "PRESENT", "ABSENT"],
          default: "PENDING",
        },
        markedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    winnerTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Tournament", tournamentSchema);
