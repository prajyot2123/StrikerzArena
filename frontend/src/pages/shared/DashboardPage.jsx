import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { playerAPI } from '../../utils/api';
import PlayerCard from '../../components/PlayerCard';

const DashboardPage = () => {
  const { user } = useAuth();
  const [playerProfile, setPlayerProfile] = useState(null);
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await playerAPI.getProfile();
        setPlayerProfile(data.player);

        // Fetch trials for this player
        if (data.player?._id) {
          const trialsRes = await playerAPI.getPlayerTrials(data.player._id);
          setTrials(trialsRes.data.trials || []);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'PLAYER') {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome, {user?.fullName}!
          </h1>
          <p className="text-gray-400">Role: {user?.role.replace('_', ' ')}</p>
        </motion.div>

        {user?.role === 'PLAYER' && playerProfile && (
          <>
            {/* Player Profile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card border-2 border-gold mb-12"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Your Profile</h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm">Full Name</p>
                      <p className="text-white font-semibold">{playerProfile.fullName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Age</p>
                      <p className="text-white font-semibold">{playerProfile.age} years</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Role</p>
                      <p className="text-gold font-semibold">{playerProfile.role}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm">Experience</p>
                      <p className="text-white font-semibold">
                        {playerProfile.yearsOfExperience} years
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Batting Style</p>
                      <p className="text-white font-semibold">{playerProfile.battingStyle}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Status</p>
                      <p className="text-grass-green font-semibold">{playerProfile.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Trial Results */}
            {trials.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                <h2 className="text-2xl font-bold text-white mb-6">Trial Results</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {trials.map((trial) => (
                    <motion.div
                      key={trial._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <PlayerCard player={playerProfile} trialData={trial} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {trials.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-gray-400 text-lg">No trial results yet</p>
              </motion.div>
            )}
          </>
        )}

        {user?.role !== 'PLAYER' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card border border-border text-center py-12"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Admin Dashboard</h2>
            <p className="text-gray-400 mb-6">
              Access tournament management and player evaluation tools
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary"
            >
              Go to Admin Panel
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
