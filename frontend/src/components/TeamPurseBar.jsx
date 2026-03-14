import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Target, Users } from 'lucide-react';

const TeamPurseBar = ({ team }) => {
  const usagePercentage = (team.usedPurse / team.totalPurse) * 100;
  const healthColor =
    usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 50 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-gold" />
          {team.name}
        </h3>
        <span className="text-gold font-semibold">{team.players?.length || 0}/11 Players</span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Purse Used</span>
          <span>₹{team.usedPurse?.toLocaleString()}</span>
        </div>
        <div className="w-full bg-dark-bg rounded-full h-3 border border-border overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full ${healthColor} rounded-full`}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>₹0</span>
          <span>₹{team.totalPurse?.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-gray-400 text-xs">Remaining Purse</p>
          <p className="text-gold text-lg font-semibold">₹{team.remainingPurse?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Slots Available</p>
          <p className="text-grass-green text-lg font-semibold">{11 - (team.players?.length || 0)}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default TeamPurseBar;
