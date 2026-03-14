import Player from "../models/Player.js";
import Tournament from "../models/Tournament.js";

export const registerPlayer = async (req, res) => {
  try {
    const { fullName, age, role, yearsOfExperience, battingStyle, bowlingStyle, phone, address } = req.body;

    if (!fullName || age === undefined || !role || yearsOfExperience === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newPlayer = new Player({
      userId: req.userId,
      fullName, age, role, yearsOfExperience,
      battingStyle,
      bowlingStyle: bowlingStyle || "None",
      contactDetails: { phone, address },
    });

    await newPlayer.save();
    res.status(201).json({ message: "Player registered successfully", player: newPlayer });
  } catch (error) {
    res.status(500).json({ message: "Player registration error", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const registerPlayerInTournament = async (req, res) => {
  try {
    const { playerId, tournamentId } = req.body;

    const [tournament, player] = await Promise.all([
      Tournament.findById(tournamentId),
      Player.findById(playerId),
    ]);

    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
    if (!player)     return res.status(404).json({ message: "Player not found" });

    // Date window check — bypassed for Admins, Organizers, and Super Admins
    const isPrivilegedRole = ["ADMIN", "ORGANIZER", "SUPER_ADMIN"].includes(req.userRole);
    if (!isPrivilegedRole) {
      const now = new Date();
      if (now < tournament.registrationStartDate || now > tournament.registrationEndDate) {
        return res.status(400).json({ message: "Registration window is closed" });
      }
    }

    // Check: already registered in THIS tournament?
    const alreadyRegistered = tournament.registeredPlayers.some(
      (id) => id.toString() === playerId.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({ message: "Player already registered in this tournament" });
    }

    // Check: only block if actively SOLD in an ongoing tournament
    if (player.status === "SOLD") {
      return res.status(400).json({ 
        message: "Player is currently sold to a team and cannot register for another tournament.",
        status: player.status 
      });
    }

    tournament.registeredPlayers.push(playerId);

    // Auto-create a PENDING attendance record for this player
    tournament.trialAttendance.push({ playerId, status: "PENDING", markedAt: null });

    player.registeredInTournaments.push(tournamentId);
    if (["AVAILABLE", "FREE_AGENT", "TOURNAMENT_COMPLETED", "UNSOLD", "REJECTED"].includes(player.status)) {
      player.status = "REGISTERED";
    }

    await Promise.all([tournament.save(), player.save()]);

    res.json({ message: "Player registered in tournament successfully", player, tournament });
  } catch (error) {
    res.status(500).json({ message: "Error registering player", error: error.message });
  }
};


// ─────────────────────────────────────────────
export const getPlayerProfile = async (req, res) => {
  try {
    const player = await Player.findOne({ userId: req.userId })
      .populate("registeredInTournaments")
      .exec();

    if (!player) return res.status(404).json({ message: "Player profile not found" });
    res.json({ player });
  } catch (error) {
    res.status(500).json({ message: "Error fetching player profile", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const updatePlayerProfile = async (req, res) => {
  try {
    const { age, battingStyle, bowlingStyle, phone, address } = req.body;

    const player = await Player.findOneAndUpdate(
      { userId: req.userId },
      { age, battingStyle, bowlingStyle, contactDetails: { phone, address } },
      { new: true }
    );

    if (!player) return res.status(404).json({ message: "Player not found" });
    res.json({ message: "Profile updated", player });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const getTournamentPlayers = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId).populate("registeredPlayers").exec();
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    res.json({ players: tournament.registeredPlayers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching players", error: error.message });
  }
};

// ─────────────────────────────────────────────
export const getAllPlayers = async (req, res) => {
  try {
    // Support pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [players, total] = await Promise.all([
      Player.find()
        .populate("userId", "fullName email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      Player.countDocuments()
    ]);

    res.json({
      players,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching all players", error: error.message });
  }
};

// ─────────────────────────────────────────────
// Get all players available to be registered in a specific tournament
// (not yet registered there, and not actively SOLD)
// ─────────────────────────────────────────────
export const getAvailablePlayersForTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    // Get IDs already registered in this tournament
    const registeredIds = tournament.registeredPlayers.map((id) => id.toString());

    // Get all players NOT in this tournament and NOT currently SOLD
    const availablePlayers = await Player.find({
      _id: { $nin: registeredIds },
      status: { $nin: ["SOLD"] },
    })
      .populate("userId", "fullName email")
      .select("fullName role yearsOfExperience battingStyle bowlingStyle status category")
      .sort({ createdAt: -1 })
      .exec();

    res.json({ players: availablePlayers, total: availablePlayers.length });
  } catch (error) {
    res.status(500).json({ message: "Error fetching available players", error: error.message });
  }
};