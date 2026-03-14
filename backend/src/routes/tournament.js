import express from "express";
import {
  createTournament,
  updateTournamentStatus,
  getTournamentDetails,
  recordTrialPerformance,
  getTournamentTrials,
  getPlayerTrialResults,
  getOrganizerTournaments,
  getAllTournaments,
  getQualifiedPlayers,
  markAttendance,
  getTournamentAttendance,
} from "../controllers/tournamentController.js";
import { authMiddleware, authorize } from "../middleware/auth.js";

const router = express.Router();

const ORGANIZER_ROLES = ["ORGANIZER", "SUPER_ADMIN"];
const TRIAL_ROLES     = ["ADMIN", "SUPER_ADMIN", "ORGANIZER"];
const MANAGERS        = ["ADMIN", "ORGANIZER", "SUPER_ADMIN"];

// NOTE: Specific static routes must come BEFORE parameterized routes (:tournamentId)
router.get("/",                                          getAllTournaments);
router.get("/organizer/my-tournaments", authMiddleware, authorize(...ORGANIZER_ROLES), getOrganizerTournaments);
router.get("/player/:playerId/results",                 getPlayerTrialResults);  // Public

router.post("/create",        authMiddleware, authorize(...ORGANIZER_ROLES), createTournament);
router.post("/trial/record",  authMiddleware, authorize(...TRIAL_ROLES),     recordTrialPerformance);

router.get("/:tournamentId",                            getTournamentDetails);   // Public
router.put("/:tournamentId/status", authMiddleware, authorize(...MANAGERS),      updateTournamentStatus);
router.get("/:tournamentId/trials",                     getTournamentTrials);    // Public

// Qualified players for auction pool
router.get("/:tournamentId/qualified-players", authMiddleware, authorize(...MANAGERS), getQualifiedPlayers);

// Attendance management (Admin/Organizer)
router.get( "/:tournamentId/attendance", authMiddleware, authorize(...MANAGERS), getTournamentAttendance);
router.patch("/:tournamentId/attendance", authMiddleware, authorize(...MANAGERS), markAttendance);

export default router;
