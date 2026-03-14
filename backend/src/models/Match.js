import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    matchNumber: {
      type: Number,
      required: true,
    },
    homeTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    awayTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    venue: {
      type: String,
      default: "TBD",
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    actualStartDate: {
      type: Date,
      default: null,
    },
    actualEndDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["DRAFT", "SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"],
      default: "DRAFT",
    },
    homeTeamScore: {
      type: Number,
      default: 0,
    },
    homeTeamWickets: {
      type: Number,
      default: 0,
    },
    awayTeamScore: {
      type: Number,
      default: 0,
    },
    awayTeamWickets: {
      type: Number,
      default: 0,
    },
    result: {
      type: String,
      enum: ["HOME_WIN", "AWAY_WIN", "TIE", "NO_RESULT"],
      default: null,
    },
    mvpPlayerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    playerStats: [
      {
        playerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Player",
        },
        runsScored: Number,
        ballsFaced: Number,
        wicketsTaken: Number,
        ballsBowled: Number,
        runsGiven: Number,
        catches: Number,
        runouts: Number,
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);
