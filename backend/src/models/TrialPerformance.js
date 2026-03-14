import mongoose from "mongoose";

const trialPerformanceSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    battingSkill: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    bowlingSkill: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    fieldingSkill: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    fitness: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    matchAwareness: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    // ML Classification Results
    category: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: null,
    },
    finalScore: {
      type: Number,
      default: null,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for unique player-tournament evaluation
trialPerformanceSchema.index({ playerId: 1, tournamentId: 1 }, { unique: true });

export default mongoose.model("TrialPerformance", trialPerformanceSchema);
