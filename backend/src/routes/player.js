import express from "express";
import {
  registerPlayer,
  registerPlayerInTournament,
  getPlayerProfile,
  updatePlayerProfile,
  getTournamentPlayers,
  getAllPlayers,
  getAvailablePlayersForTournament,
} from "../controllers/playerController.js";
import { authMiddleware, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", authMiddleware, registerPlayer);
router.post("/register-tournament", authMiddleware, registerPlayerInTournament);
router.get("/profile", authMiddleware, getPlayerProfile);
router.put("/profile", authMiddleware, updatePlayerProfile);
router.get("/tournament/:tournamentId", getTournamentPlayers); // Public route
router.get("/all-players", getAllPlayers);                     // Public route
// Admin: list all players who can still be registered in a tournament
router.get("/available/:tournamentId", authMiddleware, authorize("ADMIN", "ORGANIZER", "SUPER_ADMIN"), getAvailablePlayersForTournament);

export default router;
