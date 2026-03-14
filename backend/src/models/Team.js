import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    shortName: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      default: null,
    },
    colors: {
      primary: {
        type: String,
        default: "#000000",
      },
      secondary: {
        type: String,
        default: "#FFFFFF",
      },
    },
    totalPurse: {
      type: Number,
      required: true,
    },
    usedPurse: {
      type: Number,
      default: 0,
    },
    remainingPurse: {
      type: Number,
      required: true,
    },
    players: [
      {
        playerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Player",
        },
        biddedPrice: Number,
        role: String,
        _id: false,
      },
    ],
    status: {
      type: String,
      enum: ["FORMING", "COMPLETE", "ACTIVE", "INACTIVE"],
      default: "FORMING",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
