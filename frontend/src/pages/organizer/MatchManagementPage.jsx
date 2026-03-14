import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { matchAPI, tournamentAPI } from '../../utils/api';
import Header from '../../components/Header';
import { Calendar, MapPin, Trophy, Clock, CheckCircle, AlertCircle, Save, Settings, Play } from 'lucide-react';

const MatchManagementPage = () => {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingMatch, setEditingMatch] = useState(null);
    const [editData, setEditData] = useState({ venue: '', scheduledDate: '' });
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tournRes, matchesRes] = await Promise.all([
                tournamentAPI.getDetails(tournamentId),
                matchAPI.getTournamentMatches(tournamentId)
            ]);
            setTournament(tournRes.data.tournament);
            setMatches(matchesRes.data.matches);
        } catch (err) {
            console.error('Error fetching data:', err);
            setMessage({ type: 'error', text: 'Failed to load tournament data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tournamentId]);

    const handleGenerateFixtures = async () => {
        try {
            setLoading(true);
            await matchAPI.generateFixtures(tournamentId);
            setMessage({ type: 'success', text: 'Fixtures generated successfully!' });
            await fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Fixture generation failed' });
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (match) => {
        setEditingMatch(match._id);
        setEditData({
            venue: match.venue || 'TBD',
            scheduledDate: match.scheduledDate ? new Date(match.scheduledDate).toISOString().slice(0, 16) : ''
        });
    };

    const handleScheduleUpdate = async (matchId) => {
        try {
            await matchAPI.scheduleMatch(matchId, {
                venue: editData.venue,
                scheduledDate: editData.scheduledDate
            });
            setMessage({ type: 'success', text: 'Match scheduled successfully' });
            setEditingMatch(null);
            await fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update schedule' });
        }
    };

    const handleCompleteTournament = async () => {
        try {
            setLoading(true);

            // First, fetch the leaderboard to determine the winner
            const lbRes = await matchAPI.getLeaderboard(tournamentId);
            const leader = lbRes.data.leaderboard?.[0]?.teamId;

            await tournamentAPI.updateStatus(tournamentId, "COMPLETED", leader);
            setMessage({ type: 'success', text: 'Tournament completed successfully! History preserved.' });
            await fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to complete tournament' });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !tournament) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            <Header />
            <div className="py-12 px-4 container mx-auto max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">{tournament?.name}</h1>
                        <p className="text-gray-400">Match Scheduling & Fixture Management</p>
                    </div>
                    {matches.length === 0 && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGenerateFixtures}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Settings className="w-5 h-5" />
                            Generate Fixtures
                        </motion.button>
                    )}
                </div>

                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl mb-6 shadow-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-red-900/20 border-red-500/50 text-red-400'
                            }`}
                    >
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </motion.div>
                )}

                <div className="grid gap-6">
                    {matches.map((match) => (
                        <motion.div
                            key={match._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="card border border-white/5 bg-card-bg/30 p-6 flex flex-col lg:flex-row justify-between items-center gap-6"
                        >
                            <div className="flex-1 flex items-center justify-center gap-8 w-full md:w-auto">
                                <div className="text-center w-32">
                                    <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-white/10">
                                        {match.homeTeamId?.logo ? <img src={match.homeTeamId.logo} className="w-10 h-10 object-contain" /> : <Trophy className="w-8 h-8 text-gold" />}
                                    </div>
                                    <p className="text-white font-bold truncate">{match.homeTeamId?.shortName}</p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="px-4 py-1 bg-gold/10 border border-gold/30 rounded-full text-gold text-xs font-black uppercase tracking-widest mb-2">
                                        Match {match.matchNumber}
                                    </div>
                                    <div className="text-4xl font-black text-white italic opacity-20">VS</div>
                                </div>

                                <div className="text-center w-32">
                                    <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-white/10">
                                        {match.awayTeamId?.logo ? <img src={match.awayTeamId.logo} className="w-10 h-10 object-contain" /> : <Trophy className="w-8 h-8 text-gold" />}
                                    </div>
                                    <p className="text-white font-bold truncate">{match.awayTeamId?.shortName}</p>
                                </div>
                            </div>

                            <div className="flex-1 w-full lg:max-w-md">
                                {editingMatch === match._id ? (
                                    <div className="space-y-4 bg-dark-bg/50 p-4 rounded-xl border border-white/10">
                                        <div>
                                            <label className="block text-[10px] text-gray-500 font-black uppercase mb-1">Venue</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    className="bg-white/5 border border-white/10 rounded-lg w-full py-2 pl-10 pr-4 text-white focus:border-gold outline-none transition-all"
                                                    value={editData.venue}
                                                    onChange={(e) => setEditData({ ...editData, venue: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 font-black uppercase mb-1">Date & Time</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    type="datetime-local"
                                                    className="bg-white/5 border border-white/10 rounded-lg w-full py-2 pl-10 pr-4 text-white focus:border-gold outline-none transition-all"
                                                    value={editData.scheduledDate}
                                                    onChange={(e) => setEditData({ ...editData, scheduledDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleScheduleUpdate(match._id)} className="btn-primary py-2 px-4 text-sm flex-1 flex items-center justify-center gap-2">
                                                <Save className="w-4 h-4" /> Save Schedule
                                            </button>
                                            <button onClick={() => setEditingMatch(null)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                                <MapPin className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Venue</p>
                                                <p className="text-white font-bold text-sm">{match.venue}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                                <Calendar className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Schedule</p>
                                                <p className="text-white font-bold text-sm">
                                                    {match.scheduledDate ? new Date(match.scheduledDate).toLocaleDateString() : 'TBD'}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => startEditing(match)} className="col-span-2 btn-secondary py-2 flex items-center justify-center gap-2 hover:border-gold/50">
                                            <Clock className="w-4 h-4" /> Configure Match
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {matches.length === 0 && (
                        <div className="text-center py-20 bg-card-bg/20 rounded-3xl border-2 border-dashed border-white/10">
                            <Calendar className="w-16 h-16 text-white/10 mx-auto mb-4" />
                            <h3 className="text-white font-bold text-xl">No Fixtures Generated</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mt-2">Finish the auction first, or manually generate fixtures to begin scheduling.</p>
                        </div>
                    )}
                </div>

                {/* Finalize Tournament - Only if status is LIVE and matches are done */}
                {tournament?.status === 'LIVE' && matches.length > 0 && matches.every(m => m.status === 'COMPLETED') && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-gold/20 to-indigo-900/20 border border-gold/50 text-center"
                    >
                        <Trophy className="w-16 h-16 text-gold mx-auto mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                        <h2 className="text-3xl font-black text-white italic mb-2">Finalize Season</h2>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            All matches have been completed. Finalizing the tournament will archive standings, update player histories, and crown the winner.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            {/* We could fetch leaderboard here to show winner, but let's keep it simple and just have the button */}
                            <button
                                onClick={() => {
                                    const winner = confirm("Are you sure you want to finalize this tournament? This will move it to history.");
                                    if (winner) handleCompleteTournament();
                                }}
                                className="btn-primary px-10 py-4 font-black flex items-center gap-3"
                            >
                                <CheckCircle className="w-6 h-6" /> Finalize & Archive
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MatchManagementPage;
