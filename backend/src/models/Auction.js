import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "LIVE", "PAUSED", "COMPLETED"],
      default: "SCHEDULED",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    currentPlayerIndex: {
      type: Number,
      default: 0,
    },
    minimumIncrement: {
      type: Number,
      default: 1000,
      min: 1,
    },
    playersToAuction: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
    soldPlayers: [
      {
        playerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Player",
        },
        teamId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
        },
        soldPrice: Number,
        soldTime: Date,
        _id: false,
      },
    ],
    unsoldPlayers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Auction", auctionSchema);
