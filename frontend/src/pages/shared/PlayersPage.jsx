import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import { tournamentAPI, playerAPI } from '../../utils/api';
import { ArrowLeft, Search, Filter, Mail, Phone, MapPin, Award, Zap, CheckCircle, X } from 'lucide-react';

const PlayersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');

  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        let data = [];

        if (tournamentId) {
          // Get players/trials for specific tournament
          try {
            // Fetch both players and trials if possible to get category info
            const [playersRes, trialsRes] = await Promise.all([
              playerAPI.getTournamentPlayers(tournamentId),
              tournamentAPI.getTournamentTrials(tournamentId).catch(() => ({ data: { trials: [] } }))
            ]);

            const rawPlayers = playersRes.data.players || [];
            const trials = trialsRes.data.trials || [];

            // Merge category info from trials into player objects
            data = rawPlayers.map(player => {
              const trial = trials.find(t => (t.playerId?._id || t.playerId)?.toString() === player._id.toString());
              return {
                ...player,
                category: trial?.category || 'Unclassified',
                finalScore: trial?.finalScore,
                confidence: trial?.confidence
              };
            });
          } catch (error) {
            console.error('Error fetching tournament players:', error);
          }
        } else {
          // Get all players using the new endpoint
          try {
            const res = await playerAPI.getAllPlayers();
            data = res.data.players || [];
          } catch (error) {
            console.error('Error fetching all players:', error);
          }
        }

        setPlayers(data);
        setFilteredPlayers(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [tournamentId]);

  // Filter players based on search and category
  useEffect(() => {
    let filtered = players;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) => {
          const name = p.fullName || p.userId?.fullName || '';
          const email = p.email || p.userId?.email || '';
          return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
        }
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === filterCategory);
    }

    setFilteredPlayers(filtered);
  }, [searchTerm, filterCategory, players]);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Advanced':
        return 'bg-gold/20 text-gold border-gold/50';
      case 'Intermediate':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />

      <div className="py-12">
        <div className="container mx-auto px-4">
          {/* Back Button & Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gold hover:text-white transition p-2 border border-gold/30 rounded-lg bg-gold/5"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-4xl font-bold text-white leading-tight">Player Registry</h1>
                <p className="text-gray-400">
                  {tournamentId ? 'Tournament Participants' : 'All Platform Players'} • {filteredPlayers.length} total
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-gold/30 mb-8 bg-card-bg/50 backdrop-blur-sm"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-dark-bg/50 border border-border rounded-xl text-white placeholder-gray-500 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-dark-bg/50 border border-border rounded-xl text-white appearance-none focus:border-gold focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Unclassified">Unclassified</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)]"
              />
              <p className="mt-6 text-gray-400 font-medium tracking-wide">Fetching talent pool...</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card border border-dashed border-border text-center py-20 bg-card-bg/20"
            >
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl font-medium">No players found matching your criteria</p>
              <button
                onClick={() => { setSearchTerm(''); setFilterCategory('all'); }}
                className="mt-4 text-gold hover:underline"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.map((player, index) => (
                <motion.div
                  key={player._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedPlayer(player)}
                  whileHover={{ y: -8, boxShadow: "0 10px 25px -5px rgba(212,175,55,0.15)" }}
                  className="card border border-gold/20 cursor-pointer overflow-hidden group hover:border-gold/50 transition-all bg-gradient-to-b from-card-bg to-dark-bg"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-gold transition-colors truncate pr-2">
                        {player.fullName || player.userId?.fullName || 'Player'}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{player.email || player.userId?.email || 'N/A'}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-tighter font-black border ${getCategoryColor(player.category)}`}>
                      {player.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-t border-white/5 pt-4 mb-4">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Role</span>
                      <span className="text-gray-200 font-semibold">{player.role || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Experience</span>
                      <span className="text-gray-200 font-semibold">{player.yearsOfExperience || 0} years</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Batting</span>
                      <span className="text-gray-200 font-semibold">{player.battingStyle || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Age</span>
                      <span className="text-gray-200 font-semibold">{player.age || 'N/A'} years</span>
                    </div>
                  </div>

                  {player.finalScore ? (
                    <div className="bg-gold/5 -mx-6 -mb-6 px-6 py-3 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-gold fill-gold" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">AI Audit Score</span>
                      </div>
                      <span className="text-xl font-black text-gold">{Math.round(player.finalScore)}</span>
                    </div>
                  ) : (player.category && player.category !== 'Unclassified') ? (
                    <div className="bg-green-500/5 -mx-6 -mb-6 px-6 py-3 flex items-center justify-between mt-auto border-t border-green-500/10">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Profile Verified</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 lowercase italic">Classified</span>
                    </div>
                  ) : (
                    <div className="bg-gray-500/5 -mx-6 -mb-6 px-6 py-3 flex items-center justify-center mt-auto">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trial Data Pending</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Player Details Modal */}
          <AnimatePresence>
            {selectedPlayer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
                onClick={() => setSelectedPlayer(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card-bg border border-gold/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="p-8">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-20 h-20 bg-gold/10 rounded-2xl flex items-center justify-center mb-4 border border-gold/20">
                        <Award className="w-10 h-10 text-gold" />
                      </div>
                      <h2 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">
                        {selectedPlayer?.fullName || selectedPlayer?.userId?.fullName || 'Player Profile'}
                      </h2>
                      <div className="flex items-center gap-2 text-gold font-bold text-xs uppercase tracking-[0.2em]">
                        <Zap className="w-3 h-3 fill-gold" />
                        {selectedPlayer?.role}
                      </div>

                      <div className={`mt-4 px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getCategoryColor(selectedPlayer?.category)}`}>
                        {selectedPlayer?.category || 'Unclassified'}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Experience</p>
                        <p className="text-lg font-bold text-white">{selectedPlayer?.yearsOfExperience || 0} Years</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Physical Age</p>
                        <p className="text-lg font-bold text-white">{selectedPlayer?.age || 'N/A'} Years</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Batting Style</p>
                        <p className="text-lg font-bold text-white">{selectedPlayer?.battingStyle || 'Right'}-Hand</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Bowling Style</p>
                        <p className="text-lg font-bold text-white">{selectedPlayer?.bowlingStyle || 'None'}</p>
                      </div>
                    </div>

                    {/* Classification Results */}
                    {selectedPlayer?.finalScore && (
                      <div className="bg-gold/10 p-6 rounded-2xl border border-gold/20 mb-8 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-5">
                          <Award className="w-24 h-24 text-gold" />
                        </div>
                        <h4 className="text-xs font-black text-gold uppercase tracking-[.2em] mb-4">AI Audit Results</h4>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-4xl font-black text-white">{Math.round(selectedPlayer.finalScore)}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Reliability: {Math.round((selectedPlayer.confidence || 0) * 100)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Est. Base Price</p>
                            <p className="text-2xl font-black text-green-400">₹{(selectedPlayer.basePrice || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact (Small) */}
                    <div className="flex items-center justify-center gap-6 text-gray-500">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        <Mail className="w-3 h-3 text-gold" /> {selectedPlayer?.email || selectedPlayer?.userId?.email || 'N/A'}
                      </div>
                      {selectedPlayer?.contactDetails?.phone && (
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                          <Phone className="w-3 h-3 text-gold" /> {selectedPlayer.contactDetails.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 flex gap-3">
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-[.2em] text-white hover:bg-white/10 transition-all border border-white/10"
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PlayersPage;
