import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  // Role-based navigation items
  const getNavItems = () => {
    if (!user) return [];

    const commonItems = [
      { label: 'Home', href: '/' },
    ];

    const roleItems = {
      SUPER_ADMIN: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Users', href: '/superadmin/users' },
        { label: 'Tournaments', href: '/superadmin/tournaments' },
        { label: 'ML Monitor', href: '/superadmin/ml-monitor' },
        { label: 'Record Trials', href: '/admin/trials' },
      ],
      ORGANIZER: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Create Tournament', href: '/create-tournament' },
        { label: 'Auction Mgmt', href: '/auction-management' },
        { label: 'Players', href: '/players' },
      ],
      ADMIN: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Record Trials', href: '/admin/trials' },
        { label: 'Tournaments', href: '/tournaments' },
        { label: 'Players', href: '/players' },
      ],
      TEAM_OWNER: [
        { label: 'My Team', href: '/dashboard' },
        { label: 'Auctions', href: '/available-auctions' },
        { label: 'Tournaments', href: '/tournaments' },
      ],
      PLAYER: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Tournaments', href: '/tournaments' },
      ],
    };

    return [...commonItems, ...(roleItems[user.role] || [])];
  };

  const navItems = getNavItems();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-gradient-sport border-b border-gold sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Trophy className="w-10 h-10 text-gold" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">CricAura</h1>
            <p className="text-gold text-xs md:text-sm">Integrated Auction Management System</p>
          </div>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-white hover:text-gold transition font-medium text-sm"
            >
              {item.label}
            </Link>
          ))}

          {user && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 border-l border-gold/30 pl-6"
            >
              {/* Role Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-gold/20 text-gold px-3 py-1 rounded-full">
                  {user.role.replace(/_/g, ' ')}
                </span>
              </div>

              {/* User Info */}
              <div className="text-right">
                <p className="text-white font-semibold text-sm">{user.fullName}</p>
                <p className="text-gold text-xs">{user.email}</p>
              </div>

              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </motion.div>
          )}

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all flex items-center justify-center"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>

          {!user && (
            <Link
              to="/?auth=login"
              className="btn-primary text-sm"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="md:hidden text-gold"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-dark-bg border-t border-gold/30 px-4 py-4 space-y-4"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMenuOpen(false)}
              className="block text-white hover:text-gold transition font-medium"
            >
              {item.label}
            </Link>
          ))}

          {user && (
            <>
              <div className="border-t border-gold/30 pt-4 mt-4">
                <p className="text-gold text-sm font-semibold mb-3">
                  {user.role.replace(/_/g, ' ')}
                </p>
                <p className="text-white font-semibold text-sm mb-1">{user.fullName}</p>
                <p className="text-gold text-xs mb-4">{user.email}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </>
          )}

          {/* Mobile Theme Toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="w-full p-4 rounded-xl bg-gold/10 text-gold border border-gold/20 flex items-center justify-center gap-3 font-semibold"
          >
            {theme === 'dark' ? (
              <><Sun className="w-5 h-5" /> Light Mode</>
            ) : (
              <><Moon className="w-5 h-5" /> Dark Mode</>
            )}
          </motion.button>

          {!user && (
            <Link
              to="/?auth=login"
              onClick={() => setMenuOpen(false)}
              className="block text-center btn-primary"
            >
              Sign In
            </Link>
          )}
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;
