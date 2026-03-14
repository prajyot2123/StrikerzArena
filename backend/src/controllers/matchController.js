import Match from "../models/Match.js";
import Tournament from "../models/Tournament.js";
import { generateRoundRobinFixtures } from "../services/fixtureService.js";

export const createMatch = async (req, res) => {
  try {
    if (req.userRole !== "ADMIN" && req.userRole !== "ORGANIZER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { tournamentId, matchNumber, homeTeamId, awayTeamId, venue, scheduledDate } = req.body;

    if (!tournamentId || !matchNumber || !homeTeamId || !awayTeamId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newMatch = new Match({
      tournamentId,
      matchNumber,
      homeTeamId,
      awayTeamId,
      venue,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
    });

    await newMatch.save();

    res.status(201).json({
      message: "Match created successfully",
      match: newMatch,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating match", error: error.message });
  }
};

export const generateFixtures = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const count = await generateRoundRobinFixtures(tournamentId);

    res.status(201).json({
      message: `${count} fixtures generated and tournament transitioned to LIVE.`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating fixtures", error: error.message });
  }
};

export const updateMatchStatus = async (req, res) => {
  try {
    if (req.userRole !== "ADMIN") {
      return res.status(403).json({ message: "Only Admins can update match status" });
    }

    const { matchId } = req.params;
    const { status, actualStartDate, actualEndDate } = req.body;

    const match = await Match.findByIdAndUpdate(
      matchId,
      {
        status,
        actualStartDate: actualStartDate ? new Date(actualStartDate) : undefined,
        actualEndDate: actualEndDate ? new Date(actualEndDate) : undefined,
      },
      { new: true }
    );

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.json({
      message: "Match status updated",
      match,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating match", error: error.message });
  }
};

export const updateMatchScore = async (req, res) => {
  try {
    if (req.userRole !== "ADMIN") {
      return res.status(403).json({ message: "Only Admins can update match score" });
    }

    const { matchId } = req.params;
    const { homeTeamScore, homeTeamWickets, awayTeamScore, awayTeamWickets, result, mvpPlayerId } =
      req.body;

    const match = await Match.findByIdAndUpdate(
      matchId,
      {
        homeTeamScore,
        homeTeamWickets,
        awayTeamScore,
        awayTeamWickets,
        result,
        mvpPlayerId,
        status: "COMPLETED",
      },
      { new: true }
    );

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.json({
      message: "Match score updated",
      match,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating score", error: error.message });
  }
};

export const updatePlayerStats = async (req, res) => {
  try {
    if (req.userRole !== "ADMIN") {
      return res.status(403).json({ message: "Only Admins can update player stats" });
    }

    const { matchId } = req.params;
    const { playerId, runsScored, ballsFaced, wicketsTaken, ballsBowled, runsGiven, catches, runouts } =
      req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Find or create player stat entry
    let playerStat = match.playerStats.find((stat) => stat.playerId.toString() === playerId);

    if (!playerStat) {
      match.playerStats.push({
        playerId,
        runsScored: runsScored || 0,
        ballsFaced: ballsFaced || 0,
        wicketsTaken: wicketsTaken || 0,
        ballsBowled: ballsBowled || 0,
        runsGiven: runsGiven || 0,
        catches: catches || 0,
        runouts: runouts || 0,
      });
    } else {
      playerStat.runsScored = runsScored || playerStat.runsScored;
      playerStat.ballsFaced = ballsFaced || playerStat.ballsFaced;
      playerStat.wicketsTaken = wicketsTaken || playerStat.wicketsTaken;
      playerStat.ballsBowled = ballsBowled || playerStat.ballsBowled;
      playerStat.runsGiven = runsGiven || playerStat.runsGiven;
      playerStat.catches = catches || playerStat.catches;
      playerStat.runouts = runouts || playerStat.runouts;
    }

    await match.save();

    res.json({
      message: "Player stats updated",
      match,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating player stats", error: error.message });
  }
};

export const scheduleMatch = async (req, res) => {
  try {
    if (req.userRole !== "ORGANIZER" && req.userRole !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { matchId } = req.params;
    const { venue, scheduledDate } = req.body;

    const match = await Match.findByIdAndUpdate(
      matchId,
      { 
        venue: venue || "TBD", 
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: "SCHEDULED" 
      },
      { new: true }
    );

    if (!match) return res.status(404).json({ message: "Match not found" });

    res.json({ message: "Match scheduled successfully", match });
  } catch (error) {
    res.status(500).json({ message: "Error scheduling match", error: error.message });
  }
};

export const getTournamentMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const matches = await Match.find({ tournamentId })
      .populate("homeTeamId", "name shortName logo")
      .populate("awayTeamId", "name shortName logo")
      .populate("mvpPlayerId", "fullName")
      .sort({ matchNumber: 1 })
      .exec();

    res.json({ matches });
  } catch (error) {
    res.status(500).json({ message: "Error fetching matches", error: error.message });
  }
};

export const getMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate("homeTeamId", "name shortName logo")
      .populate("awayTeamId", "name shortName logo")
      .populate("playerStats.playerId", "fullName role")
      .populate("mvpPlayerId", "fullName")
      .exec();

    if (!match) return res.status(404).json({ message: "Match not found" });
    res.json({ match });
  } catch (error) {
    res.status(500).json({ message: "Error fetching match", error: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const [tournament, matches] = await Promise.all([
      Tournament.findById(tournamentId).populate("teams"),
      Match.find({ tournamentId, status: "COMPLETED" })
    ]);

    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    const teamStats = {};
    tournament.teams.forEach(team => {
      teamStats[team._id.toString()] = {
        teamId: team._id,
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
        played: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        points: 0
      };
    });

    matches.forEach((match) => {
      const homeId = match.homeTeamId.toString();
      const awayId = match.awayTeamId.toString();

      if (teamStats[homeId]) teamStats[homeId].played++;
      if (teamStats[awayId]) teamStats[awayId].played++;

      if (match.result === "HOME_WIN") {
        if (teamStats[homeId]) { teamStats[homeId].wins++; teamStats[homeId].points += 2; }
        if (teamStats[awayId]) { teamStats[awayId].losses++; }
      } else if (match.result === "AWAY_WIN") {
        if (teamStats[awayId]) { teamStats[awayId].wins++; teamStats[awayId].points += 2; }
        if (teamStats[homeId]) { teamStats[homeId].losses++; }
      } else if (match.result === "TIE") {
        if (teamStats[homeId]) { teamStats[homeId].ties++; teamStats[homeId].points += 1; }
        if (teamStats[awayId]) { teamStats[awayId].ties++; teamStats[awayId].points += 1; }
      }
    });

    const leaderboard = Object.values(teamStats)
      .sort((a, b) => b.points - a.points || b.wins - a.wins)
      .map((stat, index) => ({
        position: index + 1,
        ...stat,
      }));

    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard", error: error.message });
  }
};

