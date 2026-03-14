import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../utils/api';
import { Mail, Lock, User, ChevronRight, ArrowLeft } from 'lucide-react';

const AuthForm = ({ isLogin = true, onSuccess }) => {
  const { login } = useAuth();
  const [mode, setMode] = useState(isLogin ? 'login' : 'register-type'); // login, register-type, register-player
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [playerRole, setPlayerRole] = useState('Batsman');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [battingStyle, setBattingStyle] = useState('Right');
  const [bowlingStyle, setBowlingStyle] = useState('None');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const { data } = await authAPI.login(email, password);
        login(data.user, data.token);
      } else if (mode === 'register-player') {
        const { data } = await authAPI.registerPlayer({
          email,
          password,
          fullName,
          age,
          playerRole,
          yearsOfExperience,
          battingStyle,
          bowlingStyle,
          phone,
          address,
        });
        login(data.user, data.token);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  // Login Form
  if (mode === 'login') {
    return (
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={handleSubmit}
        className="card w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gold mb-2 text-center">Sign In</h2>
        <p className="text-gray-400 text-center mb-6 text-sm">Enter your credentials to access your account</p>

        {error && (
          <motion.div
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="mb-4 p-3 bg-red-900 border border-red-500 rounded text-red-200 text-sm"
          >
            {error}
          </motion.div>
        )}

        <div className="mb-4">
          <label className="flex items-center gap-2 text-gray-400 mb-2">
            <Mail className="w-4 h-4" />
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 text-gray-400 mb-2">
            <Lock className="w-4 h-4" />
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
            required
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 mb-4"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </motion.button>

        <button
          type="button"
          onClick={() => setMode('register-type')}
          className="w-full px-4 py-2 border border-gold/50 text-gold hover:bg-gold/10 rounded-lg font-semibold transition"
        >
          New Player? Register Here
        </button>
      </motion.form>
    );
  }

  // Register Mode Selection
  if (mode === 'register-type') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gold mb-2 text-center">Get Started</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Create your account and join CricAura</p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setMode('register-player');
            setError('');
          }}
          className="w-full px-6 py-4 bg-gold/20 border-2 border-gold rounded-lg hover:bg-gold/30 transition mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-bold text-gold text-lg">Register as Player</h3>
              <p className="text-gray-400 text-xs mt-1">Create player profile & join tournaments</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gold" />
          </div>
        </motion.button>

        <button
          type="button"
          onClick={() => setMode('login')}
          className="w-full px-4 py-2 text-gray-400 hover:text-gold transition mt-4"
        >
          ← Back to Sign In
        </button>
      </motion.div>
    );
  }

  // Player Registration Form
  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onSubmit={handleSubmit}
      className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <button
        type="button"
        onClick={() => setMode('register-type')}
        className="flex items-center gap-2 text-gold hover:text-gold/80 mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="text-2xl font-bold text-gold mb-2">Register as Player</h2>
      <p className="text-gray-400 text-sm mb-6">Complete your profile to get started</p>

      {error && (
        <motion.div
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          className="mb-4 p-3 bg-red-900 border border-red-500 rounded text-red-200 text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="flex items-center gap-2 text-gray-400 mb-2">
            <User className="w-4 h-4" />
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-field"
            placeholder="Your full name"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center gap-2 text-gray-400 mb-2">
            <Mail className="w-4 h-4" />
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="your@email.com"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="flex items-center gap-2 text-gray-400 mb-2">
            <Lock className="w-4 h-4" />
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
            required
          />
        </div>

        {/* Age */}
        <div>
          <label className="text-gray-400 mb-2 block text-sm">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="input-field"
            placeholder="e.g., 25"
            min="16"
            max="65"
            required
          />
        </div>

        {/* Player Role */}
        <div>
          <label className="text-gray-400 mb-2 block text-sm">Playing Role</label>
          <select
            value={playerRole}
            onChange={(e) => setPlayerRole(e.target.value)}
            className="input-field"
            required
          >
            <option value="Batsman">Batsman</option>
            <option value="Bowler">Bowler</option>
            <option value="All-rounder">All-rounder</option>
            <option value="Wicketkeeper">Wicketkeeper</option>
          </select>
        </div>

        {/* Years of Experience */}
        <div>
          <label className="text-gray-400 mb-2 block text-sm">Years of Experience</label>
          <input
            type="number"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            className="input-field"
            placeholder="e.g., 5"
            min="0"
            max="50"
            required
          />
        </div>

        {/* Batting Style */}
        <div>
          <label className="text-gray-400 mb-2 block text-sm">Batting Style</label>
          <select
            value={battingStyle}
            onChange={(e) => setBattingStyle(e.target.value)}
            className="input-field"
            required
          >
            <option value="Right">Right-handed</option>
            <option value="Left">Left-handed</option>
          </select>
        </div>

        {/* Bowling Style */}
        <div>
          <label className="text-gray-400 mb-2 block text-sm">Bowling Style</label>
          <select
            value={bowlingStyle}
            onChange={(e) => setBowlingStyle(e.target.value)}
            className="input-field"
          >
            <option value="None">None</option>
            <option value="Pace">Pace</option>
            <option value="Spin">Spin</option>
            <option value="Medium">Medium</option>
          </select>
        </div>

        {/* Phone */}
        <div>
          <label className="text-gray-400 mb-2 block text-sm">Phone (Optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Address */}
        <div>
          <label className="text-gray-400 mb-2 block text-sm">Address (Optional)</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-field"
            placeholder="City, Country"
          />
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 mt-6"
      >
        {loading ? 'Creating Account...' : 'Complete Registration'}
      </motion.button>

      <p className="text-gray-500 text-xs text-center mt-4">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => setMode('login')}
          className="text-gold hover:underline"
        >
          Sign in here
        </button>
      </p>
    </motion.form>
  );
};

export default AuthForm;
