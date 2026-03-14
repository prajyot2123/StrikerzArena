import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// shared
import HomePage from './pages/shared/HomePage';
import TournamentsPage from './pages/shared/TournamentsPage';
import PlayersPage from './pages/shared/PlayersPage';
import DashboardPage from './pages/shared/DashboardPage';

// player
import PlayerDashboard from './pages/player/PlayerDashboard';

// admin
import AdminDashboard from './pages/admin/AdminDashboard';
import TrialManagementPage from './pages/admin/TrialManagementPage';
import AdminMatchResultsPage from './pages/admin/AdminMatchResultsPage';

// organizer
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateTournamentPage from './pages/organizer/CreateTournamentPage';
import MatchManagementPage from './pages/organizer/MatchManagementPage';

// teamowner
import TeamOwnerDashboard from './pages/teamowner/TeamOwnerDashboard';

// auction
import LiveAuctionPage from './pages/auction/LiveAuctionPage';
import AuctionManagementPage from './pages/auction/AuctionManagementPage';
import AvailableAuctionsPage from './pages/auction/AvailableAuctionsPage';

// superadmin
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import SuperAdminUsersPage from './pages/superadmin/SuperAdminUsersPage';
import SuperAdminTournamentsPage from './pages/superadmin/SuperAdminTournamentsPage';
import SuperAdminMLMonitorPage from './pages/superadmin/SuperAdminMLMonitorPage';
import SuperAdminSettingsPage from './pages/superadmin/SuperAdminSettingsPage';
import AddOrganizerPage from './pages/superadmin/AddOrganizerPage';
import AuditLogsPage from './pages/superadmin/AuditLogsPage';
import ReportsPage from './pages/superadmin/ReportsPage';

import './index.css';
import Footer from './components/Footer';


// Protected Route Component with optional role check
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

// Role-based Dashboard Route — each role gets its own dedicated dashboard
const RoleBasedDashboard = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" />;

  switch (user.role) {
    case 'PLAYER':
      return <PlayerDashboard />;
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />;
    case 'ORGANIZER':
      return <OrganizerDashboard />;
    case 'TEAM_OWNER':
      return <TeamOwnerDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <Navigate to="/" />;
  }
};

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/players" element={<PlayersPage />} />

            {/* Universal dashboard — redirects by role */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedDashboard />
                </ProtectedRoute>
              }
            />

            {/* Player routes */}
            <Route
              path="/player-dashboard"
              element={
                <ProtectedRoute allowedRoles={["PLAYER"]}>
                  <PlayerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/trials"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                  <TrialManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/match-results"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                  <AdminMatchResultsPage />
                </ProtectedRoute>
              }
            />

            {/* Super Admin routes */}
            <Route
              path="/super-admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin-dashboard"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/users"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <SuperAdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/tournaments"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <SuperAdminTournamentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/ml-monitor"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <SuperAdminMLMonitorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/add-organizer"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <AddOrganizerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/logs"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/reports"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Organizer routes */}
            <Route
              path="/organizer-dashboard"
              element={
                <ProtectedRoute allowedRoles={["ORGANIZER", "SUPER_ADMIN"]}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-tournament"
              element={
                <ProtectedRoute allowedRoles={["ORGANIZER", "SUPER_ADMIN"]}>
                  <CreateTournamentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auction-management"
              element={
                <ProtectedRoute allowedRoles={["ORGANIZER", "ADMIN", "SUPER_ADMIN"]}>
                  <AuctionManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/match-management/:tournamentId"
              element={
                <ProtectedRoute allowedRoles={["ORGANIZER", "SUPER_ADMIN"]}>
                  <MatchManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Team Owner routes */}
            <Route
              path="/my-team"
              element={
                <ProtectedRoute allowedRoles={["TEAM_OWNER"]}>
                  <TeamOwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/available-auctions"
              element={
                <ProtectedRoute>
                  <AvailableAuctionsPage />
                </ProtectedRoute>
              }
            />

            {/* Live Auction — accessible by all authenticated users */}
            <Route
              path="/auction/:auctionId"
              element={
                <ProtectedRoute>
                  <LiveAuctionPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all: redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
