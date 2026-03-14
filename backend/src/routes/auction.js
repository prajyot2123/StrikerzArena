import express from "express";
import {
  createTeam,
  getTeam,
  getTournamentTeams,
  placeBid,
  soldPlayer,
  unsoldPlayer,
  createAuction,
  getAuctions,
  getAuctionDetails,
  updateAuctionStatus,
  nextAuctionPlayer,
} from "../controllers/auctionController.js";
import { authMiddleware, authorize } from "../middleware/auth.js";

const router = express.Router();

const AUCTION_MANAGERS = ["ADMIN", "ORGANIZER", "SUPER_ADMIN"];

// Team endpoints
router.post("/team/create", authMiddleware, authorize("TEAM_OWNER"), createTeam);
router.get("/team/:teamId", getTeam); // Public
router.get("/tournament/:tournamentId/teams", getTournamentTeams); // Public

// Auction endpoints
router.post("/create", authMiddleware, authorize(...AUCTION_MANAGERS), createAuction);
router.get("/tournament/:tournamentId", getAuctions); // Public
router.get("/:auctionId", getAuctionDetails); // Public
router.put("/:auctionId/status", authMiddleware, authorize(...AUCTION_MANAGERS), updateAuctionStatus);
router.put("/:auctionId/next-player", authMiddleware, authorize(...AUCTION_MANAGERS), nextAuctionPlayer);

// Bidding endpoints
router.post("/bid/place", authMiddleware, authorize("TEAM_OWNER"), placeBid);
router.post("/:auctionId/player/sold", authMiddleware, authorize(...AUCTION_MANAGERS), soldPlayer);
router.post("/:auctionId/player/unsold", authMiddleware, authorize(...AUCTION_MANAGERS), unsoldPlayer);

export default router;
