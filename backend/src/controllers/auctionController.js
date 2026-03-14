import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import Auction from "../models/Auction.js";
import Player from "../models/Player.js";
import {
  placeBidWithValidation,
  finalizeAuctionForCurrentPlayer,
  markCurrentPlayerUnsold,
  getAuctionState,
} from "../services/auctionService.js";
import { generateRoundRobinFixtures } from "../services/fixtureService.js";

// ─────────────────────────────────────────────
export const createTeam = async (req, res) => {
  try {
    if (req.userRole !== "TEAM_OWNER") {
      return res.status(403).json({ message: "Only Team Owners can create teams" });
    }

    const { tournamentId, name, shortName, colors } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    const existingTeam = await Team.findOne({ tournamentId, ownerId: req.userId });
    if (existingTeam) return res.status(400).json({ message: "You already have a team for this tournament" });

    const minimumPurse  = 1000000;
    const initialPurse  = Math.max(Number(tournament.pursePerTeam) || 0, minimumPurse);

    const newTeam = new Team({
      tournamentId,
      ownerId:        req.userId,
      name,
      shortName,
      colors:         colors || { primary: "#000000", secondary: "#FFFFFF" },
      totalPurse:     initialPurse,
      remainingPurse: initialPurse,
    });

    await newTeam.save();
    tournament.teams.push(newTeam._id);
    await tournament.save();

    res.status(201).json({ message: "Team created successfully", team: newTeam });
  } catch (error) {
    res.status(500).json({ message: "Error creating team", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate({ path: "players.playerId", model: "Player" })
      .populate("ownerId")
      .exec();

    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json({ team });
  } catch (error) {
    res.status(500).json({ message: "Error fetching team", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const getTournamentTeams = async (req, res) => {
  try {
    const teams = await Team.find({ tournamentId: req.params.tournamentId })
      .populate("ownerId")
      .populate({ path: "players.playerId", model: "Player" })
      .exec();

    res.json({ teams });
  } catch (error) {
    res.status(500).json({ message: "Error fetching teams", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const placeBid = async (req, res) => {
  try {
    if (req.userRole !== "TEAM_OWNER") {
      return res.status(403).json({ message: "Only Team Owners can bid" });
    }

    const { auctionId, playerId, teamId, amount } = req.body;
    const result = await placeBidWithValidation({ auctionId, playerId, teamId, ownerId: req.userId, amount });

    res.status(201).json({ message: "Bid placed successfully", bid: result.bid });
  } catch (error) {
    const code = error.message?.includes("not found") ? 404
                : error.message?.includes("must be") || error.message?.includes("live") || error.message?.includes("insufficient") ? 400
                : 500;
    res.status(code).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// FIXED: soldPlayer → finalize WITH highest bid winner
// ─────────────────────────────────────────────
export const soldPlayer = async (req, res) => {
  try {
    if (!['ADMIN', 'ORGANIZER', 'SUPER_ADMIN'].includes(req.userRole)) {
      return res.status(403).json({ message: 'Only Admins/Organizers can confirm player sales' });
    }

    const { auctionId } = req.params;
    const result = await finalizeAuctionForCurrentPlayer(auctionId);

    res.json({
      message:     result.sold ? "Player sold successfully" : "No bids found — player marked unsold",
      auction:     result.auction,
      sold:        result.sold,
      unsold:      result.unsold,
      winningTeam: result.winningTeam?.name,
      soldPrice:   result.soldPrice,
    });
  } catch (error) {
    res.status(500).json({ message: "Error selling player", error: error.message });
  }
};

// ─────────────────────────────────────────────
// FIXED: unsoldPlayer → explicitly marks unsold, skips bid check
// ─────────────────────────────────────────────
export const unsoldPlayer = async (req, res) => {
  try {
    if (!['ADMIN', 'ORGANIZER', 'SUPER_ADMIN'].includes(req.userRole)) {
      return res.status(403).json({ message: 'Only Admins/Organizers can mark players as unsold' });
    }

    const { auctionId } = req.params;
    const result = await markCurrentPlayerUnsold(auctionId);

    res.json({
      message: "Player marked as unsold",
      auction: result.auction,
      unsold:  true,
    });
  } catch (error) {
    res.status(500).json({ message: "Error marking player as unsold", error: error.message });
  }
};

// ─────────────────────────────────────────────
// FIXED: createAuction — auto-populates QUALIFIED players if none specified
// ─────────────────────────────────────────────
export const createAuction = async (req, res) => {
  try {
    if (!['ADMIN', 'ORGANIZER', 'SUPER_ADMIN'].includes(req.userRole)) {
      return res.status(403).json({ message: "Only Admins/Organizers/Super Admins can create auctions" });
    }

    const { tournamentId, startTime, playersToAuction, minimumIncrement } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    // ── AUTO-POPULATE: If no players specified, pull all QUALIFIED players from this tournament ──
    let finalPlayersToAuction = playersToAuction;
    if (!finalPlayersToAuction || finalPlayersToAuction.length === 0) {
      const qualifiedPlayers = await Player.find({
        _id:    { $in: tournament.registeredPlayers },
        status: "QUALIFIED",
      }).select("_id");

      finalPlayersToAuction = qualifiedPlayers.map(p => p._id);
    }

    if (finalPlayersToAuction.length === 0) {
      return res.status(400).json({
        message: "No qualified players found for this tournament. Record trial performances first.",
      });
    }

    const newAuction = new Auction({
      tournamentId,
      startTime:         startTime ? new Date(startTime) : new Date(), // default to now if not provided
      playersToAuction:  finalPlayersToAuction,
      minimumIncrement:  Number(minimumIncrement) > 0 ? Number(minimumIncrement) : 1000,
      status:            "SCHEDULED",
      currentPlayerIndex: 0,
      soldPlayers:        [],
      unsoldPlayers:      [],
    });

    await newAuction.save();
    tournament.auctions.push(newAuction._id);
    await tournament.save();

    res.status(201).json({
      message:            "Auction created successfully",
      auction:            newAuction,
      playersCount:       finalPlayersToAuction.length,
      autoPopulated:      !playersToAuction || playersToAuction.length === 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating auction", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ tournamentId: req.params.tournamentId })
      .populate("playersToAuction")
      .populate("soldPlayers.playerId")
      .populate("soldPlayers.teamId")
      .populate("unsoldPlayers")
      .sort({ createdAt: -1 })
      .exec();

    res.json({ auctions });
  } catch (error) {
    res.status(500).json({ message: "Error fetching auctions", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const getAuctionDetails = async (req, res) => {
  try {
    const { auction, currentPlayer, recentBids } = await getAuctionState(req.params.auctionId);
    res.json({ auction, currentPlayer, recentBids });
  } catch (error) {
    res.status(500).json({ message: "Error fetching auction details", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const updateAuctionStatus = async (req, res) => {
  try {
    if (!['ADMIN', 'ORGANIZER', 'SUPER_ADMIN'].includes(req.userRole)) {
      return res.status(403).json({ message: 'Only Admins/Organizers can update auction status' });
    }

    const { status } = req.body;
    if (!["SCHEDULED", "LIVE", "PAUSED", "COMPLETED"].includes(status)) {
      return res.status(400).json({ message: "Invalid auction status" });
    }

    const auction = await Auction.findByIdAndUpdate(
      req.params.auctionId,
      { status },
      { new: true, runValidators: true }
    );

    if (!auction) return res.status(404).json({ message: "Auction not found" });

    // ── AUTO FIXTURES: Generate round-robin matches when auction completes ──
    if (status === "COMPLETED") {
      try {
        await generateRoundRobinFixtures(auction.tournamentId);
      } catch (fixtureError) {
        console.error("Fixture generation failed:", fixtureError.message);
      }
    }

    res.json({ message: "Auction status updated successfully", auction });
  } catch (error) {
    res.status(500).json({ message: "Error updating auction status", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const nextAuctionPlayer = async (req, res) => {
  try {
    if (!['ADMIN', 'ORGANIZER', 'SUPER_ADMIN'].includes(req.userRole)) {
      return res.status(403).json({ message: 'Only Admins/Organizers can advance to next player' });
    }

    const result = await finalizeAuctionForCurrentPlayer(req.params.auctionId);

    res.json({
      message:            result.auctionEnded ? "All players auctioned — auction complete!" : "Moved to next player",
      auction:            result.auction,
      currentPlayer:      result.nextPlayer || null,
      currentPlayerIndex: result.auction.currentPlayerIndex,
      auctionEnded:       result.auctionEnded,
      sold:               result.sold,
      unsold:             result.unsold,
    });
  } catch (error) {
    res.status(500).json({ message: "Error advancing to next player", error: error.message });
  }
};