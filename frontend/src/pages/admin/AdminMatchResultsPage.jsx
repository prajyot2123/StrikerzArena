import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { matchAPI, tournamentAPI } from '../../utils/api';
import Header from '../../components/Header';
import { Trophy, Save, CheckCircle, AlertCircle, ChevronLeft, Layout, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminMatchResultsPage = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [scoreForm, setScoreForm] = useState({
        matchId: null,
        homeTeamScore: 0,
        homeTeamWickets: 0,
        awayTeamScore: 0,
        awayTeamWickets: 0,
        result: 'HOME_WIN',
    });

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await tournamentAPI.getAllTournaments();
                const liveTournaments = (res.data.tournaments || []).filter(t => t.status === 'LIVE' || t.status === 'COMPLETED');
                setTournaments(liveTournaments);
                if (liveTournaments.length > 0) setSelectedTournament(liveTournaments[0]);
            } catch (err) {
                setError('Failed to load tournaments');
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    useEffect(() => {
        if (!selectedTournament) return;
        const fetchMatches = async () => {
            try {
                const res = await matchAPI.getTournamentMatches(selectedTournament._id);
                const scheduledMatches = (res.data.matches || []).filter(m => m.status === 'SCHEDULED' || m.status === 'LIVE' || m.status === 'COMPLETED');
                setMatches(scheduledMatches);
            } catch (err) {
                console.error('Error fetching matches:', err);
            }
        };
        fetchMatches();
    }, [selectedTournament]);

    const handleUpdateScore = async (e) => {
        e.preventDefault();
        if (!scoreForm.matchId) return;

        setSubmitting(true);
        try {
            await matchAPI.updateScore(scoreForm.matchId, {
                homeTeamScore: Number(scoreForm.homeTeamScore),
                homeTeamWickets: Number(scoreForm.homeTeamWickets),
                awayTeamScore: Number(scoreForm.awayTeamScore),
                awayTeamWickets: Number(scoreForm.awayTeamWickets),
                result: scoreForm.result
            });
            setMessage('✅ Match result recorded. Standings updated.');
            setScoreForm({ matchId: null, homeTeamScore: 0, homeTeamWickets: 0, awayTeamScore: 0, awayTeamWickets: 0, result: 'HOME_WIN' });
            // Refresh matches
            const res = await matchAPI.getTournamentMatches(selectedTournament._id);
            setMatches(res.data.matches || []);
        } catch (err) {
            setError('Failed to update match score');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="min-h-screen bg-dark-bg">
            <Header />
            <div className="py-12 px-4 container mx-auto">
                <div className="flex items-center gap-4 mb-10">
                    <button onClick={() => navigate('/admin-dashboard')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gold transition-all">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                            <Trophy className="w-10 h-10 text-gold" /> Record Match Results
                        </h1>
                        <p className="text-gray-400">Update scores for scheduled and live matches</p>
                    </div>
                </div>

                {(message || error) && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl mb-8 flex items-center gap-3 border shadow-lg ${message ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-red-900/20 border-red-500/50 text-red-400'}`}>
                        {message ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message || error}
                    </motion.div>
                )}

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Tournament Selection */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest px-2">Select Tournament</h2>
                        {tournaments.map(t => (
                            <button
                                key={t._id}
                                onClick={() => setSelectedTournament(t)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedTournament?._id === t._id ? 'border-gold bg-gold/10 text-gold' : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20'
                                    }`}
                            >
                                <p className="font-bold">{t.name}</p>
                                <span className="text-[10px] font-black uppercase opacity-60">{t.status}</span>
                            </button>
                        ))}
                    </div>

                    {/* Match List & Score Form */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest px-2">Recent & Live Matches</h2>
                                <div className="space-y-3">
                                    {matches.filter(m => m.status !== 'DRAFT').slice().reverse().map(match => (
                                        <div
                                            key={match._id}
                                            onClick={() => match.status !== 'COMPLETED' && setScoreForm({ ...scoreForm, matchId: match._id })}
                                            className={`p-5 rounded-3xl border transition-all cursor-pointer ${scoreForm.matchId === match._id ? 'border-gold bg-gold/5' : 'border-white/5 bg-card-bg/30 hover:border-gold/30'
                                                } ${match.status === 'COMPLETED' ? 'opacity-60 grayscale' : ''}`}
                                        >
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gold/60">Match {match.matchNumber}</span>
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${match.status === 'LIVE' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-gray-400'}`}>
                                                    {match.status}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center px-2">
                                                <div className="text-center flex-1">
                                                    <p className="text-white font-black text-lg">{match.homeTeamId?.shortName}</p>
                                                    <p className="text-gold font-mono text-xl">{match.status === 'COMPLETED' ? match.homeTeamScore : '-'}</p>
                                                </div>
                                                <div className="text-white/20 font-black italic mx-4">VS</div>
                                                <div className="text-center flex-1">
                                                    <p className="text-white font-black text-lg">{match.awayTeamId?.shortName}</p>
                                                    <p className="text-gold font-mono text-xl">{match.status === 'COMPLETED' ? match.awayTeamScore : '-'}</p>
                                                </div>
                                            </div>
                                            {match.status === 'COMPLETED' && (
                                                <div className="mt-4 pt-3 border-t border-white/5 text-center text-[10px] font-black uppercase text-green-400">
                                                    Winner: {match.result === 'HOME_WIN' ? match.homeTeamId?.name : match.awayTeamId?.name}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {matches.length === 0 && <p className="text-gray-500 italic p-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">No matches found for this tournament.</p>}
                                </div>
                            </div>

                            {/* Form */}
                            <div className="card border border-gold/50 bg-gradient-to-br from-card-bg to-dark-bg p-8 sticky top-24 h-fit">
                                {!scoreForm.matchId ? (
                                    <div className="text-center py-12">
                                        <Layout className="w-12 h-12 text-gold/20 mx-auto mb-4" />
                                        <p className="text-gray-400">Select a scheduled or live match to record scores</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleUpdateScore} className="space-y-6">
                                        <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-gold" /> Update Match {matches.find(m => m._id === scoreForm.matchId)?.matchNumber}
                                        </h3>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <p className="text-xs font-black text-gold uppercase tracking-[.2em]">{matches.find(m => m._id === scoreForm.matchId)?.homeTeamId?.shortName}</p>
                                                <input type="number" placeholder="Score" className="input-field" value={scoreForm.homeTeamScore} onChange={(e) => setScoreForm({ ...scoreForm, homeTeamScore: e.target.value })} />
                                                <input type="number" placeholder="Wickets" className="input-field" value={scoreForm.homeTeamWickets} onChange={(e) => setScoreForm({ ...scoreForm, homeTeamWickets: e.target.value })} />
                                            </div>
                                            <div className="space-y-4">
                                                <p className="text-xs font-black text-gold uppercase tracking-[.2em]">{matches.find(m => m._id === scoreForm.matchId)?.awayTeamId?.shortName}</p>
                                                <input type="number" placeholder="Score" className="input-field" value={scoreForm.awayTeamScore} onChange={(e) => setScoreForm({ ...scoreForm, awayTeamScore: e.target.value })} />
                                                <input type="number" placeholder="Wickets" className="input-field" value={scoreForm.awayTeamWickets} onChange={(e) => setScoreForm({ ...scoreForm, awayTeamWickets: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-4">
                                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Select Winner</p>
                                            <select className="input-field" value={scoreForm.result} onChange={(e) => setScoreForm({ ...scoreForm, result: e.target.value })}>
                                                <option value="HOME_WIN">{matches.find(m => m._id === scoreForm.matchId)?.homeTeamId?.name} Wins</option>
                                                <option value="AWAY_WIN">{matches.find(m => m._id === scoreForm.matchId)?.awayTeamId?.name} Wins</option>
                                                <option value="TIE">Match Tied</option>
                                                <option value="NO_RESULT">No Result / Abandoned</option>
                                            </select>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            disabled={submitting}
                                            className="w-full btn-primary py-4 flex items-center justify-center gap-2 font-black"
                                        >
                                            <Save className="w-5 h-5" /> {submitting ? 'Finalizing...' : 'Finalize Result'}
                                        </motion.button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMatchResultsPage;
