import Tournament from "../models/Tournament.js";
import Player from "../models/Player.js";
import TrialPerformance from "../models/TrialPerformance.js";
import User from "../models/User.js";
import { classifyPlayer } from "../utils/mlService.js";
import { logAction } from "./auditController.js";

// ─────────────────────────────────────────────
// HELPER: Deterministic fallback classification
// ─────────────────────────────────────────────
const deterministicClassify = (battingSkill, bowlingSkill, fieldingSkill, fitness, matchAwareness, yearsOfExperience) => {
  const score =
    battingSkill    * 0.30 +
    bowlingSkill    * 0.25 +
    fieldingSkill   * 0.15 +
    fitness         * 0.15 +
    matchAwareness  * 0.10 +
    Math.min(yearsOfExperience * 2, 100) * 0.05;

  let category, basePrice;
  if (score < 45) {
    category  = "Beginner";
    basePrice = 50000;
  } else if (score < 70) {
    category  = "Intermediate";
    basePrice = 150000;
  } else {
    category  = "Advanced";
    basePrice = 300000;
  }

  return { score: Math.round(score * 100) / 100, category, basePrice };
};

// ─────────────────────────────────────────────
export const createTournament = async (req, res) => {
  try {
    if (req.userRole !== "ORGANIZER" && req.userRole !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Organizers or Super Admins can create tournaments" });
    }

    const {
      name, description, format, totalTeams, playersPerTeam, pursePerTeam,
      registrationStartDate, registrationEndDate, trialsStartDate, trialsEndDate,
      auctionDate, firstMatchDate, basePrices,
    } = req.body;

    if (!name || !totalTeams || !pursePerTeam) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (totalTeams < 2 || totalTeams > 8) {
      return res.status(400).json({ message: "Tournaments must have between 2 and 8 teams" });
    }

    if (!registrationStartDate || !registrationEndDate || !trialsStartDate || !trialsEndDate || !auctionDate || !firstMatchDate) {
      return res.status(400).json({ message: "All dates are required" });
    }

    const regStartDate       = new Date(registrationStartDate);
    const regEndDate         = new Date(registrationEndDate);
    const trialsStart        = new Date(trialsStartDate);
    const trialsEnd          = new Date(trialsEndDate);
    const auctionDateParsed  = new Date(auctionDate);
    const firstMatchParsed   = new Date(firstMatchDate);

    if ([regStartDate, regEndDate, trialsStart, trialsEnd, auctionDateParsed, firstMatchParsed].some(d => isNaN(d.getTime()))) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    const organizerIdToUse = req.userRole === "SUPER_ADMIN" && req.body.organizerId ? req.body.organizerId : req.userId;
    const normalizedFormat  = (format || "T20").toUpperCase();
    if (!["T20", "ODI", "TEST"].includes(normalizedFormat)) {
      return res.status(400).json({ message: "Invalid format. Allowed: T20, ODI, TEST" });
    }

    const newTournament = new Tournament({
      organizerId: organizerIdToUse,
      name, description,
      format: normalizedFormat,
      totalTeams,
      playersPerTeam: playersPerTeam || 11,
      pursePerTeam,
      registrationStartDate: regStartDate,
      registrationEndDate:   regEndDate,
      trialsStartDate:       trialsStart,
      trialsEndDate:         trialsEnd,
      auctionDate:           auctionDateParsed,
      firstMatchDate:        firstMatchParsed,
      basePrices: basePrices || { beginner: 1000, intermediate: 3000, advanced: 6000 },
    });

    await newTournament.save();

    const user = await User.findById(req.userId);
    await logAction(req.userId, user.email, "CREATE_TOURNAMENT", name, req);

    res.status(201).json({ message: "Tournament created successfully", tournament: newTournament });
  } catch (error) {
    console.error("Tournament creation error:", error);
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Error creating tournament", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const updateTournamentStatus = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { status, winnerTeamId } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    if (tournament.organizerId.toString() !== req.userId && req.userRole !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    tournament.status = status;
    if (status === "COMPLETED" && winnerTeamId) {
      tournament.winnerTeamId = winnerTeamId;
    }
    await tournament.save();

    // ── LIFECYCLE: Handle tournament completion ──
    if (status === "COMPLETED") {
      const teams = await Team.find({ tournamentId });
      
      for (const team of teams) {
        for (const p of team.players) {
          const player = await Player.findById(p.playerId);
          if (player) {
            // Archive current state into history
            player.tournamentHistory.push({
              tournamentId,
              teamId:       team._id,
              status:       "SOLD",
              soldPrice:    p.biddedPrice,
              category:     player.category,
            });

            player.status    = "TOURNAMENT_COMPLETED";
            // Clean up current tournament pointers
            player.soldTo    = null;
            player.soldPrice = 0;
            await player.save();
          }
        }
      }

      // Also Reset UNSOLD or QUALIFIED players who weren't picked
      await Player.updateMany(
        { 
          registeredInTournaments: tournamentId,
          status: { $in: ["QUALIFIED", "UNSOLD", "REGISTERED"] } 
        },
        { $set: { status: "AVAILABLE" } }
      );
    }

    res.json({ message: "Tournament status updated", tournament });
  } catch (error) {
    res.status(500).json({ message: "Error updating tournament", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const getTournamentDetails = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = await Tournament.findById(tournamentId)
      .populate("organizerId")
      .populate("admins")
      .populate("teams")
      .populate("winnerTeamId")
      .exec();

    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    res.json({ tournament });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tournament", error: error.message });
  }
};

// ─────────────────────────────────────────────
// CORE: Record trial → AUTO ML classification (fixed)
// ─────────────────────────────────────────────
// Roles allowed to record trial performances (must match route middleware)
const TRIAL_ROLES = ["ADMIN", "SUPER_ADMIN"];

export const recordTrialPerformance = async (req, res) => {
  try {
    if (!TRIAL_ROLES.includes(req.userRole)) {
      return res.status(403).json({ message: "Only Admins or Super Admins can record trial performance" });
    }

    const { playerId, tournamentId, battingSkill, bowlingSkill, fieldingSkill, fitness, matchAwareness, notes } = req.body;

    const [player, tournament] = await Promise.all([
      Player.findById(playerId),
      Tournament.findById(tournamentId),
    ]);

    if (!player)     return res.status(404).json({ message: "Player not found" });
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    // ── VALIDATE: Player must be registered in this tournament ──
    const isRegisteredInTournament = tournament.registeredPlayers.some(
      (id) => id.toString() === playerId.toString()
    );
    if (!isRegisteredInTournament) {
      return res.status(400).json({
        message: "Player is not registered in this tournament. Register the player first before recording a trial.",
        hint: "Use POST /api/players/register-tournament to register the player."
      });
    }

    // ── VALIDATE: Player must be marked PRESENT at trials ──
    const attendanceEntry = tournament.trialAttendance.find(
      (a) => a.playerId.toString() === playerId.toString()
    );
    if (!attendanceEntry || attendanceEntry.status !== "PRESENT") {
      const current = attendanceEntry?.status || "PENDING";
      return res.status(400).json({
        message: `Player attendance is '${current}'. Only PRESENT players can have trials recorded. Please mark the player as PRESENT first.`,
        attendanceStatus: current,
      });
    }

    // Check for existing evaluation for THIS tournament (per-tournament enforcement)
    const existingEvaluation = await TrialPerformance.findOne({ playerId, tournamentId });
    if (existingEvaluation) {
      return res.status(400).json({ message: "Player already evaluated for this tournament" });
    }

    const trialPerformance = new TrialPerformance({
      playerId, tournamentId,
      battingSkill, bowlingSkill, fieldingSkill, fitness, matchAwareness,
      notes,
      evaluatedBy: req.userId,
    });

    // ── AUTO ML CLASSIFICATION ──
    let classificationSource = "ml";
    try {
      const mlResult = await classifyPlayer({
        battingSkill,
        bowlingSkill,
        fieldingSkill,
        fitness,
        matchAwareness,
        yearsOfExperience: player.yearsOfExperience,
      });

      trialPerformance.category   = mlResult.category;
      trialPerformance.finalScore = mlResult.final_score;
      trialPerformance.confidence = mlResult.confidence;
      trialPerformance.basePrice  = mlResult.basePrice;

      // Update player's tournament-context fields (category/basePrice are used by auction)
      player.status    = "QUALIFIED";
      player.category  = mlResult.category;
      player.basePrice = mlResult.basePrice;

    } catch (mlError) {
      // ── DETERMINISTIC FALLBACK ──
      classificationSource = "fallback";
      console.error("ML Service unavailable, using deterministic fallback:", mlError.message);

      const { score, category, basePrice } = deterministicClassify(
        battingSkill, bowlingSkill, fieldingSkill, fitness, matchAwareness, player.yearsOfExperience
      );

      trialPerformance.category   = category;
      trialPerformance.finalScore = score;
      trialPerformance.confidence = 0.75;
      trialPerformance.basePrice  = basePrice;

      player.status    = "QUALIFIED";
      player.category  = category;
      player.basePrice = basePrice;
    }
    // ── END CLASSIFICATION ──

    await Promise.all([trialPerformance.save(), player.save()]);

    res.status(201).json({
      message: "Trial recorded & player classified successfully",
      trialPerformance,
      classificationSource,
    });
  } catch (error) {
    res.status(500).json({ message: "Error recording trial", error: error.message });
  }
};


// ─────────────────────────────────────────────
export const getTournamentTrials = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const trials = await TrialPerformance.find({ tournamentId })
      .populate("playerId")
      .populate("evaluatedBy")
      .exec();

    res.json({ trials });
  } catch (error) {
    res.status(500).json({ message: "Error fetching trials", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const getPlayerTrialResults = async (req, res) => {
  try {
    const { playerId } = req.params;
    const trials = await TrialPerformance.find({ playerId }).populate("tournamentId").exec();
    res.json({ trials });
  } catch (error) {
    res.status(500).json({ message: "Error fetching trial results", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const getOrganizerTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ organizerId: req.userId });
    res.json({ tournaments });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tournaments", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const getAllTournaments = async (req, res) => {
  try {
    // Support pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [tournaments, total] = await Promise.all([
      Tournament.find()
        .populate("organizerId", "fullName email")
        .populate("winnerTeamId")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      Tournament.countDocuments()
    ]);

    res.json({
      tournaments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tournaments", error: error.message });
  }
};

// ─────────────────────────────────────────────
// NEW: Get QUALIFIED players ready for auction
// Used by organizer when creating auction to auto-populate playersToAuction
// ─────────────────────────────────────────────
export const getQualifiedPlayers = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    // Get all QUALIFIED players registered in this tournament
    const qualifiedPlayers = await Player.find({
      _id: { $in: tournament.registeredPlayers },
      status: "QUALIFIED",
    }).select("fullName role category basePrice yearsOfExperience battingStyle bowlingStyle");

    res.json({
      tournamentId,
      qualifiedCount: qualifiedPlayers.length,
      players: qualifiedPlayers,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching qualified players", error: error.message });
  }
};

// ─────────────────────────────────────────────
// Admin: Mark a player's trial attendance for a tournament
// Body: { playerId, status: 'PRESENT' | 'ABSENT' }
// ─────────────────────────────────────────────
export const markAttendance = async (req, res) => {
  try {
    if (!["ADMIN", "SUPER_ADMIN"].includes(req.userRole)) {
      return res.status(403).json({ message: "Only Admins or Super Admins can mark attendance" });
    }

    const { tournamentId } = req.params;
    const { playerId, status } = req.body;

    if (!["PRESENT", "ABSENT", "PENDING"].includes(status)) {
      return res.status(400).json({ message: "Status must be PRESENT, ABSENT, or PENDING" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    // Player must be registered
    const isRegistered = tournament.registeredPlayers.some(
      (id) => id.toString() === playerId.toString()
    );
    if (!isRegistered) {
      return res.status(400).json({ message: "Player is not registered in this tournament" });
    }

    // Upsert the attendance entry
    const existing = tournament.trialAttendance.find(
      (a) => a.playerId.toString() === playerId.toString()
    );
    if (existing) {
      existing.status   = status;
      existing.markedAt = new Date();
    } else {
      tournament.trialAttendance.push({ playerId, status, markedAt: new Date() });
    }

    await tournament.save();

    res.json({
      message: `Attendance marked as ${status}`,
      playerId,
      status,
    });
  } catch (error) {
    res.status(500).json({ message: "Error marking attendance", error: error.message });
  }
};

// ─────────────────────────────────────────────
// Admin: Get all attendance records for a tournament (with player details)
// ─────────────────────────────────────────────
export const getTournamentAttendance = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId)
      .populate("trialAttendance.playerId", "fullName role yearsOfExperience battingStyle bowlingStyle status category")
      .exec();

    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    // Also populate registered players who may not yet have attendance entries
    const registeredPlayers = await Player.find({
      _id: { $in: tournament.registeredPlayers },
    }).select("fullName role yearsOfExperience battingStyle bowlingStyle status category");

    // Build a map from existing attendance
    const attendanceMap = {};
    for (const a of tournament.trialAttendance) {
      const pid = a.playerId?._id?.toString() || a.playerId?.toString();
      if (pid) attendanceMap[pid] = { status: a.status, markedAt: a.markedAt, player: a.playerId };
    }

    // Merge: every registered player gets an attendance status
    const attendance = registeredPlayers.map((player) => ({
      playerId: player._id,
      player,
      status:   attendanceMap[player._id.toString()]?.status   || "PENDING",
      markedAt: attendanceMap[player._id.toString()]?.markedAt || null,
    }));

    res.json({ attendance, tournamentId });
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance", error: error.message });
  }
};