import Match from "../models/Match.js";
import Tournament from "../models/Tournament.js";

/**
 * Generates round-robin fixtures for a tournament.
 * @param {string} tournamentId 
 * @returns {Promise<number>} Number of fixtures generated
 */
export const generateRoundRobinFixtures = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId).populate("teams");
  if (!tournament) throw new Error("Tournament not found");

  const teams = tournament.teams;
  if (teams.length < 2) throw new Error("At least 2 teams are required to generate fixtures");

  // Clear existing matches for this tournament
  await Match.deleteMany({ tournamentId });

  const matches = [];
  let matchNumber = 1;

  // Standard Round Robin (Every team plays every other team once)
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        tournamentId,
        matchNumber: matchNumber++,
        homeTeamId: teams[i]._id,
        awayTeamId: teams[j]._id,
        status: "DRAFT",
        venue: "TBD",
        scheduledDate: tournament.firstMatchDate 
      });
    }
  }

  const createdMatches = await Match.insertMany(matches);
  
  // Transition tournament status to LIVE
  tournament.status = "LIVE";
  await tournament.save();

  return createdMatches.length;
};
