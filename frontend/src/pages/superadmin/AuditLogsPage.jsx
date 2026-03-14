import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { ChevronLeft, Search, Calendar, User } from 'lucide-react';
import { auditAPI } from '../../utils/api';

const AuditLogsPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await auditAPI.getAllLogs();
        setLogs(data.logs || []);
      } catch (error) {
        console.error('Failed to load audit logs:', error);
        setLogs([]);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionColor = (action) => {
    const colors = {
      'CREATE_TOURNAMENT': 'bg-green-500/20 text-green-400',
      'UPDATE_TOURNAMENT': 'bg-blue-500/20 text-blue-400',
      'DELETE_USER': 'bg-red-500/20 text-red-400',
      'LOGIN': 'bg-purple-500/20 text-purple-400',
      'LOGOUT': 'bg-indigo-500/20 text-indigo-400',
      'CREATE_ACCOUNT': 'bg-orange-500/20 text-orange-400',
      'CREATE_TEAM': 'bg-cyan-500/20 text-cyan-400',
      'UPDATE_SETTINGS': 'bg-yellow-500/20 text-yellow-400',
      'EXPORT_DATA': 'bg-pink-500/20 text-pink-400',
    };
    return colors[action] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusColor = (status) => {
    return status === 'success' ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />

      <div className="py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => navigate('/superadmin-dashboard')}
              className="p-2 hover:bg-gold/10 rounded-lg transition"
            >
              <ChevronLeft className="w-6 h-6 text-gold" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Audit Logs</h1>
              <p className="text-gray-400">System activity and user actions</p>
            </div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-gold/30 mb-8 p-6"
          >
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by user or action..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-dark-input border border-gold/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-input border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">Login</option>                <option value="LOGOUT">Logout</option>
                <option value="CREATE_ACCOUNT">Create Account</option>                  <option value="CREATE_TOURNAMENT">Create Tournament</option>
                  <option value="UPDATE_TOURNAMENT">Update Tournament</option>
                  <option value="CREATE_TEAM">Create Team</option>
                  <option value="DELETE_USER">Delete User</option>
                  <option value="UPDATE_SETTINGS">Update Settings</option>
                  <option value="EXPORT_DATA">Export Data</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-input border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                >
                  <option value="24hours">Last 24 Hours</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Logs Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card border border-gold/30 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gold/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Action</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Resource</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">IP Address</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <motion.tr
                      key={log._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gold/10 hover:bg-gold/5 transition"
                    >
                      <td className="px-6 py-4 text-white font-medium text-sm">{log.user}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{log.resource}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${getStatusColor(log.status)}`}>
                          {log.status === 'success' ? '✓ Success' : '✗ Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{log.ip}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{log.timestamp}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No logs found matching your criteria</p>
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
              <p className="text-gray-400 text-sm mb-2">Total Events</p>
              <p className="text-3xl font-bold text-gold">{logs.length}</p>
            </div>
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Successful</p>
              <p className="text-3xl font-bold text-green-400">{logs.filter(l => l.status === 'success').length}</p>
            </div>
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Failed</p>
              <p className="text-3xl font-bold text-red-400">{logs.filter(l => l.status === 'failed').length}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
