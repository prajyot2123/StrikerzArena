import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, Target } from 'lucide-react';

const AuctionBidCard = ({ player, team, currentBid, onBid }) => {
  const [bidAmount, setBidAmount] = React.useState(currentBid + 1000);

  const handleBid = () => {
    if (bidAmount <= team.remainingPurse && bidAmount > currentBid) {
      onBid(bidAmount);
    }
  };

  const canBid = bidAmount <= team.remainingPurse && bidAmount > currentBid;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card border-2 border-gold bg-gradient-to-br from-card-bg to-dark-bg"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">{player.fullName}</h3>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-400">
            <Target className="w-4 h-4 inline mr-1" />
            {player.role}
          </span>
          <span className="text-gray-400">
            <Users className="w-4 h-4 inline mr-1" />
            {player.yearsOfExperience} years
          </span>
        </div>
      </div>

      <div className="mb-6 p-4 bg-dark-bg border border-border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400">Current Bid</span>
          <span className="text-gold text-2xl font-bold">₹{currentBid.toLocaleString()}</span>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400">Your Purse</span>
          <span className={team.remainingPurse < 100000 ? 'text-red-500' : 'text-green-500'}>
            ₹{team.remainingPurse.toLocaleString()}
          </span>
        </div>

        {team.remainingPurse < 100000 && (
          <div className="text-xs text-yellow-500 mb-4">
            ⚠️ Low purse remaining
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="text-gray-400 text-sm block mb-2">Your Bid Amount</label>
        <div className="flex items-center gap-2">
          <span className="text-gold font-semibold">₹</span>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
            min={currentBid + 1000}
            max={team.remainingPurse}
            className="input-field"
          />
        </div>
        {bidAmount > team.remainingPurse && (
          <p className="text-red-500 text-xs mt-2">Exceeds your purse</p>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleBid}
        disabled={!canBid}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <DollarSign className="w-4 h-4 inline mr-2" />
        Bid ₹{bidAmount.toLocaleString()}
      </motion.button>
    </motion.div>
  );
};

export default AuctionBidCard;
