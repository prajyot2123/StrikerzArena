import express from "express";
import {
  createMatch,
  updateMatchStatus,
  updateMatchScore,
  updatePlayerStats,
  getTournamentMatches,
  getMatch,
  getLeaderboard,
  generateFixtures,
  scheduleMatch,
} from "../controllers/matchController.js";
import { authMiddleware, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", authMiddleware, authorize("ADMIN", "ORGANIZER"), createMatch);
router.put("/:matchId/status", authMiddleware, authorize("ADMIN"), updateMatchStatus);
router.put("/:matchId/score", authMiddleware, authorize("ADMIN"), updateMatchScore);
router.put("/:matchId/player-stats", authMiddleware, authorize("ADMIN"), updatePlayerStats);
router.get("/tournament/:tournamentId", getTournamentMatches); // Public
router.get("/:matchId", getMatch); // Public
router.get("/tournament/:tournamentId/leaderboard", getLeaderboard); // Public

// New: Fixture and Scheduling
router.post("/tournament/:tournamentId/generate-fixtures", authMiddleware, authorize("ADMIN", "ORGANIZER"), generateFixtures);
router.put("/:matchId/schedule", authMiddleware, authorize("ADMIN", "ORGANIZER"), scheduleMatch);

export default router;
