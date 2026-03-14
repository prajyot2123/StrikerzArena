import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { playerAPI, tournamentAPI } from '../../utils/api';
import PlayerCard from '../../components/PlayerCard';
import Header from '../../components/Header';
import { Trophy, TrendingUp, Award, Zap, Plus, CheckCircle, AlertCircle, Calendar, ArrowRight, UserPlus, Info, Users } from 'lucide-react';

const PlayerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playerProfile, setPlayerProfile] = useState(null);
  const [trials, setTrials] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [regMessage, setRegMessage] = useState('');
  const [regError, setRegError] = useState('');

  const fetchData = async () => {
    try {
      const { data } = await playerAPI.getProfile();
      setPlayerProfile(data.player);

      if (data.player?._id) {
        const trialsRes = await playerAPI.getPlayerTrials(data.player._id);
        setTrials(trialsRes.data.trials || []);
      }

      // Fetch tournaments
      const tournsRes = await tournamentAPI.getAllTournaments();
      setTournaments(tournsRes.data.tournaments || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRegister = async (tournamentId) => {
    if (!playerProfile?._id) return;

    setRegLoading(tournamentId);
    setRegError('');
    setRegMessage('');

    try {
      const res = await playerAPI.registerInTournament(playerProfile._id, tournamentId);
      setRegMessage(`✅ Successfully registered for ${res.data.tournament.name}!`);
      // Refresh data to show registration status
      await fetchData();
      setTimeout(() => setRegMessage(''), 5000);
    } catch (err) {
      setRegError(err.response?.data?.message || 'Failed to register');
      setTimeout(() => setRegError(''), 5000);
    } finally {
      setRegLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          />
          <p className="mt-6 text-gray-400 font-medium tracking-wide">Initializing dashboard...</p>
        </div>
      </div>
    );
  }

  const bestTrial = trials.length > 0
    ? trials.reduce((prev, current) =>
      (prev.finalScore || 0) > (current.finalScore || 0) ? prev : current
    )
    : null;

  // Check if player is registered in a tournament
  const isRegistered = (tournamentId) => {
    return playerProfile?.registeredInTournaments?.some(t =>
      (t._id || t).toString() === tournamentId.toString()
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REGISTRATION': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'ONGOING': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'UPCOMING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'COMPLETED': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />

      <div className="py-12">
        <div className="container mx-auto px-4">
          {/* Messages */}
          <AnimatePresence>
            {(regMessage || regError) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`fixed top-24 right-4 z-50 p-4 rounded-xl border shadow-2xl max-w-sm flex items-start gap-4 ${regMessage ? 'bg-green-900/40 border-green-500 text-green-200' : 'bg-red-900/40 border-red-500 text-red-200'
                  }`}
              >
                {regMessage ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <p className="font-medium text-sm">{regMessage || regError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 relative"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-black uppercase tracking-widest mb-4"
                >
                  <Award className="w-3 h-3" /> Integrated Player Profile
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-2 leading-none">
                  Hello, <span className="text-gold italic">{user?.fullName.split(' ')[0]}</span>
                </h1>
                <p className="text-gray-400 text-lg md:text-xl font-medium">Ready for your next big inning?</p>
              </div>

              <div className="hidden lg:flex items-center gap-6 p-1 bg-white/5 border border-white/10 rounded-2xl">
                <div className="px-6 py-4 border-r border-white/10">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${playerProfile?.status === 'SOLD' ? 'bg-green-500' :
                      playerProfile?.status === 'QUALIFIED' ? 'bg-blue-500' :
                        'bg-gold'
                      }`} />
                    <span className="text-white font-black text-sm tracking-tight">
                      {playerProfile?.status || 'AVAILABLE'}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Account</p>
                  <p className="text-white font-black text-sm tracking-tight">VERIFIED</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Grid */}
          <div className="grid lg:grid-cols-12 gap-8">

            {/* Left: Stats and Profile (8 cols) */}
            <div className="lg:col-span-8 space-y-8">

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Platform Rank', value: 'Silver', icon: Award, color: 'gold' },
                  { label: 'Exp Level', value: `${playerProfile?.yearsOfExperience}y`, icon: TrendingUp, color: 'blue-400' },
                  { label: 'Role', value: playerProfile?.role?.split(' ')[0], icon: Zap, color: 'yellow-400' },
                  { label: 'Trials', value: trials.length, icon: Trophy, color: 'green-400' }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -5, borderColor: 'rgba(212,175,55,0.5)' }}
                    className="card border border-white/5 bg-gradient-to-br from-card-bg to-dark-bg p-5 flex flex-col gap-3 group transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-${stat.color}/10 flex items-center justify-center border border-${stat.color}/20 group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{stat.label}</p>
                      <p className="text-2xl font-black text-white tracking-tighter">{stat.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tournament Registration Section */}
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card border border-white/5 bg-card-bg/30 p-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Open Tournaments</h2>
                    <p className="text-gray-400 text-sm">Join a tournament to trigger performance classification</p>
                  </div>
                  <UserPlus className="w-8 h-8 text-gold opacity-20" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {tournaments.filter(t => t.status !== 'COMPLETED').slice(0, 4).map((tournament, i) => (
                    <motion.div
                      key={tournament._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group bg-dark-bg/50 border border-white/5 rounded-2xl p-4 hover:border-gold/30 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gold/5 border border-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 transition-colors">
                          <Calendar className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm leading-tight mb-1 group-hover:text-gold transition-colors">{tournament.name}</h4>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(tournament.status)}`}>
                            {tournament.status}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const now = new Date();
                        const startDate = new Date(tournament.registrationStartDate);
                        const endDate = new Date(tournament.registrationEndDate);
                        const isWindowOpen = now >= startDate && now <= endDate;
                        const isRegisteredInTourney = isRegistered(tournament._id);

                        if (isRegisteredInTourney) {
                          return (
                            <div className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-xl border border-green-400/20 shadow-inner">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Enrolled</span>
                            </div>
                          );
                        }

                        const isOpen = tournament.status === 'REGISTRATION' || isWindowOpen;

                        return (
                          <motion.button
                            whileHover={isOpen ? { scale: 1.05, x: 5 } : {}}
                            whileTap={isOpen ? { scale: 0.95 } : {}}
                            disabled={regLoading === tournament._id || !isOpen}
                            onClick={() => handleRegister(tournament._id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isOpen
                              ? 'bg-gold text-dark-bg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                              : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                              }`}
                          >
                            {regLoading === tournament._id ? 'Processing...' : (
                              <>
                                {isOpen ? 'Register' : (now < startDate ? 'Starting Soon' : 'Closed')}
                                <ArrowRight className="w-3 h-3" />
                              </>
                            )}
                          </motion.button>
                        );
                      })()}
                    </motion.div>
                  ))}
                  {tournaments.length === 0 && <p className="text-gray-500 italic py-4">No active tournaments found.</p>}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between bg-gold/5 -mx-8 -mb-8 px-8 py-4 rounded-b-2xl">
                  <div className="flex items-center gap-2 text-gold/80 text-xs">
                    <Info className="w-4 h-4" />
                    <span>Registration requires trial-based evaluation.</span>
                  </div>
                  <button onClick={() => navigate('/tournaments')} className="text-xs font-black uppercase tracking-widest text-white hover:text-gold flex items-center gap-2">
                    View All <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.section>

              {/* Profile Details */}
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card border border-white/5 bg-gradient-to-b from-card-bg to-dark-bg p-8 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Users className="w-32 h-32 text-white" />
                </div>

                <h2 className="text-2xl font-black text-white mb-8 tracking-tight flex items-center gap-3">
                  <Award className="w-6 h-6 text-gold" /> Scout's Profile View
                </h2>

                <div className="grid md:grid-cols-2 gap-y-8 gap-x-12">
                  <div className="space-y-6">
                    <div className="group">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 group-hover:text-gold transition-colors">Playing Style</p>
                      <div className="flex items-center gap-4">
                        <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-gold border border-white/5">
                          {playerProfile?.battingStyle[0]}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white leading-tight">{playerProfile?.battingStyle}-Handed</p>
                          <p className="text-xs text-gray-500">Batting Orientation</p>
                        </div>
                      </div>
                    </div>

                    <div className="group">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 group-hover:text-gold transition-colors">Specialization</p>
                      <div className="flex items-center gap-4">
                        <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center border border-white/5">
                          <Zap className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white leading-tight">{playerProfile?.role}</p>
                          <p className="text-xs text-gray-500">Primary Role</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="group">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 group-hover:text-gold transition-colors">Bowling Variant</p>
                      <p className="text-lg font-bold text-white leading-tight">{playerProfile?.bowlingStyle || 'None'}</p>
                      <div className="w-full bg-white/5 h-1 mt-2 rounded-full overflow-hidden">
                        <div className="bg-gold h-full w-2/3" />
                      </div>
                    </div>

                    <div className="group">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 group-hover:text-gold transition-colors">Physical Condition</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold font-mono">FITNESS: 100%</div>
                        <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold font-mono">ELITE</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

            </div>

            {/* Right: Best Results (4 cols) */}
            <div className="lg:col-span-4 space-y-8">

              {/* Best Performance Card */}
              {bestTrial ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card border-2 border-gold bg-gradient-to-br from-gold/20 via-card-bg to-dark-bg p-8 relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                >
                  <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform">
                    <Trophy className="w-48 h-48 text-gold" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="mb-6 relative">
                      <Zap className="w-16 h-16 text-gold fill-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                    </div>

                    <h3 className="text-xs font-black text-gold uppercase tracking-[.3em] mb-2">Classification Score</h3>
                    <p className="text-7xl font-black text-white mb-2 leading-none tracking-tighter shadow-text">
                      {Math.round(bestTrial.finalScore || 0)}
                    </p>

                    <div className={`inline-block px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 bg-dark-bg/50 shadow-lg mb-8 ${getStatusBadge('ONGOING')}`}>
                      {bestTrial.category} Rank
                    </div>

                    <div className="w-full space-y-4 pt-6 border-t border-white/10">
                      <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest text-left">Confidence</span>
                        <span className="text-green-400 font-black text-sm">{Math.round((bestTrial.confidence || 0) * 100)}%</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest text-left">Market Value</span>
                        <span className="text-gold font-black text-sm">₹{(bestTrial.basePrice || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="card border border-dashed border-white/20 bg-card-bg/20 p-12 text-center flex flex-col items-center gap-4 h-full min-h-[400px] justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-white/20" />
                  </div>
                  <div>
                    <p className="text-white font-black uppercase tracking-widest text-sm mb-1">No AI Scans</p>
                    <p className="text-gray-500 text-xs leading-relaxed max-w-[200px] mx-auto">Complete a tournament trial to unlock your AI profile scorecard.</p>
                  </div>
                </div>
              )}

              {/* Recent Trials List */}
              {trials.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[.2em] px-2 mb-4">Evaluation History</h3>
                  {trials.slice(0, 3).map((trial, i) => (
                    <motion.div
                      key={trial._id}
                      whileHover={{ x: 5 }}
                      className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-inner"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-card-bg flex items-center justify-center font-black text-xs text-gold border border-white/5">
                          {Math.round(trial.finalScore)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[150px]">{trial.tournamentId?.name || 'Tournament'}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{trial.category}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Career History List */}
              {playerProfile?.tournamentHistory?.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[.2em] px-2 mb-4">Recruitment History</h3>
                  {playerProfile.tournamentHistory.slice().reverse().map((history, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 5 }}
                      className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between border-l-gold border-l-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-gold" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-tight">Sold: ₹{history.soldPrice.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-500 font-bold">Past Team ID: {history.teamId?.slice(-6).toUpperCase() || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
