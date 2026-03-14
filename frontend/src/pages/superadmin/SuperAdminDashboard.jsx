import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Users, Trophy, Zap, TrendingUp, Activity } from 'lucide-react';
import { userAPI, tournamentAPI } from '../../utils/api';
import api from '../../utils/api';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: '—',
    totalTournaments: '—',
    activePlayers: '—',
    mlStatus: 'checking...',
  });
  const [loadingStats, setLoadingStats] = useState(true);

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

        // Check ML service health
        let mlStatus = 'Offline';
        try {
          const mlBase = (import.meta.env.VITE_ML_URL || 'http://localhost:5001').replace(/\/$/, '');
          await fetch(`${mlBase}/api/health`, { signal: AbortSignal.timeout(2000) });
          mlStatus = 'Online ✅';
        } catch {
          mlStatus = 'Offline / Fallback Mode';
        }

        setStats({
          totalUsers: users.length,
          totalTournaments: tournaments.length,
          activePlayers: playerCount,
          mlStatus,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
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
              Super Admin Control Panel
            </h1>
            <p className="text-gray-400 text-lg">System administration & global oversight</p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12"
          >
            <StatCard
              icon={Users}
              label="Total Users"
              value={loadingStats ? '...' : stats.totalUsers}
              color="gold"
            />
            <StatCard
              icon={Trophy}
              label="Tournaments"
              value={loadingStats ? '...' : stats.totalTournaments}
              color="gold"
            />
            <StatCard
              icon={Zap}
              label="Player Accounts"
              value={loadingStats ? '...' : stats.activePlayers}
              color="gold"
            />
            <StatCard
              icon={Activity}
              label="ML Service"
              value={loadingStats ? '...' : stats.mlStatus}
              color="gold"
            />
          </motion.div>

          {/* Control Sections */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* User Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card border border-gold/50"
            >
              <Users className="w-8 h-8 text-gold mb-3" />
              <h2 className="text-2xl font-bold text-white mb-4">User Management</h2>
              <p className="text-gray-400 mb-6">
                Manage all system users, organizers, admins, team owners, and players
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ View all users
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Manage roles & permissions
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Activate/Deactivate accounts
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ View audit logs
                </li>
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/superadmin/users')}
                className="btn-primary w-full"
              >
                Go to Users
              </motion.button>
            </motion.div>

            {/* Tournament Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card border border-gold/50"
            >
              <Trophy className="w-8 h-8 text-gold mb-3" />
              <h2 className="text-2xl font-bold text-white mb-4">Tournament Oversight</h2>
              <p className="text-gray-400 mb-6">
                Monitor and manage all tournaments across the platform
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ View all tournaments
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Approve/Reject tournaments
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ View auction status
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Analytics & reports
                </li>
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/superadmin/tournaments')}
                className="btn-primary w-full"
              >
                View Tournaments
              </motion.button>
            </motion.div>

            {/* ML Service */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card border border-gold/50"
            >
              <Zap className="w-8 h-8 text-gold mb-3" />
              <h2 className="text-2xl font-bold text-white mb-4">Service Monitor</h2>
              <p className="text-gray-400 mb-6">
                Monitor system services and player evaluation performance
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Service status
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Classification consistency
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Model performance
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ API usage
                </li>
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/superadmin/ml-monitor')}
                className="btn-primary w-full"
              >
                Monitor ML
              </motion.button>
            </motion.div>

            {/* System Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden"
            >
              <TrendingUp className="w-8 h-8 text-gold mb-3" />
              <h2 className="text-2xl font-bold text-white mb-4">System Settings</h2>
              <p className="text-gray-400 mb-6">
                Configure global system settings and platform preferences
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ General settings
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Email configuration
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Payment settings
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  ✓ Backup & restore
                </li>
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary w-full"
              >
                Settings
              </motion.button>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card border border-gold/50 mt-8"
          >
            <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/create-tournament')}
                className="btn-secondary"
              >
                Create Tournament
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/superadmin/add-organizer')}
                className="btn-secondary"
              >
                Add Organizer
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/superadmin/logs')}
                className="btn-secondary"
              >
                View Logs
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/superadmin/reports')}
                className="btn-secondary"
              >
                Generate Report
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
