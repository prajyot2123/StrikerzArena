import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { tournamentAPI, auctionAPI } from '../../utils/api';
import { Calendar, Users, Trophy, Clock, ArrowRight, ChevronLeft } from 'lucide-react';

const AvailableAuctionsPage = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [auctionsByTournament, setAuctionsByTournament] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);

  useEffect(() => {
    const fetchTournamentsAndAuctions = async () => {
      try {
        setLoading(true);
        // Fetch all tournaments
        const tournamentsRes = await tournamentAPI.getAllTournaments();
        const allTournaments = tournamentsRes.data.tournaments || [];
        setTournaments(allTournaments);

        if (allTournaments.length > 0) {
          setSelectedTournament(allTournaments[0]);
        }

        // Fetch auctions for each tournament
        const auctionsMap = {};
        for (const tournament of allTournaments) {
          try {
            const auctionsRes = await auctionAPI.getAuctions(tournament._id);
            auctionsMap[tournament._id] = auctionsRes.data.auctions || [];
          } catch (error) {
            console.error(`Error fetching auctions for tournament ${tournament._id}:`, error);
            auctionsMap[tournament._id] = [];
          }
        }
        setAuctionsByTournament(auctionsMap);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentsAndAuctions();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-500/20 text-red-400';
      case 'SCHEDULED':
        return 'bg-blue-500/20 text-blue-400';
      case 'PAUSED':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleJoinAuction = (auctionId) => {
    navigate(`/auction/${auctionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
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
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
              <Trophy className="w-10 h-10 text-gold" />
              Available Auctions
            </h1>
            <p className="text-gray-400 text-lg">Join live auctions and build your winning squad</p>
          </motion.div>

          {tournaments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card border border-gold/50 text-center py-16"
            >
              <Trophy className="w-16 h-16 text-gold/50 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No tournaments available at the moment</p>
            </motion.div>
          ) : (
            <>
              {/* Tournament Selector */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Select Tournament</h2>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tournaments.map((tournament) => (
                    <motion.button
                      key={tournament._id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedTournament(tournament)}
                      className={`p-4 rounded-lg border-2 text-left transition ${selectedTournament?._id === tournament._id
                          ? 'border-gold bg-gold/10'
                          : 'border-border bg-card-bg hover:border-gold'
                        }`}
                    >
                      <h3 className="font-bold text-white mb-2 text-sm line-clamp-2">
                        {tournament.name}
                      </h3>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {tournament.totalTeams} Teams
                        </p>
                        <p className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> ₹{(tournament.pursePerTeam / 10000000).toFixed(1)}Cr
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Auctions List */}
              {selectedTournament && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={selectedTournament._id}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedTournament.name}
                    </h2>
                    <p className="text-gray-400">{selectedTournament.description}</p>
                  </div>

                  {auctionsByTournament[selectedTournament._id]?.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="card border border-gold/20 text-center py-16"
                    >
                      <Calendar className="w-16 h-16 text-gold/50 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No auctions scheduled for this tournament yet</p>
                      <p className="text-gray-500 text-sm mt-2">Check back soon!</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-6">
                      {auctionsByTournament[selectedTournament._id].map((auction, index) => (
                        <motion.div
                          key={auction._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card border border-gold/50 p-6 hover:border-gold transition"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                {auction.name || `Auction ${index + 1}`}
                              </h3>
                              <p className="text-gray-400 text-sm mt-1">
                                Tournament ID: {auction.tournamentId}
                              </p>
                            </div>
                            <span
                              className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(
                                auction.status
                              )}`}
                            >
                              {auction.status}
                            </span>
                          </div>

                          <div className="grid md:grid-cols-4 gap-4 mb-6 text-sm">
                            <div className="bg-dark-bg p-3 rounded border border-border">
                              <p className="text-gray-400">Total Players</p>
                              <p className="text-gold font-bold mt-1">
                                {auction.playersToAuction?.length || 0}
                              </p>
                            </div>
                            <div className="bg-dark-bg p-3 rounded border border-border">
                              <p className="text-gray-400">Players Sold</p>
                              <p className="text-green-400 font-bold mt-1">
                                {auction.soldPlayers?.length || 0}
                              </p>
                            </div>
                            <div className="bg-dark-bg p-3 rounded border border-border">
                              <p className="text-gray-400">Unsold</p>
                              <p className="text-orange-400 font-bold mt-1">
                                {auction.unsoldPlayers?.length || 0}
                              </p>
                            </div>
                            <div className="bg-dark-bg p-3 rounded border border-border">
                              <p className="text-gray-400 flex items-center gap-1">
                                <Clock className="w-4 h-4" /> Start Time
                              </p>
                              <p className="text-white font-bold mt-1 text-sm">
                                {auction.startTime
                                  ? new Date(auction.startTime).toLocaleString()
                                  : 'TBD'}
                              </p>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleJoinAuction(auction._id)}
                            disabled={auction.status === 'COMPLETED'}
                            className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition ${auction.status === 'COMPLETED'
                                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                                : 'bg-gold text-dark-bg hover:bg-gold/90'
                              }`}
                          >
                            {auction.status === 'LIVE' ? 'Join Auction Now' : 'View Auction'}
                            <ArrowRight className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailableAuctionsPage;
