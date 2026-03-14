import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Search, ChevronLeft, Lock, Unlock, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { userAPI } from '../../utils/api';

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
    <AnimatePresence>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl backdrop-blur-sm
            ${t.type === 'success'
              ? 'bg-green-900/80 border-green-500/40 text-green-300'
              : 'bg-red-900/80 border-red-500/40 text-red-300'}`}
        >
          {t.type === 'success'
            ? <CheckCircle className="w-5 h-5 shrink-0" />
            : <XCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-semibold">{t.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const SuperAdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [togglingId, setTogglingId] = useState(null); // which user row is in-flight
  const [toasts, setToasts] = useState([]);

  // Get logged-in user id to protect "your own" row
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await userAPI.getAllUsers();
      const mapped = (data.users || []).map((u) => ({
        ...u,
        // Backend stores isActive (boolean), front-end uses status string
        status: u.isActive === false ? 'inactive' : 'active',
        createdAt: u.createdAt ? u.createdAt.split('T')[0] : 'Unknown',
      }));
      setUsers(mapped);
    } catch (error) {
      console.error('Failed to load users:', error);
      addToast('Failed to load users', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role) => {
    const colors = {
      SUPER_ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
      ADMIN: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      ORGANIZER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      TEAM_OWNER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      PLAYER: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return colors[role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusBadgeColor = (status) =>
    status === 'active'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';

  const handleToggleStatus = async (userId, currentStatus) => {
    setTogglingId(userId);
    try {
      const { data } = await userAPI.toggleStatus(userId);
      // Update local state from server response (source of truth)
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, isActive: data.user.isActive, status: data.user.isActive ? 'active' : 'inactive' }
            : u
        )
      );
      const newStatus = data.user.isActive ? 'activated' : 'deactivated';
      addToast(`${data.user.fullName} has been ${newStatus}.`, 'success');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update user status';
      addToast(msg, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Is this row "protected" (can't toggle)?
  const isProtected = (user) =>
    user.role === 'SUPER_ADMIN' || user._id === currentUser?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex items-center gap-3 text-gold text-xl">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <Toast toasts={toasts} />

      <div className="py-12">
        <div className="container mx-auto px-4">

          {/* Page header */}
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
                <h1 className="text-4xl font-black text-white tracking-tight">User Directory</h1>
                <p className="text-slate-400 font-medium tracking-wide">Command &amp; Control • Access Permissions</p>
              </div>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 bg-gold/10 border border-gold/40 hover:bg-gold/20 hover:border-gold text-gold font-semibold rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </motion.button>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-white/5 mb-8 bg-slate-900/40"
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Search Database</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Filter by name or email identity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-dark-bg/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-gold transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Role Permission Level</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-gold transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Security Levels</option>
                  <option value="SUPER_ADMIN">Level 5: Super Admin</option>
                  <option value="ADMIN">Level 4: Admin (Trial Mngr)</option>
                  <option value="ORGANIZER">Level 3: Organizer</option>
                  <option value="TEAM_OWNER">Level 2: Team Owner</option>
                  <option value="PLAYER">Level 1: Registered Player</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card border border-gold/30 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gold/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => {
                    const protected_ = isProtected(user);
                    const isToggling = togglingId === user._id;
                    return (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.04 }}
                        className={`border-b border-gold/10 transition ${protected_ ? 'opacity-60' : 'hover:bg-gold/5'}`}
                      >
                        <td className="px-6 py-4 text-white font-medium">{user.fullName}</td>
                        <td className="px-6 py-4 text-gray-400">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(user.status)}`}>
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">{user.createdAt}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => !protected_ && handleToggleStatus(user._id, user.status)}
                              disabled={protected_ || isToggling}
                              title={
                                protected_
                                  ? 'Cannot change Super Admin status'
                                  : user.status === 'active'
                                    ? 'Deactivate user'
                                    : 'Activate user'
                              }
                              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold
                                ${protected_ || isToggling
                                  ? 'cursor-not-allowed opacity-40'
                                  : user.status === 'active'
                                    ? 'hover:bg-red-500/10 text-red-400 border border-red-500/20 hover:border-red-500/50'
                                    : 'hover:bg-green-500/10 text-green-400 border border-green-500/20 hover:border-green-500/50'
                                }`}
                            >
                              {isToggling ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : user.status === 'active' ? (
                                <><Lock className="w-4 h-4" /> Deactivate</>
                              ) : (
                                <><Unlock className="w-4 h-4" /> Activate</>
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No users found matching your criteria</p>
              </div>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-4 mt-8"
          >
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Total Users</p>
              <p className="text-3xl font-bold text-gold">{users.length}</p>
            </div>
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Active Users</p>
              <p className="text-3xl font-bold text-green-400">{users.filter((u) => u.status === 'active').length}</p>
            </div>
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Inactive Users</p>
              <p className="text-3xl font-bold text-red-400">{users.filter((u) => u.status === 'inactive').length}</p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default SuperAdminUsersPage;
