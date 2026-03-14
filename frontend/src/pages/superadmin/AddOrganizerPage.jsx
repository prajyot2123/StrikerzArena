import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { ChevronLeft, UserPlus, AlertCircle } from 'lucide-react';
import { userAPI } from '../../utils/api';

const AddOrganizerPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    organization: '',
    contact: '',
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
      // Create organizer account via API
      await userAPI.createOrganizer(formData.email, formData.fullName);
      setSubmitted(true);
      setTimeout(() => {
        navigate('/superadmin/users');
      }, 2000);
    } catch (error) {
      console.error('Failed to create organizer:', error);
      alert('Error creating organizer. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />

      <div className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => navigate('/superadmin-dashboard')}
              className="p-2 hover:bg-gold/10 rounded-lg transition"
            >
              <ChevronLeft className="w-6 h-6 text-gold" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Add New Organizer</h1>
              <p className="text-gray-400">Create a new organizer account</p>
            </div>
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-gold/30 p-8"
          >
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="text-gold/90 text-sm font-bold mb-2 block tracking-wider uppercase">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-gold/30 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all font-medium"
                      placeholder="Enter organizer's full name"
                    />
                  </div>

                  <div>
                    <label className="text-gold/90 text-sm font-bold mb-2 block tracking-wider uppercase">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-gold/30 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all font-medium"
                      placeholder="organizer@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-gold/90 text-sm font-bold mb-2 block tracking-wider uppercase">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-gold/30 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all font-medium"
                      placeholder="Create a secure password"
                    />
                  </div>

                  <div>
                    <label className="text-gold/90 text-sm font-bold mb-2 block tracking-wider uppercase">Organization Name</label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-950 border border-gold/30 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all font-medium"
                      placeholder="Legal entity or Club name"
                    />
                  </div>

                  <div>
                    <label className="text-gold/90 text-sm font-bold mb-2 block tracking-wider uppercase">Primary Contact</label>
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-950 border border-gold/30 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all font-medium"
                      placeholder="+91 00000 00000"
                    />
                  </div>

                  <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gold font-semibold text-sm mb-1">Note</p>
                      <p className="text-gray-400 text-sm">The organizer will be able to create and manage tournaments after approval.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gold text-dark-bg font-bold rounded-lg hover:bg-gold/90 transition flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      Create Organizer
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => navigate('/superadmin-dashboard')}
                      className="flex-1 px-6 py-3 bg-gold/20 border border-gold/50 text-gold font-bold rounded-lg hover:bg-gold/30 transition"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-500/20 border border-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Organizer Created Successfully!</h2>
                <p className="text-gray-400 mb-6">The new organizer account has been created and is pending approval.</p>
                <p className="text-gray-400">Redirecting to user management...</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AddOrganizerPage;
