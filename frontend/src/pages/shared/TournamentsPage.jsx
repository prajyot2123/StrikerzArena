import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { tournamentAPI, matchAPI } from '../../utils/api';
import Header from '../../components/Header';
import PlayerCard from '../../components/PlayerCard';
import Leaderboard from '../../components/Leaderboard';
import { Calendar, Users, Trophy, Wallet, Clock, MapPin } from 'lucide-react';

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [trials, setTrials] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('active'); // 'active' or 'history'

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const { data } = await tournamentAPI.getAllTournaments();
        setTournaments(data.tournaments || []);
        if (data.tournaments?.length > 0) {
          setSelectedTournament(data.tournaments[0]);
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  useEffect(() => {
    const fetchTrialsAndLeaderboard = async () => {
      if (!selectedTournament) return;

      try {
        const trialsRes = await tournamentAPI.getTournamentTrials(selectedTournament._id);
        setTrials(trialsRes.data.trials || []);

        if (selectedTournament.status === 'LIVE' || selectedTournament.status === 'COMPLETED') {
          const lbRes = await matchAPI.getLeaderboard(selectedTournament._id);
          setLeaderboard(lbRes.data.leaderboard || []);
        } else {
          setLeaderboard([]);
        }
      } catch (error) {
        console.error('Error fetching tournament details:', error);
      }
    };

    fetchTrialsAndLeaderboard();
  }, [selectedTournament]);

  const getStatusBadge = (status) => {
    const styles = {
      REGISTRATION: 'bg-green-500/20 text-green-400 border-green-500/50',
      TRIALS: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      AUCTION: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      LIVE: 'bg-red-500/20 text-red-400 border-red-500/50',
      COMPLETED: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };
    return styles[status] || styles.COMPLETED;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />

      <div className="py-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-10 h-10 text-gold" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">Tournaments</h1>
            </div>
            <p className="text-gray-400 text-lg">Browse tournaments and view qualified players</p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Tournament List - Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="card border border-gold/30 sticky top-4">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold" />
                  All Tournaments
                </h2>
                <div className="flex gap-2 mb-6 p-1 bg-dark-bg/50 rounded-xl border border-white/5">
                  <button
                    onClick={() => setView('active')}
                    className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${view === 'active' ? 'bg-gold text-dark-bg shadow-lg shadow-gold/20' : 'text-gray-500 hover:text-white'
                      }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setView('history')}
                    className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${view === 'history' ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'text-gray-500 hover:text-white'
                      }`}
                  >
                    History
                  </button>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {tournaments.filter(t => view === 'active' ? t.status !== 'COMPLETED' : t.status === 'COMPLETED').length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No {view} tournaments</p>
                  ) : (
                    tournaments
                      .filter(t => view === 'active' ? t.status !== 'COMPLETED' : t.status === 'COMPLETED')
                      .map((tournament) => (
                        <motion.button
                          key={tournament._id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedTournament(tournament)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition ${selectedTournament?._id === tournament._id
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border text-gray-300 hover:border-gold/50'
                            }`}
                        >
                          <p className="font-semibold truncate">{tournament.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(tournament.status)}`}>
                              {tournament.status}
                            </span>
                            <span className="text-xs text-gray-500">{tournament.totalTeams} teams</span>
                          </div>
                        </motion.button>
                      ))
                  )}
                </div>
              </div>
            </motion.div>

            {/* Tournament Details - Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {selectedTournament ? (
                <>
                  {/* Tournament Info Card */}
                  <motion.div
                    key={selectedTournament._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card border border-gold/30"
                  >
                    {selectedTournament.status === 'COMPLETED' && selectedTournament.winnerTeamId && (
                      <div className="mb-6 bg-gold/10 border border-gold/50 rounded-2xl p-6 flex items-center justify-between">
                        <div>
                          <p className="text-gold font-black uppercase tracking-[.3em] text-xs mb-1">Champion</p>
                          <h3 className="text-3xl font-black text-white italic">
                            {typeof selectedTournament.winnerTeamId === 'object' ? selectedTournament.winnerTeamId.name : 'Tournament Winner'}
                          </h3>
                        </div>
                        <Trophy className="w-12 h-12 text-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{selectedTournament.name}</h2>
                        <p className="text-gray-400">{selectedTournament.description || 'No description available'}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusBadge(selectedTournament.status)}`}>
                        {selectedTournament.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-dark-bg p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                          <Users className="w-4 h-4" />
                          Teams
                        </div>
                        <p className="text-2xl font-bold text-white">{selectedTournament.totalTeams}</p>
                      </div>
                      <div className="bg-dark-bg p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                          <Wallet className="w-4 h-4" />
                          Purse/Team
                        </div>
                        <p className="text-2xl font-bold text-green-400">₹{(selectedTournament.pursePerTeam || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-dark-bg p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                          <Clock className="w-4 h-4" />
                          Format
                        </div>
                        <p className="text-2xl font-bold text-gold">{selectedTournament.format || 'T20'}</p>
                      </div>
                      <div className="bg-dark-bg p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                          <Users className="w-4 h-4" />
                          Registered
                        </div>
                        <p className="text-2xl font-bold text-blue-400">{selectedTournament.registeredPlayers?.length || 0}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Qualified Players */}
                  {trials.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card border border-gold/30"
                    >
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-gold" />
                        Qualified Players
                        <span className="ml-2 text-sm font-normal text-gray-400">({trials.length} players)</span>
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trials.map((trial) => (
                          <motion.div
                            key={trial._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            className="bg-dark-bg border border-border rounded-lg p-4 hover:border-gold/50 transition"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-bold text-white">{trial.playerId?.fullName || 'Unknown'}</p>
                                <p className="text-sm text-gray-400">{trial.playerId?.role || 'Player'}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${trial.category === 'Advanced' ? 'bg-gold/20 text-gold' :
                                trial.category === 'Intermediate' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                {trial.category || 'N/A'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Score</p>
                                <p className="text-gold font-bold">{Math.round(trial.finalScore || 0)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Base Price</p>
                                <p className="text-green-400 font-bold">₹{(trial.basePrice || 0).toLocaleString()}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {trials.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="card border border-gold/30 text-center py-12"
                    >
                      <Trophy className="w-16 h-16 text-gold/30 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No qualified players yet</p>
                      <p className="text-gray-500 text-sm mt-2">Players will appear here after trial evaluation</p>
                    </motion.div>
                  )}

                  {/* Leaderboard */}
                  {leaderboard.length > 0 && <Leaderboard leaderboard={leaderboard} />}
                </>
              ) : (
                <div className="card border border-gold/30 text-center py-16">
                  <Calendar className="w-16 h-16 text-gold/30 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Select a tournament to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentsPage;
