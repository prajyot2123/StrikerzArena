import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Award } from 'lucide-react';

const Leaderboard = ({ leaderboard = [] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card border border-border"
    >
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Award className="w-6 h-6 text-gold" />
        Tournament Leaderboard
      </h2>

      {leaderboard.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={leaderboard}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="position" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              formatter={(value) => [`${value} wins`, 'Wins']}
            />
            <Bar dataKey="wins" fill="#2d5016" name="Wins" radius={[8, 8, 0, 0]} />
            <Bar dataKey="losses" fill="#666" name="Losses" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">No matches completed yet</p>
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 text-gray-400 text-sm">Position</th>
              <th className="text-left py-3 text-gray-400 text-sm">Wins</th>
              <th className="text-left py-3 text-gray-400 text-sm">Losses</th>
              <th className="text-left py-3 text-gray-400 text-sm">Ties</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((team, index) => (
              <motion.tr
                key={index}
                whileHover={{ backgroundColor: '#1a1a1a' }}
                className="border-b border-border"
              >
                <td className="py-3">
                  <span className="text-gold font-bold">#{team.position}</span>
                </td>
                <td className="py-3 text-green-500 font-semibold">{team.wins}</td>
                <td className="py-3 text-red-500 font-semibold">{team.losses}</td>
                <td className="py-3 text-yellow-500 font-semibold">{team.ties || 0}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default Leaderboard;
