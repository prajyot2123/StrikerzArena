import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import { ChevronLeft, Play, Pause, SkipForward, Check, X, Plus, Eye, Users, AlertTriangle } from 'lucide-react';
import { tournamentAPI, auctionAPI } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

const AuctionManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [qualifiedCount, setQualifiedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    startTime: new Date().toISOString().slice(0, 16),
  });
  const [message, setMessage] = useState('');

  // Fetch tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await tournamentAPI.getAllTournaments();
        const allTournaments = res.data.tournaments || [];
        setTournaments(allTournaments);

        // Auto-select tournament if passed via query parameter
        const tournamentId = searchParams.get('tournament');
        if (tournamentId) {
          const tournament = allTournaments.find(t => t._id === tournamentId);
          if (tournament) {
            setSelectedTournament(tournament);
          }
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        setMessage('Failed to load tournaments');
      }
    };

    fetchTournaments();
  }, [searchParams]);

  // Fetch auctions + qualified player count for selected tournament
  useEffect(() => {
    const fetchAuctions = async () => {
      if (!selectedTournament) {
        setAuctions([]);
        setQualifiedCount(0);
        return;
      }

      try {
        const [auctionsRes, qualifiedRes] = await Promise.all([
          auctionAPI.getAuctions(selectedTournament._id),
          tournamentAPI.getQualifiedPlayers(selectedTournament._id).catch(() => ({ data: { qualifiedCount: 0 } })),
        ]);
        setAuctions(auctionsRes.data.auctions || []);
        setQualifiedCount(qualifiedRes.data.qualifiedCount || 0);
      } catch (error) {
        console.error('Error fetching auctions:', error);
      }
    };

    fetchAuctions();
  }, [selectedTournament]);

  const handleCreateAuction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!selectedTournament) {
        setMessage('⚠️ Please select a tournament');
        setLoading(false);
        return;
      }

      if (qualifiedCount === 0) {
        setMessage('⚠️ No qualified players found. Ensure Admin has recorded trial performances first.');
        setLoading(false);
        return;
      }

      // FIXED: Send empty playersToAuction so backend auto-populates QUALIFIED players only
      const res = await auctionAPI.createAuction({
        tournamentId: selectedTournament._id,
        startTime: formData.startTime,
        playersToAuction: [], // Let backend auto-populate QUALIFIED players
      });

      setAuctions([...auctions, res.data.auction]);
      setShowCreateForm(false);
      setFormData({ startTime: new Date().toISOString().slice(0, 16) });
      setMessage(`✅ Auction created with ${res.data.playersCount} qualified players!`);
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating auction');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAuction = async (auction) => {
    setLoading(true);

    try {
      const res = await auctionAPI.updateAuctionStatus(auction._id, 'LIVE');
      if (res.data.auction) {
        setSelectedAuction(res.data.auction);
        setAuctions(
          auctions.map((a) => (a._id === auction._id ? res.data.auction : a))
        );
      }
      setMessage('✅ Auction started!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Error starting auction:', error);
      setMessage(error.response?.data?.message || 'Error starting auction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseAuction = async (auction) => {
    setLoading(true);

    try {
      const res = await auctionAPI.updateAuctionStatus(auction._id, 'PAUSED');
      if (res.data.auction) {
        setSelectedAuction(res.data.auction);
        setAuctions(
          auctions.map((a) => (a._id === auction._id ? res.data.auction : a))
        );
      }
      setMessage('✅ Auction paused!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Error pausing auction:', error);
      setMessage(error.response?.data?.message || 'Error pausing auction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextPlayer = async (auction) => {
    setLoading(true);

    try {
      const res = await auctionAPI.nextAuctionPlayer(auction._id);
      if (res.data.auction) {
        setSelectedAuction(res.data.auction);
        setAuctions(
          auctions.map((a) => (a._id === auction._id ? res.data.auction : a))
        );
      }
      setMessage(
        res.data.auctionEnded
          ? '✅ Auction completed! All players auctioned.'
          : '✅ Moved to next player!'
      );
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Error moving to next player:', error);
      setMessage(error.response?.data?.message || 'Error moving to next player. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSoldPlayer = async (auction, playerId, teamId, soldPrice) => {
    setLoading(true);

    try {
      const res = await auctionAPI.soldPlayer(auction._id, {
        playerId,
        teamId,
        soldPrice,
      });
      if (res.data.auction) {
        setSelectedAuction(res.data.auction);
      }
      setMessage('✅ Player sold!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Error marking player as sold:', error);
      setMessage(error.response?.data?.message || 'Error marking player as sold. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsoldPlayer = async (auction, playerId) => {
    setLoading(true);

    try {
      const res = await auctionAPI.unsoldPlayer(auction._id, { playerId });
      if (res.data.auction) {
        setSelectedAuction(res.data.auction);
      }
      setMessage('✅ Player marked as unsold!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Error marking player as unsold:', error);
      setMessage(error.response?.data?.message || 'Error marking player as unsold. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />

      <div className="py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/organizer-dashboard')}
                className="p-2 hover:bg-gold/10 rounded-lg transition"
              >
                <ChevronLeft className="w-6 h-6 text-gold" />
              </button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Auction Management</h1>
                <p className="text-gray-400">Create and control live auctions</p>
              </div>
            </div>
          </motion.div>

          {message && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200"
            >
              {message}
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Tournament Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-1 card border border-gold/30 p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Select Tournament</h2>

              {tournaments.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No tournaments available</p>
              ) : (
                <div className="space-y-2">
                  {tournaments.map((tournament) => (
                    <motion.button
                      key={tournament._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedTournament(tournament);
                        setSelectedAuction(null);
                      }}
                      className={`w-full px-4 py-3 rounded-lg font-semibold transition text-left ${selectedTournament?._id === tournament._id
                          ? 'bg-gold/20 border border-gold text-gold'
                          : 'bg-dark-input border border-gold/20 text-gray-300 hover:border-gold/50'
                        }`}
                    >
                      <p className="font-bold">{tournament.name}</p>
                      <p className="text-xs">
                        {tournament.registeredPlayers?.length || 0} players
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Auctions List & Management */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create New Auction */}
              {selectedTournament && !showCreateForm ? (
                <div className="space-y-3">
                  {/* Qualified Players Info */}
                  <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${qualifiedCount > 0
                      ? 'bg-green-900/30 border-green-500/30 text-green-300'
                      : 'bg-yellow-900/30 border-yellow-500/30 text-yellow-300'
                    }`}>
                    <Users className="w-4 h-4 flex-shrink-0" />
                    {qualifiedCount > 0
                      ? `${qualifiedCount} qualified player${qualifiedCount !== 1 ? 's' : ''} ready for auction`
                      : 'No qualified players yet — Admin must record trials first'}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateForm(true)}
                    disabled={qualifiedCount === 0}
                    className="w-full px-6 py-4 bg-gold/20 border border-gold rounded-lg text-gold font-bold hover:bg-gold/30 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Auction ({qualifiedCount} players)
                  </motion.button>
                </div>
              ) : null}

              {/* Create Form */}
              {showCreateForm && selectedTournament && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card border border-gold/30 p-6"
                >
                  <h3 className="text-lg font-bold text-white mb-4">Create New Auction</h3>
                  <form onSubmit={handleCreateAuction} className="space-y-4">
                    <div>
                      <label className="text-gray-400 mb-2 block">Start Time</label>
                      <input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({ ...formData, startTime: e.target.value })
                        }
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="flex-1 btn-primary disabled:opacity-50"
                      >
                        {loading ? 'Creating...' : 'Create Auction'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1 px-4 py-2 border border-gold/50 text-gold rounded-lg hover:bg-gold/10 transition"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Auctions List */}
              {selectedTournament && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {auctions.length === 0 ? (
                    <div className="card border border-gold/30 p-8 text-center">
                      <p className="text-gray-400">No auctions yet.Create one to get started!</p>
                    </div>
                  ) : (
                    auctions.map((auction) => (
                      <motion.div
                        key={auction._id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedAuction(auction)}
                        className={`card border-2 p-6 cursor-pointer transition ${selectedAuction?._id === auction._id
                            ? 'border-gold bg-gold/5'
                            : 'border-gold/30 hover:border-gold/50'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-gray-400 text-sm">Auction Status</p>
                            <p className="text-2xl font-bold text-gold">{auction.status}</p>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-bold ${auction.status === 'LIVE'
                                ? 'bg-green-900/50 text-green-400'
                                : auction.status === 'PAUSED'
                                  ? 'bg-yellow-900/50 text-yellow-400'
                                  : 'bg-blue-900/50 text-blue-400'
                              }`}
                          >
                            {auction.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                          <div>
                            <p className="text-gray-400">Total Players</p>
                            <p className="text-white font-bold">
                              {auction.playersToAuction?.length || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Sold</p>
                            <p className="text-green-400 font-bold">
                              {auction.soldPlayers?.length || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Unsold</p>
                            <p className="text-orange-400 font-bold">
                              {auction.unsoldPlayers?.length || 0}
                            </p>
                          </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {/* View Live button — always available */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/auction/${auction._id}`); }}
                            className="flex-1 min-w-[80px] px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 font-semibold rounded-lg hover:bg-purple-500/30 transition flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            {auction.status === 'LIVE' ? 'Control Live' : 'View'}
                          </motion.button>
                          {auction.status === 'SCHEDULED' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartAuction(auction);
                              }}
                              disabled={loading}
                              className="flex-1 min-w-[80px] px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 font-semibold rounded-lg hover:bg-green-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Start
                            </motion.button>
                          )}

                          {auction.status === 'LIVE' && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePauseAuction(auction);
                                }}
                                disabled={loading}
                                className="flex-1 min-w-[80px] px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-semibold rounded-lg hover:bg-yellow-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <Pause className="w-4 h-4" />
                                Pause
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNextPlayer(auction);
                                }}
                                disabled={loading}
                                className="flex-1 min-w-[80px] px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 font-semibold rounded-lg hover:bg-blue-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <SkipForward className="w-4 h-4" />
                                Next
                              </motion.button>
                            </>
                          )}

                          {auction.status === 'PAUSED' && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartAuction(auction);
                                }}
                                disabled={loading}
                                className="flex-1 min-w-[80px] px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 font-semibold rounded-lg hover:bg-green-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <Play className="w-4 h-4" />
                                Resume
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNextPlayer(auction);
                                }}
                                disabled={loading}
                                className="flex-1 min-w-[80px] px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 font-semibold rounded-lg hover:bg-blue-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <SkipForward className="w-4 h-4" />
                                Next
                              </motion.button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionManagementPage;
