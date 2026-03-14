import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Users, Trophy, Zap, TrendingUp, Activity, ClipboardList } from 'lucide-react';
import { userAPI, tournamentAPI } from '../../utils/api';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: '—',
        totalTournaments: '—',
        activePlayers: '—',
        pendingTrials: '—',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, tournRes] = await Promise.all([
                    userAPI.getAllUsers(),
                    tournamentAPI.getAllTournaments(),
                ]);

                const users = usersRes.data.users || [];
                const tournaments = tournRes.data.tournaments || [];
                const playerCount = users.filter((u) => u.role === 'PLAYER').length;

                setStats({
                    totalUsers: users.length,
                    totalTournaments: tournaments.length,
                    activePlayers: playerCount,
                    pendingTrials: tournaments.filter(t => t.status === 'TRIALS').length,
                });
            } catch (err) {
                console.error('Error loading admin stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ icon: Icon, label, value, color = 'gold' }) => (
        <motion.div
            whileHover={{ translateY: -5 }}
            className={`card border border-${color}/30 bg-gradient-to-br from-white/5 to-transparent`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${color}`} />
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-dark-bg text-white">
            <Header />

            <div className="py-12">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 border-l-4 border-gold pl-6"
                    >
                        <h1 className="text-4xl font-black italic tracking-tight mb-2 uppercase">
                            Admin <span className="text-gold">Operations</span> Center
                        </h1>
                        <p className="text-gray-400 text-lg">System-wide participant tracking & evaluation oversight.</p>
                    </motion.div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                        <StatCard icon={Users} label="System Users" value={stats.totalUsers} />
                        <StatCard icon={Trophy} label="Global Tournaments" value={stats.totalTournaments} color="gold" />
                        <StatCard icon={Zap} label="Active Players" value={stats.activePlayers} color="blue-400" />
                        <StatCard icon={Activity} label="Trials in Progress" value={stats.pendingTrials} color="green-400" />
                    </div>

                    {/* Tools Grid */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Trial Tool */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card border border-gold/30 hover:border-gold transition-colors block group cursor-pointer"
                            onClick={() => navigate('/admin/trials')}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ClipboardList className="w-8 h-8 text-gold" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Trial Management</h2>
                            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                                Mark player attendance and record trial scores. Triggers AI-assisted ML classification for auction eligibility.
                            </p>
                            <div className="flex items-center gap-2 text-gold font-bold text-xs uppercase tracking-widest">
                                Launch Evaluation Module →
                            </div>
                        </motion.div>

                        {/* View Participants */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="card border border-white/10 hover:border-gold/30 transition-colors block group cursor-pointer"
                            onClick={() => navigate('/players')}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Player Directory</h2>
                            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                                Browse all registered players across the platform. View categories, base prices, and historic performance.
                            </p>
                            <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
                                Browse Participants →
                            </div>
                        </motion.div>

                        {/* Tournament Directory */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card border border-white/10 hover:border-gold/30 transition-colors block group cursor-pointer"
                            onClick={() => navigate('/tournaments')}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Trophy className="w-8 h-8 text-gray-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Tournament List</h2>
                            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                                Monitor registration status, scheduled auction dates, and live match results for all tournaments.
                            </p>
                            <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
                                Explore Events →
                            </div>
                        </motion.div>
                    </div>

                    {/* Activity Footer */}
                    <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-[0.3em]">
                            CricAura Administrative Backbone • Version 2.4.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
