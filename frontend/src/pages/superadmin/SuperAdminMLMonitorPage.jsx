import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { ChevronLeft, Zap, Activity, TrendingUp, RefreshCw } from 'lucide-react';
import { tournamentAPI } from '../../utils/api';

const SuperAdminMLMonitorPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mlStats, setMlStats] = useState({
    serviceStatus: 'checking',
    uptime: 'N/A',
    lastSync: '-',
    classificationsToday: 0,
    averageConfidence: 0,
    modelVersion: 'RandomForest',
    totalPlayersClassified: 0,
  });
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [recentClassifications, setRecentClassifications] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // ML service health check with 5-second timeout
      // Requires flask-cors to be enabled on the ML service (CORS was the cause of OFFLINE status)
      const mlBaseUrl = (import.meta.env.VITE_ML_URL || 'http://localhost:5001').replace(/\/$/, '');
      const mlHealthUrl = `${mlBaseUrl}/api/health`;
      let mlOnline = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const healthRes = await fetch(mlHealthUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        mlOnline = healthRes.ok;
      } catch (err) {
        // Network error or CORS block — service unreachable
        console.warn('[ML Monitor] Health check failed:', err?.message || err);
        mlOnline = false;
      }

      const tournamentsRes = await tournamentAPI.getAllTournaments();
      const tournaments = tournamentsRes.data.tournaments || [];

      const trialResults = await Promise.all(
        tournaments.map(async (tournament) => {
          try {
            const trialsRes = await tournamentAPI.getTournamentTrials(tournament._id);
            return trialsRes.data.trials || [];
          } catch {
            return [];
          }
        })
      );

      const allTrials = trialResults.flat();
      const recent = [...allTrials]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 10)
        .map((t) => ({
          id: t._id,
          playerName: t.playerId?.fullName || 'Unknown',
          category: t.category || '-',
          score: Math.round(t.finalScore || 0),
          confidence: Number(t.confidence || 0),
          timestamp: new Date(t.updatedAt || t.createdAt).toLocaleString(),
        }));

      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayCount = allTrials.filter((t) => new Date(t.createdAt) >= dayStart).length;
      const confidences = allTrials.map((t) => Number(t.confidence || 0)).filter((c) => c > 0);
      const avgConfidence = confidences.length
        ? (confidences.reduce((s, c) => s + c, 0) / confidences.length) * 100
        : 0;

      setMlStats({
        serviceStatus: mlOnline ? 'online' : 'offline',
        uptime: mlOnline ? 'Live' : 'Unavailable',
        lastSync: new Date().toLocaleString(),
        classificationsToday: todayCount,
        averageConfidence: avgConfidence,
        modelVersion: 'RandomForest',
        totalPlayersClassified: allTrials.length,
      });

      setPerformanceMetrics([
        { metric: 'Classifier Service', value: mlOnline ? 'Online' : 'Offline', status: mlOnline ? 'excellent' : 'critical' },
        { metric: 'Average Confidence', value: `${avgConfidence.toFixed(1)}%`, status: avgConfidence >= 85 ? 'excellent' : avgConfidence >= 70 ? 'good' : 'warning' },
        { metric: 'Classifications Today', value: `${todayCount}`, status: todayCount > 0 ? 'good' : 'warning' },
        { metric: 'Total Classified Trials', value: `${allTrials.length}`, status: allTrials.length > 0 ? 'excellent' : 'warning' },
      ]);
      setRecentClassifications(recent);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getStatusColor = (status) => {
    const colors = {
      excellent: 'text-green-400 bg-green-500/20 border-green-500/30',
      good: 'text-blue-300 bg-blue-500/20 border-blue-500/30',
      warning: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30',
      critical: 'text-red-300 bg-red-500/20 border-red-500/30',
    };
    return colors[status] || colors.good;
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="py-12">
        <div className="container mx-auto px-4">
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
                <h1 className="text-4xl font-black text-white tracking-tight">Evaluation Monitor</h1>
                <p className="text-slate-400 font-medium tracking-wide">Integrated Infrastructure • Assisted Classification</p>
              </div>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 bg-gold/10 border border-gold/40 hover:bg-gold/20 hover:border-gold text-gold font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </motion.button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card border border-gold/30 mb-8 p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-2">Service Status</p>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${loading
                      ? 'bg-yellow-400 animate-pulse'
                      : mlStats.serviceStatus === 'online'
                        ? 'bg-green-400 animate-pulse'
                        : 'bg-red-400'
                    }`}></div>
                  <p className={`text-xl font-bold ${loading
                      ? 'text-yellow-300'
                      : mlStats.serviceStatus === 'online'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                    {loading ? 'CHECKING...' : mlStats.serviceStatus.toUpperCase()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Model</p>
                <p className="text-xl font-bold text-gold">{mlStats.modelVersion}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Last Sync</p>
                <p className="text-sm font-semibold text-gray-200">{mlStats.lastSync}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Classifications Today</p>
              <p className="text-4xl font-bold text-gold mb-2">{mlStats.classificationsToday}</p>
            </div>
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Average Confidence</p>
              <p className="text-4xl font-bold text-blue-300 mb-2">{mlStats.averageConfidence.toFixed(1)}%</p>
            </div>
            <div className="card border border-gold/30 p-6">
              <p className="text-gray-400 text-sm mb-2">Total Classified</p>
              <p className="text-4xl font-bold text-white mb-2">{mlStats.totalPlayersClassified}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card border border-gold/30 mb-8">
            <div className="p-6 border-b border-gold/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-gold" />
                Performance Metrics
              </h2>
            </div>
            <div className="divide-y divide-gold/10">
              {performanceMetrics.map((metric) => (
                <div key={metric.metric} className="p-6 flex items-center justify-between hover:bg-gold/5 transition">
                  <p className="text-white font-semibold">{metric.metric}</p>
                  <div className={`px-4 py-2 rounded-lg border inline-block ${getStatusColor(metric.status)}`}>
                    <p className="font-bold">{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card border border-gold/30">
            <div className="p-6 border-b border-gold/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-gold" />
                Recent Classifications
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gold/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Player</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Score</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Confidence</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gold">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="px-6 py-6 text-gray-400" colSpan={5}>Loading metrics...</td></tr>
                  ) : recentClassifications.length === 0 ? (
                    <tr><td className="px-6 py-6 text-gray-400" colSpan={5}>No classification records found.</td></tr>
                  ) : recentClassifications.map((classification) => (
                    <tr key={classification.id} className="border-b border-gold/10 hover:bg-gold/5 transition">
                      <td className="px-6 py-4 text-white font-medium">{classification.playerName}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {classification.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gold font-semibold">{classification.score}</td>
                      <td className="px-6 py-4 text-green-400 font-semibold">{(classification.confidence * 100).toFixed(0)}%</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{classification.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminMLMonitorPage;

