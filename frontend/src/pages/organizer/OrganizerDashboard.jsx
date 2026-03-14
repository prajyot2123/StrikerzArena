import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { tournamentAPI, auctionAPI } from '../../utils/api';
import { Trophy, Users, Calendar, TrendingUp, Plus, ArrowRight } from 'lucide-react';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState({
    myTournaments: 0,
    registeredPlayers: 0,
    upcomingAuctions: 0,
    totalTeams: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const { data } = await tournamentAPI.getOrganizerTournaments();
        const myTournaments = data.tournaments || [];
        setTournaments(myTournaments);

        // Calculate stats
        let totalPlayers = 0;
        let totalTeams = 0;
        let upcomingCount = 0;

        for (const tournament of myTournaments) {
          totalPlayers += tournament.registeredPlayers?.length || 0;
          totalTeams += tournament.teams?.length || 0;
          if (tournament.status === 'UPCOMING' || tournament.status === 'REGISTRATION') {
            upcomingCount++;
          }
        }

        setStats({
          myTournaments: myTournaments.length,
          registeredPlayers: totalPlayers,
          upcomingAuctions: upcomingCount,
          totalTeams: totalTeams,
        });
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color = 'gold' }) => (
    <motion.div
      whileHover={{ translateY: -5 }}
      className={`card border border-${color}/50`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <Icon className={`w-8 h-8 text-${color} opacity-50`} />
      </div>
    </motion.div>
  );

  const getTournamentStatusColor = (status) => {
    switch (status) {
      case 'REGISTRATION':
        return 'bg-blue-500/20 text-blue-400';
      case 'TRIALS':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'AUCTION':
        return 'bg-gold/20 text-gold';
      case 'LIVE':
        return 'bg-red-500/20 text-red-400';
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Organizer Dashboard
            </h1>
            <p className="text-gray-400 text-lg">Manage your tournaments and participants</p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12"
          >
            <StatCard
              icon={Trophy}
              label="My Tournaments"
              value={stats.myTournaments}
              color="gold"
            />
            <StatCard
              icon={Users}
              label="Registered Players"
              value={stats.registeredPlayers}
              color="gold"
            />
            <StatCard
              icon={Calendar}
              label="Upcoming Auctions"
              value={stats.upcomingAuctions}
              color="gold"
            />
            <StatCard
              icon={TrendingUp}
              label="Teams"
              value={stats.totalTeams}
              color="gold"
            />
          </motion.div>

          {/* Tournament Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-gold/50 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">My Tournaments</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary flex items-center gap-2"
                onClick={() => navigate('/create-tournament')}
              >
                <Plus className="w-4 h-4" />
                Create Tournament
              </motion.button>
            </div>

            {tournaments.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gold/50 mx-auto mb-4" />
                <p className="text-gray-400 mb-6">No tournaments created yet</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary"
                  onClick={() => navigate('/create-tournament')}
                >
                  Create Your First Tournament
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                {tournaments.map((tournament, index) => (
                  <motion.div
                    key={tournament._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-dark-bg border border-border rounded-lg p-6 hover:border-gold/50 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {tournament.format} Format • {tournament.totalTeams} Teams • {tournament.registeredPlayers?.length || 0} Players
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full font-semibold text-sm ${getTournamentStatusColor(
                          tournament.status
                        )}`}
                      >
                        {tournament.status}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-400">Registration Ends</p>
                        <p className="text-white font-semibold">
                          {new Date(tournament.registrationEndDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Trials Start</p>
                        <p className="text-white font-semibold">
                          {new Date(tournament.trialsStartDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Auction Date</p>
                        <p className="text-white font-semibold">
                          {new Date(tournament.auctionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Purse</p>
                        <p className="text-white font-semibold">
                          ₹{(tournament.pursePerTeam / 10000000).toFixed(1)} Cr
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-secondary text-sm"
                        onClick={() => navigate(`/auction-management?tournament=${tournament._id}`)}
                      >
                        Manage
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-secondary text-sm"
                        onClick={() => navigate(`/players?tournament=${tournament._id}`)}
                      >
                        View Players
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-secondary text-sm"
                        onClick={() => navigate(`/players?tournament=${tournament._id}`)}
                      >
                        Analytics
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`text-sm px-4 py-2 rounded-lg font-bold flex items-center gap-1 transition-all ${tournament.status === 'LIVE' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-dark-bg border border-white/10 text-gray-400'
                          }`}
                        onClick={() => navigate(`/match-management/${tournament._id}`)}
                      >
                        <Calendar className="w-3 h-3" /> Matches
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-primary text-sm flex items-center gap-1"
                        onClick={() => navigate(`/auction-management?tournament=${tournament._id}`)}
                      >
                        <Trophy className="w-3 h-3" /> Auction
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Key Features */}
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card border border-gold/50"
            >
              <Users className="w-8 h-8 text-gold mb-3" />
              <h3 className="text-xl font-bold text-white mb-4">Player Management</h3>
              <p className="text-gray-400 mb-6">
                Register players, track trials, and evaluate performance
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Register players
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ ML evaluation results
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Trial scores
                </li>
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={() => navigate('/players')}
              >
                View All Players
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card border border-gold/50"
            >
              <Trophy className="w-8 h-8 text-gold mb-3" />
              <h3 className="text-xl font-bold text-white mb-4">Auction Management</h3>
              <p className="text-gray-400 mb-6">
                Configure and run real-time auctions with WebSocket
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Set base prices
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Monitor live bidding
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Team squad management
                </li>
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={() => navigate('/auction-management')}
              >
                Manage Auctions
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
