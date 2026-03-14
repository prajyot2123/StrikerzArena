import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { ChevronLeft, Trophy, Calendar, Users, MapPin } from 'lucide-react';
import { tournamentAPI } from '../../utils/api';

const CreateTournamentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    maxTeams: 8,
    maxPlayersPerTeam: 15,
    format: 'T20',
    // Default total prize pool so purse per team is at least ₹1,000,000
    prizePool: (8 * 1000000).toString(),
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map front-end fields to backend expected fields
      const totalTeams = parseInt(formData.maxTeams) || 8;
      const playersPerTeam = parseInt(formData.maxPlayersPerTeam) || 11;
      const totalPrize = parseFloat(formData.prizePool);

      if (!formData.name.trim()) {
        alert('Tournament name is required');
        return;
      }

      if (!totalPrize || Number.isNaN(totalPrize) || totalPrize <= 0) {
        alert('Please enter a valid total prize pool (e.g. 8000000)');
        return;
      }

      // Ensure minimum purse per team is ₹1,000,000
      let pursePerTeam = totalTeams > 0 ? Math.floor(totalPrize / totalTeams) : 0;
      if (pursePerTeam < 1000000) {
        pursePerTeam = 1000000;
      }

      const registrationStartDate = formData.startDate;
      const registrationEndDate = formData.endDate;
      // Set trial/auction/firstMatch heuristics if not provided
      const trialsStartDate = formData.startDate || formData.startDate;
      const trialsEndDate = formData.endDate || formData.endDate;
      const auctionDate = formData.endDate || formData.endDate;
      const firstMatchDate = formData.endDate || formData.endDate;

      await tournamentAPI.create({
        name: formData.name,
        description: formData.description,
        format: formData.format,
        totalTeams,
        playersPerTeam,
        pursePerTeam,
        registrationStartDate,
        registrationEndDate,
        trialsStartDate,
        trialsEndDate,
        auctionDate,
        firstMatchDate,
        location: formData.location,
      });
      setSubmitted(true);
      setTimeout(() => {
        if (user?.role === 'SUPER_ADMIN') navigate('/super-admin-dashboard');
        else navigate('/organizer-dashboard');
      }, 1200);
    } catch (error) {
      console.error('Failed to create tournament:', error);
      const serverMsg = error?.response?.data?.message || error?.message;
      alert(serverMsg || 'Error creating tournament. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />

      <div className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => {
                if (user?.role === 'SUPER_ADMIN') navigate('/super-admin-dashboard');
                else navigate('/organizer-dashboard');
              }}
              className="p-2 hover:bg-gold/10 rounded-lg transition"
            >
              <ChevronLeft className="w-6 h-6 text-gold" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-8 h-8 text-gold" />
                Create New Tournament
              </h1>
              <p className="text-gray-400">Set up a new tournament on the platform</p>
            </div>
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-gold/30 p-8"
          >
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tournament Name */}
                <div>
                  <label className="text-gold text-sm font-semibold mb-2 block">
                    Tournament Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="form-control-dark w-full px-4 py-3 bg-dark-input border border-gold/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                    placeholder="e.g., Cricket Premier League 2024"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-gold text-sm font-semibold mb-2 block">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="form-control-dark w-full px-4 py-3 bg-dark-input border border-gold/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                    placeholder="Brief description of the tournament"
                  />
                </div>

                {/* Dates */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-gold text-sm font-semibold mb-2 block flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="form-control-dark w-full px-4 py-3 bg-dark-input border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-gold text-sm font-semibold mb-2 block flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      End Date *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                      className="form-control-dark w-full px-4 py-3 bg-dark-input border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-gold text-sm font-semibold mb-2 block flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="form-control-dark w-full px-4 py-3 bg-dark-input border border-gold/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                    placeholder="Tournament location"
                  />
                </div>

                {/* Format and Teams */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-gold text-sm font-semibold mb-2 block">Format *</label>
                    <select
                      name="format"
                      value={formData.format}
                      onChange={handleInputChange}
                      className="form-control-dark w-full px-4 py-3 bg-dark-input border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                    >
                      <option value="T20">T20</option>
                      <option value="ODI">ODI</option>
                      <option value="TEST">Test</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gold text-sm font-semibold mb-2 block flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Max Teams *
                    </label>
                    <input
                      type="number"
                      name="maxTeams"
                      value={formData.maxTeams}
                      onChange={handleInputChange}
                      className="form-control-dark w-full px-4 py-3 bg-dark-input border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                {/* Players and Prize */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-gold text-sm font-semibold mb-2 block">
                      Max Players Per Team
                    </label>
                    <input
                      type="number"
                      name="maxPlayersPerTeam"
                      value={formData.maxPlayersPerTeam}
                      onChange={handleInputChange}
                      className="form-control-dark w-full px-4 py-3 bg-dark-input border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-gold text-sm font-semibold mb-2 block">
                      Prize Pool (Rs)
                    </label>
                    <input
                      type="number"
                      name="prizePool"
                      value={formData.prizePool}
                      onChange={handleInputChange}
                      className="form-control-dark w-full px-4 py-3 bg-dark-input border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                      placeholder="Total prize pool amount"
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
                  <p className="text-gray-300 text-sm">
                    ✓ Once created, tournament details can be edited<br/>
                    ✓ Organizers can register teams and players<br/>
                    ✓ ML service will evaluate player performance
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gold text-dark-bg font-bold rounded-lg hover:bg-gold/90 transition"
                  >
                    Create Tournament
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      if (user?.role === 'SUPER_ADMIN') navigate('/super-admin-dashboard');
                      else navigate('/organizer-dashboard');
                    }}
                    className="flex-1 px-6 py-3 bg-gold/20 border border-gold/50 text-gold font-bold rounded-lg hover:bg-gold/30 transition"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-green-500/20 border border-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Tournament Created!</h2>
                <p className="text-gray-400 mb-6">{formData.name} has been successfully created.</p>
                <p className="text-gray-400">Redirecting to tournament management...</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentPage;
