import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { ChevronLeft, Trophy, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';
import { tournamentAPI } from '../../utils/api';

const SuperAdminTournamentsPage = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const { data } = await tournamentAPI.getAllTournaments();
        const tournaments = (data.tournaments || []).map(t => ({
          ...t,
          organizer: t.organizer?.fullName || 'Unknown',
          teams: t.teams?.length || 0,
          players: t.registeredPlayers?.length || 0,
          matches: 0,
          startDate: t.startDate ? t.startDate.split('T')[0] : 'Unknown',
          endDate: t.endDate ? t.endDate.split('T')[0] : 'Unknown',
        }));
        setTournaments(tournaments);
      } catch (error) {
        console.error('Failed to load tournaments:', error);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter(t => {
    return !statusFilter || t.status === statusFilter;
  });

  const getStatusColor = (status) => {
    const colors = {
      'approved': 'bg-green-500/20 text-green-400 border-green-500/30',
      'pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
      'completed': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'completed':
        return <Trophy className="w-5 h-5 text-blue-400" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gold text-xl">Loading tournaments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />

      <div className="py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <button
                onClick={() => navigate('/super-admin-dashboard')}
                className="p-3 bg-white/5 border border-white/10 hover:border-gold/50 rounded-xl transition-all group"
              >
                <ChevronLeft className="w-6 h-6 text-gold group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight text-glow">Tournament Command</h1>
                <p className="text-slate-400 font-medium tracking-wide">Oversight • Approvals • System Lifecycle</p>
              </div>
            </motion.div>
          </div>

          {/* Status Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-white/5 mb-10 bg-slate-900/40 p-1"
          >
            <div className="flex flex-wrap items-center gap-1 p-1">
              {[
                { id: '', label: 'All Operations', icon: BarChart3 },
                { id: 'pending', label: 'Awaiting Review', icon: Clock },
                { id: 'approved', label: 'Active/Verified', icon: CheckCircle },
                { id: 'completed', label: 'Archived/Closed', icon: Trophy }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${statusFilter === filter.id
                      ? 'bg-gold text-dark-bg shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <filter.icon className="w-3.5 h-3.5" />
                  {filter.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tournaments Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {filteredTournaments.map((tournament, index) => (
              <motion.div
                key={tournament._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card border border-gold/30 p-6 hover:border-gold/60 transition cursor-pointer"
                onClick={() => setSelectedTournament(tournament)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{tournament.name}</h3>
                    <p className="text-gray-400 text-sm">Organizer: {tournament.organizer}</p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusIcon(tournament.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(tournament.status)}`}>
                      {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4 pt-4 border-t border-gold/10">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Teams</p>
                    <p className="text-white font-bold text-lg">{tournament.teams}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Players</p>
                    <p className="text-white font-bold text-lg">{tournament.players}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Matches</p>
                    <p className="text-white font-bold text-lg">{tournament.matches}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Duration</p>
                    <p className="text-white font-bold text-xs">{tournament.startDate}</p>
                  </div>
                </div>

                {tournament.status === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          await tournamentAPI.updateStatus(tournament._id, 'approved');
                          setTournaments(tournaments.map(t =>
                            t._id === tournament._id ? { ...t, status: 'approved' } : t
                          ));
                        } catch (error) {
                          console.error('Failed to approve:', error);
                        }
                      }}
                      className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 font-semibold py-2 rounded-lg transition"
                    >
                      Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          await tournamentAPI.updateStatus(tournament._id, 'rejected');
                          setTournaments(tournaments.map(t =>
                            t._id === tournament._id ? { ...t, status: 'rejected' } : t
                          ));
                        } catch (error) {
                          console.error('Failed to reject:', error);
                        }
                      }}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-semibold py-2 rounded-lg transition"
                    >
                      Reject
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {filteredTournaments.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">No tournaments found</p>
            </div>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-4 gap-4 mt-12"
          >
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Total Tournaments</p>
              <p className="text-3xl font-bold text-gold">{tournaments.length}</p>
            </div>
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-400">{tournaments.filter(t => t.status === 'pending').length}</p>
            </div>
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Approved</p>
              <p className="text-3xl font-bold text-green-400">{tournaments.filter(t => t.status === 'approved').length}</p>
            </div>
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Completed</p>
              <p className="text-3xl font-bold text-blue-400">{tournaments.filter(t => t.status === 'completed').length}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminTournamentsPage;
