import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Users, TrendingUp, PlusCircle } from 'lucide-react';
import { auctionAPI, tournamentAPI } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

const TeamOwnerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [tournamentsWithoutTeam, setTournamentsWithoutTeam] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [createForm, setCreateForm] = useState({
    tournamentId: '',
    name: '',
    shortName: '',
    primary: '#1f2937',
    secondary: '#d4af37',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadTeamData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');

    try {
      const tournamentsRes = await tournamentAPI.getAllTournaments();
      const allTournaments = tournamentsRes.data.tournaments || [];

      const teamResults = await Promise.all(
        allTournaments.map(async (tournament) => {
          const teamsRes = await auctionAPI.getTournamentTeams(tournament._id);
          return {
            tournament,
            teams: teamsRes.data.teams || [],
          };
        })
      );

      const ownedTeams = [];
      const createdTournamentIds = new Set();

      teamResults.forEach(({ tournament, teams: tournamentTeams }) => {
        tournamentTeams.forEach((team) => {
          const owner = team.ownerId;
          const ownerId = owner?._id || owner;
          if (ownerId?.toString() === user.id.toString()) {
            ownedTeams.push({ ...team, tournament });
            createdTournamentIds.add(tournament._id.toString());
          }
        });
      });

      const available = allTournaments.filter(
        (t) => !createdTournamentIds.has(t._id.toString())
      );

      setTeams(ownedTeams);
      setTournamentsWithoutTeam(available);

      const nextSelectedTeamId = ownedTeams[0]?._id || '';
      setSelectedTeamId((prev) =>
        prev && ownedTeams.some((t) => t._id === prev) ? prev : nextSelectedTeamId
      );

      setCreateForm((prev) => ({
        ...prev,
        tournamentId: available[0]?._id || '',
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [user?.id]);

  const selectedTeam = useMemo(
    () => teams.find((t) => t._id === selectedTeamId) || teams[0] || null,
    [teams, selectedTeamId]
  );

  const stats = useMemo(() => {
    const totalSpent = teams.reduce((sum, t) => sum + (Number(t.usedPurse) || 0), 0);
    const remainingPurse = teams.reduce((sum, t) => sum + (Number(t.remainingPurse) || 0), 0);
    const squadSize = teams.reduce((sum, t) => sum + (t.players?.length || 0), 0);
    return {
      squadSize,
      totalSpent,
      remainingPurse,
      teamsCount: teams.length,
    };
  }, [teams]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!createForm.tournamentId || !createForm.name.trim() || !createForm.shortName.trim()) {
      setError('Tournament, team name, and short name are required');
      return;
    }

    setCreateLoading(true);
    setError('');
    setMessage('');

    try {
      await auctionAPI.createTeam({
        tournamentId: createForm.tournamentId,
        name: createForm.name.trim(),
        shortName: createForm.shortName.trim().toUpperCase(),
        colors: {
          primary: createForm.primary,
          secondary: createForm.secondary,
        },
      });

      setMessage('Team created successfully');
      setCreateForm((prev) => ({
        ...prev,
        name: '',
        shortName: '',
      }));
      await loadTeamData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatINR = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />

      <div className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Team Management</h1>
            <p className="text-gray-400 text-lg">Manage teams, budget, and auction participation</p>
          </motion.div>

          {error && <p className="mb-4 text-red-400">{error}</p>}
          {message && <p className="mb-4 text-green-400">{message}</p>}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <div className="card border border-gold/50">
              <p className="text-gray-400 text-sm mb-1">Squad Size</p>
              <p className="text-2xl font-bold text-white">{stats.squadSize}</p>
            </div>
            <div className="card border border-gold/50">
              <p className="text-gray-400 text-sm mb-1">Budget Spent</p>
              <p className="text-2xl font-bold text-white">{formatINR(stats.totalSpent)}</p>
            </div>
            <div className="card border border-gold/50">
              <p className="text-gray-400 text-sm mb-1">Remaining Budget</p>
              <p className="text-2xl font-bold text-white">{formatINR(stats.remainingPurse)}</p>
            </div>
            <div className="card border border-gold/50">
              <p className="text-gray-400 text-sm mb-1">Active Teams</p>
              <p className="text-2xl font-bold text-white">{stats.teamsCount}</p>
            </div>
          </div>

          {tournamentsWithoutTeam.length > 0 && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateTeam}
              className="card border border-gold/40 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-gold" />
                Create Team
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <select
                  value={createForm.tournamentId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, tournamentId: e.target.value }))}
                  className="input-field"
                  required
                >
                  {tournamentsWithoutTeam.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Team Name"
                  required
                />
                <input
                  type="text"
                  value={createForm.shortName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, shortName: e.target.value }))}
                  className="input-field"
                  placeholder="Short Name (e.g. MUM)"
                  maxLength={5}
                  required
                />
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Every team is initialized with at least Rs 1,000,000 purse.
              </p>
            </motion.form>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-gold/50 mb-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-white">Your Squad</h2>
              {teams.length > 1 && (
                <select
                  value={selectedTeam?._id || ''}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="input-field max-w-xs"
                >
                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name} ({team.tournament?.name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {loading ? (
              <p className="text-gray-400">Loading teams...</p>
            ) : !selectedTeam ? (
              <p className="text-gray-400">No teams yet. Create one to start bidding.</p>
            ) : (
              <>
                <div className="mb-4 p-3 bg-gold/10 border border-gold/20 rounded-lg text-sm text-gray-300">
                  Tournament: <span className="text-gold font-semibold">{selectedTeam.tournament?.name}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gold/30">
                        <th className="text-left text-gold py-3">#</th>
                        <th className="text-left text-gold">Player Name</th>
                        <th className="text-left text-gold">Role</th>
                        <th className="text-right text-gold">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedTeam.players || []).length === 0 ? (
                        <tr>
                          <td className="text-gray-400 py-4" colSpan={4}>
                            No players bought yet.
                          </td>
                        </tr>
                      ) : (
                        selectedTeam.players.map((player, index) => (
                          <tr key={player.playerId?._id || `${player.playerId}-${index}`} className="border-b border-border">
                            <td className="text-white py-4">{index + 1}</td>
                            <td className="text-white">{player.playerId?.fullName || 'Unknown Player'}</td>
                            <td className="text-gray-400">{player.role || player.playerId?.role || 'N/A'}</td>
                            <td className="text-right text-gold font-bold">{formatINR(player.biddedPrice)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>

          {selectedTeam && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card border border-gold/50 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Budget Allocation</h2>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Total Budget</span>
                    <span className="text-white font-bold">{formatINR(selectedTeam.totalPurse)}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-3">
                    <div className="bg-gradient-gold h-3 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Spent on Players</span>
                    <span className="text-gold font-bold">{formatINR(selectedTeam.usedPurse)}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-3">
                    <div
                      className="bg-gradient-gold h-3 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(((selectedTeam.usedPurse || 0) / Math.max(selectedTeam.totalPurse || 1, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Remaining Budget</span>
                    <span className="text-grass-green font-bold">{formatINR(selectedTeam.remainingPurse)}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-3">
                    <div
                      className="bg-grass-green h-3 rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, Math.round(((selectedTeam.remainingPurse || 0) / Math.max(selectedTeam.totalPurse || 1, 1)) * 100)))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card border border-gold/50"
            >
              <Users className="w-8 h-8 text-gold mb-3" />
              <h3 className="text-xl font-bold text-white mb-4">Join Auctions</h3>
              <p className="text-gray-400 mb-6 text-sm">Bid in live auctions with your real remaining budget.</p>
              <button onClick={() => navigate('/available-auctions')} className="btn-primary w-full text-sm">
                View Available Auctions
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card border border-gold/50"
            >
              <TrendingUp className="w-8 h-8 text-gold mb-3" />
              <h3 className="text-xl font-bold text-white mb-4">Tournament Analytics</h3>
              <p className="text-gray-400 mb-6 text-sm">View tournament and player performance insights.</p>
              <button onClick={() => navigate('/tournaments')} className="btn-primary w-full text-sm">
                View Analytics
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamOwnerDashboard;
