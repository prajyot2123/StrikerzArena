import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { ChevronLeft, Download, Calendar, BarChart3, Users, Trophy, TrendingUp, Mail, Clock } from 'lucide-react';
import { userAPI, tournamentAPI, auditAPI, reportsAPI } from '../../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data based on selected report and date range
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        let data = null;

        // Note: Currently, platform-overview returns a full snapshot. 
        // We'll use it for overview and decompose it for others.
        const statsRes = await reportsAPI.getPlatformOverview();
        const stats = statsRes.data;

        if (selectedReport === 'overview') {
          data = {
            title: 'Platform Overview',
            description: 'High-level summary of platform metrics',
            metrics: [
              { label: 'Total Users', value: stats.summary.totalUsers || 0, change: 'Lifetime', icon: Users },
              { label: 'Total Tournaments', value: stats.summary.totalTournaments || 0, change: `${stats.distribution.tournaments?.approved || 0} Approved`, icon: Trophy },
              { label: 'Global Revenue', value: `₹${(stats.summary.totalRevenue || 0).toLocaleString()}`, change: 'From Player Sales', icon: TrendingUp },
              { label: 'Total Players', value: stats.summary.totalPlayers || 0, change: `${stats.distribution.roles?.PLAYER || 0} Registered`, icon: Users },
            ],
          };
        } else if (selectedReport === 'users') {
          data = {
            title: 'User Analytics',
            description: 'Detailed user demographics and distribution',
            metrics: [
              { label: 'Total Users', value: stats.summary.totalUsers, change: 'Lifetime' },
              { label: 'Players', value: stats.distribution.roles.PLAYER || 0, change: 'Role: PLAYER' },
              { label: 'Organizers', value: stats.distribution.roles.ORGANIZER || 0, change: 'Role: ORGANIZER' },
              { label: 'Team Owners', value: stats.distribution.roles.TEAM_OWNER || 0, change: 'Role: TEAM_OWNER' },
            ],
            breakdown: stats.distribution.roles,
          };
        } else if (selectedReport === 'tournaments') {
          data = {
            title: 'Tournament Reports',
            description: 'Tournament performance and distribution',
            metrics: [
              { label: 'Total Tournaments', value: stats.summary.totalTournaments, change: 'All time' },
              { label: 'Approved', value: stats.distribution.tournaments.approved || 0, change: 'Active' },
              { label: 'Pending', value: stats.distribution.tournaments.pending || 0, change: 'Awaiting Action' },
              { label: 'Auctions', value: stats.summary.totalAuctions, change: 'Live/Scheduled' },
            ],
            details: stats.distribution.tournaments,
          };
        } else if (selectedReport === 'revenue') {
          data = {
            title: 'Revenue Report',
            description: 'Financial performance based on auction player sales',
            metrics: [
              { label: 'Total Sales Revenue', value: `₹${stats.summary.totalRevenue.toLocaleString()}`, change: 'Cumulative' },
              { label: 'Total Sold Players', value: stats.summary.transactionCount, change: 'Sales count' },
              { label: 'Avg Sale Price', value: `₹${stats.summary.avgTransaction}`, change: 'Per player' },
              { label: 'Platform Volume', value: stats.summary.totalAuctions, change: 'Auctions run' },
            ],
            revenueBreakdown: {
              'Auction Player Sales': `₹${stats.summary.totalRevenue.toLocaleString()}`,
              'Transactions Processed': stats.summary.transactionCount,
              'Completed Auctions': stats.distribution.auctions.COMPLETED || 0,
              'Live/Active Auctions': stats.distribution.auctions.LIVE || 0,
            },
          };
        }

        if (stats && stats.summary && stats.distribution) {
          setReportData({
            ...data,
            trends: stats.trends || []
          });
          setError(null);
        } else {
          console.warn('Incomplete data structure:', stats);
          throw new Error('The platform stats were received but are in an incomplete format.');
        }
      } catch (err) {
        console.error('Failed to fetch report data:', err);
        setError(err.response?.data?.message || err.message || 'Unknown connection error');
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedReport, dateRange]);

  const handleExport = async (format) => {
    try {
      setExporting(true);

      // Prepare data for export
      const exportData = {
        report: selectedReport,
        dateRange: dateRange,
        timestamp: new Date().toLocaleString(),
        data: reportData,
      };

      if (format === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(reportData.title, 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${exportData.timestamp}`, 14, 30);
        doc.text(`Range: ${dateRange}`, 14, 35);

        const tableData = reportData.metrics.map(m => [m.label, String(m.value), m.change]);
        doc.autoTable({
          startY: 45,
          head: [['Metric', 'Value', 'Context']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [184, 134, 11] } // Gold-ish
        });

        doc.save(`${selectedReport}-report.pdf`);
      } else if (format === 'csv') {
        let csvContent = 'Metric,Value,Context\n';
        reportData?.metrics?.forEach(m => {
          csvContent += `"${m.label}","${m.value}","${m.change}"\n`;
        });
        downloadFile(csvContent, `report-${selectedReport}.csv`, 'text/csv');
      } else if (format === 'email') {
        const user = JSON.parse(localStorage.getItem('user'));
        await reportsAPI.emailReport(user.email, reportData.title);
        alert(`Success! The ${reportData.title} has been sent to ${user.email}`);
      } else if (format === 'schedule') {
        await reportsAPI.scheduleReport('Weekly', reportData.title);
        alert(`Schedule Created! You will now receive the ${reportData.title} every Monday morning.`);
      }

      setExporting(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Operation failed. Please check your connection.');
      setExporting(false);
    }
  };

  const renderChart = () => {
    if (!reportData || !reportData.trends) return null;

    if (selectedReport === 'overview' || selectedReport === 'revenue') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={reportData.trends}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #D4AF37', borderRadius: '8px' }}
              itemStyle={{ color: '#D4AF37' }}
            />
            <Area type="monotone" dataKey={selectedReport === 'revenue' ? 'revenue' : 'users'} stroke="#D4AF37" fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (selectedReport === 'users') {
      const pieData = Object.entries(reportData.breakdown || {}).map(([name, value]) => ({ name, value }));
      const COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #D4AF37', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={reportData.trends}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="name" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #D4AF37', borderRadius: '8px' }}
            itemStyle={{ color: '#D4AF37' }}
          />
          <Bar dataKey="tournaments" fill="#D4AF37" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reports = [
    {
      id: 'overview',
      title: 'Platform Overview',
      icon: BarChart3,
      description: 'High-level summary of platform metrics',
    },
    {
      id: 'users',
      title: 'User Analytics',
      icon: Users,
      description: 'Detailed user demographics and distribution',
    },
    {
      id: 'tournaments',
      title: 'Tournament Reports',
      icon: Trophy,
      description: 'Tournament performance and participation',
    },
    {
      id: 'revenue',
      title: 'Revenue Report',
      icon: TrendingUp,
      description: 'Financial performance and analytics',
    },
  ];

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
                onClick={() => navigate('/superadmin-dashboard')}
                className="p-2 hover:bg-gold/10 rounded-lg transition"
              >
                <ChevronLeft className="w-6 h-6 text-gold" />
              </button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Reports & Analytics</h1>
                <p className="text-gray-400">Generate and analyze platform reports</p>
              </div>
            </motion.div>
          </div>

          {/* Report Selection Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-4 gap-4 mb-8"
          >
            {reports.map(report => {
              const ReportIcon = report.icon;
              return (
                <motion.button
                  key={report.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedReport(report.id)}
                  className={`p-4 rounded-lg border-2 transition text-left ${selectedReport === report.id
                    ? 'border-gold bg-gold/10 shadow-lg shadow-gold/20'
                    : 'border-gold/20 hover:border-gold/50 bg-dark-input'
                    }`}
                >
                  <ReportIcon className={`w-6 h-6 mb-2 ${selectedReport === report.id ? 'text-gold' : 'text-gray-400'}`} />
                  <p className={`font-semibold text-sm ${selectedReport === report.id ? 'text-gold' : 'text-white'}`}>
                    {report.title}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">{report.description}</p>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Date Range Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-gold/30 p-6 mb-8"
          >
            <label className="text-gold font-semibold mb-4 block flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select Date Range
            </label>
            <div className="flex flex-wrap gap-3">
              {['week', 'month', 'quarter', 'year'].map(range => (
                <motion.button
                  key={range}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDateRange(range)}
                  className={`px-5 py-2 rounded-lg font-semibold transition ${dateRange === range
                    ? 'bg-gold/20 border border-gold text-gold'
                    : 'bg-dark-input border border-gold/20 text-gray-300 hover:border-gold/50'
                    }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Report Content */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-gold text-xl">Loading report...</div>
            </motion.div>
          ) : reportData ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Report Title & Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card border border-gold/30 p-6"
              >
                <h2 className="text-3xl font-bold text-white mb-2">{reportData.title}</h2>
                <p className="text-gray-400">{reportData.description}</p>
                <p className="text-gray-500 text-sm mt-3">
                  Generated: {new Date().toLocaleString()} | Date Range: {dateRange.toUpperCase()}
                </p>
              </motion.div>

              {/* Metrics Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid md:grid-cols-2 gap-6"
              >
                {reportData.metrics?.map((metric, index) => {
                  const MetricIcon = metric.icon;
                  return (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index + 1) * 0.05 }}
                      className="card border border-gold/30 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">{metric.label}</p>
                          <h3 className="text-3xl font-bold text-white">{metric.value}</h3>
                        </div>
                        {MetricIcon && (
                          <MetricIcon className="w-8 h-8 text-gold/50" />
                        )}
                      </div>
                      <p className={`text-sm font-semibold ${String(metric.change || "").includes('+') ? 'text-green-400' : 'text-gray-400'}`}>
                        {metric.change}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Additional Breakdown (if available) */}
              {(reportData.breakdown || reportData.details || reportData.revenueBreakdown) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card border border-gold/30 p-6"
                >
                  <h3 className="text-xl font-bold text-white mb-6">Detailed Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(reportData.breakdown || reportData.details || reportData.revenueBreakdown || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between pb-3 border-b border-gold/10 last:border-0">
                        <span className="text-gray-300">{key}</span>
                        <span className="text-gold font-bold">{value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Data Visualization Placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card border border-gold/30 p-8"
              >
                <h3 className="text-xl font-bold text-white mb-6">Trend Visualization</h3>
                <div className="p-6">
                  <div className="h-[300px] w-full bg-black/20 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden">
                    {renderChart()}
                  </div>
                </div>
              </motion.div>

              {/* Export Options */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card border border-gold/30 p-6"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Download className="w-5 h-5 text-gold" />
                  Export & Share Options
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExport('pdf')}
                    disabled={exporting}
                    className="px-6 py-3 bg-blue-500/20 border border-blue-500/50 text-blue-400 font-semibold rounded-lg hover:bg-blue-500/30 transition disabled:opacity-50"
                  >
                    📊 {exporting ? 'Exporting...' : 'Export as PDF'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExport('csv')}
                    disabled={exporting}
                    className="px-6 py-3 bg-green-500/20 border border-green-500/50 text-green-400 font-semibold rounded-lg hover:bg-green-500/30 transition disabled:opacity-50"
                  >
                    📈 {exporting ? 'Exporting...' : 'Export as CSV'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExport('schedule')}
                    className="px-6 py-3 bg-purple-500/20 border border-purple-500/50 text-purple-400 font-semibold rounded-lg hover:bg-purple-500/30 transition"
                  >
                    🔄 Schedule Report
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExport('email')}
                    className="px-6 py-3 bg-orange-500/20 border border-orange-500/50 text-orange-400 font-semibold rounded-lg hover:bg-orange-500/30 transition"
                  >
                    ✉️ Email Report
                  </motion.button>
                </div>
              </motion.div>

              {/* Report Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-gray-400 text-sm"
              >
                <p>Report generated for: {reportData.title}</p>
                <p>Data as of: {new Date().toLocaleDateString()}</p>
              </motion.div>
            </motion.div>
          ) : (
            <div className="text-center py-12 card border border-red-500/30 bg-red-500/5 max-w-2xl mx-auto">
              <BarChart3 className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Failed to Load Reports</h3>
              <p className="text-red-400 mb-4">{error || 'An unexpected error occurred while fetching analytics.'}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition font-semibold"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
