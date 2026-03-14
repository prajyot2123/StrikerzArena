import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award } from 'lucide-react';

const PlayerCard = ({ player, trialData }) => {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Beginner':
        return 'bg-blue-900 border-blue-500';
      case 'Intermediate':
        return 'bg-yellow-900 border-yellow-500';
      case 'Advanced':
        return 'bg-green-900 border-green-500';
      default:
        return 'bg-gray-900 border-gray-500';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 0 20px rgba(212,175,55,0.3)' }}
      className={`card border-2 ${getCategoryColor(trialData?.category)}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{player.fullName}</h3>
          <p className="text-gray-400 text-sm">{player.role}</p>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'loop' }}
        >
          <Award className="w-6 h-6 text-gold" />
        </motion.div>
      </div>

      {trialData && (
        <>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Performance Score</span>
              <span className="text-gold font-bold">{trialData.finalScore?.toFixed(1)}</span>
            </div>
            <div className="w-full bg-dark-bg rounded-full h-2 border border-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${trialData.finalScore}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-grass-green to-gold rounded-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="bg-dark-bg p-2 rounded border border-border">
              <p className="text-gray-500">Batting</p>
              <p className="text-gold font-semibold">{trialData.battingSkill}</p>
            </div>
            <div className="bg-dark-bg p-2 rounded border border-border">
              <p className="text-gray-500">Bowling</p>
              <p className="text-gold font-semibold">{trialData.bowlingSkill}</p>
            </div>
            <div className="bg-dark-bg p-2 rounded border border-border">
              <p className="text-gray-500">Fielding</p>
              <p className="text-gold font-semibold">{trialData.fieldingSkill}</p>
            </div>
            <div className="bg-dark-bg p-2 rounded border border-border">
              <p className="text-gray-500">Fitness</p>
              <p className="text-gold font-semibold">{trialData.fitness}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-grass-green font-semibold text-lg">
              {trialData.category}
            </span>
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {(trialData.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default PlayerCard;
