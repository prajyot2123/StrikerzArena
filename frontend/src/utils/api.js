import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally (token expired / invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale credentials
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (email, password, fullName) =>
    api.post('/auth/register', { email, password, fullName }),
  // Full player registration (creates User + Player in one call)
  registerPlayer: (playerData) =>
    api.post('/auth/register-player', playerData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me'),
};

export const userAPI = {
  createOrganizer: (email, fullName) =>
    api.post('/users/create-organizer', { email, fullName }),
  createAdmin: (email, fullName) =>
    api.post('/users/create-admin', { email, fullName }),
  createTeamOwner: (email, fullName) =>
    api.post('/users/create-team-owner', { email, fullName }),
  getAllUsers: () => api.get('/users/all-users'),
  toggleStatus: (userId) => api.patch(`/users/${userId}/toggle-status`),
};

export const playerAPI = {
  // Register a standalone player profile (for already logged-in users)
  register: (playerData) => api.post('/players/register', playerData),
  // Register the logged-in player in a tournament
  registerInTournament: (playerId, tournamentId) =>
    api.post('/players/register-tournament', { playerId, tournamentId }),
  // Get current user's player profile
  getProfile: () => api.get('/players/profile'),
  // Update current user's player profile
  updateProfile: (profileData) => api.put('/players/profile', profileData),
  // Get all registered players in a tournament
  getTournamentPlayers: (tournamentId) =>
    api.get(`/players/tournament/${tournamentId}`),
  getAllPlayers: () =>
    api.get('/players/all-players'),
  // Get a player's trial results across tournaments
  getPlayerTrials: (playerId) =>
    api.get(`/tournaments/player/${playerId}/results`),
};


export const tournamentAPI = {
  create: (tournamentData) =>
    api.post('/tournaments/create', tournamentData),
  getDetails: (tournamentId) =>
    api.get(`/tournaments/${tournamentId}`),
  updateStatus: (tournamentId, status, winnerTeamId = null) =>
    api.put(`/tournaments/${tournamentId}/status`, { status, winnerTeamId }),
  // Record trial performance (ADMIN only) — triggers ML classification
  recordTrial: (trialData) =>
    api.post('/tournaments/trial/record', trialData),
  getTournamentTrials: (tournamentId) =>
    api.get(`/tournaments/${tournamentId}/trials`),
  getPlayerTrialResults: (playerId) =>
    api.get(`/tournaments/player/${playerId}/results`),
  getOrganizerTournaments: () =>
    api.get('/tournaments/organizer/my-tournaments'),
  getAllTournaments: () => api.get('/tournaments'),
  // Get only QUALIFIED players for auction creation
  getQualifiedPlayers: (tournamentId) =>
    api.get(`/tournaments/${tournamentId}/qualified-players`),
  // Attendance management
  getAttendance: (tournamentId) =>
    api.get(`/tournaments/${tournamentId}/attendance`),
  markAttendance: (tournamentId, playerId, status) =>
    api.patch(`/tournaments/${tournamentId}/attendance`, { playerId, status }),
};

export const auctionAPI = {
  createTeam: (teamData) =>
    api.post('/auction/team/create', teamData),
  getTeam: (teamId) =>
    api.get(`/auction/team/${teamId}`),
  getTournamentTeams: (tournamentId) =>
    api.get(`/auction/tournament/${tournamentId}/teams`),
  placeBid: (bidData) =>
    api.post('/auction/bid/place', bidData),
  soldPlayer: (auctionId, saleData) =>
    api.post(`/auction/${auctionId}/player/sold`, saleData),
  unsoldPlayer: (auctionId, unsoldData) =>
    api.post(`/auction/${auctionId}/player/unsold`, unsoldData),
  // Create auction — pass empty playersToAuction to auto-populate QUALIFIED players
  createAuction: (auctionData) =>
    api.post('/auction/create', auctionData),
  getAuctions: (tournamentId) =>
    api.get(`/auction/tournament/${tournamentId}`),
  getAuctionDetails: (auctionId) =>
    api.get(`/auction/${auctionId}`),
  updateAuctionStatus: (auctionId, status) =>
    api.put(`/auction/${auctionId}/status`, { status }),
  nextAuctionPlayer: (auctionId) =>
    api.put(`/auction/${auctionId}/next-player`, {}),
};

export const matchAPI = {
  create: (matchData) =>
    api.post('/matches/create', matchData),
  updateStatus: (matchId, statusData) =>
    api.put(`/matches/${matchId}/status`, statusData),
  updateScore: (matchId, scoreData) =>
    api.put(`/matches/${matchId}/score`, scoreData),
  updatePlayerStats: (matchId, statsData) =>
    api.put(`/matches/${matchId}/player-stats`, statsData),
  getTournamentMatches: (tournamentId) =>
    api.get(`/matches/tournament/${tournamentId}`),
  getMatch: (matchId) =>
    api.get(`/matches/${matchId}`),
  getLeaderboard: (tournamentId) =>
    api.get(`/matches/tournament/${tournamentId}/leaderboard`),
  generateFixtures: (tournamentId) =>
    api.post(`/matches/tournament/${tournamentId}/generate-fixtures`),
  scheduleMatch: (matchId, scheduleData) =>
    api.put(`/matches/${matchId}/schedule`, scheduleData),
};

export const auditAPI = {
  getAllLogs: () => api.get('/audit'),
  getLogsForUser: (userId) =>
    api.get(`/audit/user/${userId}`),
};

export const reportsAPI = {
  getPlatformOverview: () => api.get('/stats/platform-overview'),
  emailReport: (email, reportType) => api.post('/stats/email', { email, reportType }),
  scheduleReport: (frequency, reportType) => api.post('/stats/schedule', { frequency, reportType }),
};

export default api;
