import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isWinningBid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for quick lookup of auction bids
bidSchema.index({ auctionId: 1, playerId: 1 });

export default mongoose.model("Bid", bidSchema);
