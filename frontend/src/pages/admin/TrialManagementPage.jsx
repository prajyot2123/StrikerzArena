import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { tournamentAPI, playerAPI } from '../../utils/api';
import {
    ClipboardList, Trophy, Users, CheckCircle, AlertCircle,
    UserCheck, UserX, Clock, ChevronRight, Zap
} from 'lucide-react';

// ─── Status badge helper ───────────────────────────────────────────────────
const AttendanceBadge = ({ status }) => {
    const cfg = {
        PRESENT: { cls: 'bg-green-500/20 border-green-500/40 text-green-400', icon: '✅', label: 'Present' },
        ABSENT: { cls: 'bg-red-500/20 border-red-500/40 text-red-400', icon: '❌', label: 'Absent' },
        PENDING: { cls: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400', icon: '⏳', label: 'Pending' },
    };
    const { cls, icon, label } = cfg[status] || cfg.PENDING;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cls}`}>
            {icon} {label}
        </span>
    );
};

const TrialManagementPage = () => {
    const navigate = useNavigate();

    // ── state ──────────────────────────────────────────────────────────────
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);

    // Phase 1: Attendance
    const [attendance, setAttendance] = useState([]);  // [{ playerId, player, status, markedAt }]
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [markingId, setMarkingId] = useState(null); // playerId currently being marked

    // Phase 2: Evaluation (only PRESENT players)
    const [trials, setTrials] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [trialForm, setTrialForm] = useState({
        battingSkill: 50, bowlingSkill: 50, fieldingSkill: 50,
        fitness: 50, matchAwareness: 50, notes: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // UI
    const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'evaluation' | 'results'
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // ── derived lists ───────────────────────────────────────────────────────
    const presentPlayers = attendance.filter(a => a.status === 'PRESENT');
    const absentPlayers = attendance.filter(a => a.status === 'ABSENT');
    const pendingPlayers = attendance.filter(a => a.status === 'PENDING');

    const evaluatedIds = new Set(trials.map(t => t.playerId?._id?.toString() || t.playerId?.toString()));
    const pendingEval = presentPlayers.filter(a => !evaluatedIds.has(a.playerId?.toString()));
    const doneEval = presentPlayers.filter(a => evaluatedIds.has(a.playerId?.toString()));

    // ── fetch helpers ───────────────────────────────────────────────────────
    const refreshAttendance = useCallback(async (tournamentId) => {
        setAttendanceLoading(true);
        try {
            const res = await tournamentAPI.getAttendance(tournamentId);
            setAttendance(res.data.attendance || []);
        } catch (e) {
            console.error('Error fetching attendance:', e);
        } finally {
            setAttendanceLoading(false);
        }
    }, []);

    const refreshTrials = useCallback(async (tournamentId) => {
        try {
            const res = await tournamentAPI.getTournamentTrials(tournamentId);
            setTrials(res.data.trials || []);
        } catch (e) {
            console.error('Error fetching trials:', e);
        }
    }, []);

    // ── initial load ────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await tournamentAPI.getAllTournaments();
                const all = res.data.tournaments || [];
                setTournaments(all);
                if (all.length > 0) setSelectedTournament(all[0]);
            } catch {
                setError('Failed to load tournaments');
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    useEffect(() => {
        if (!selectedTournament) return;
        setSelectedPlayer(null);
        setMessage('');
        setError('');
        refreshAttendance(selectedTournament._id);
        refreshTrials(selectedTournament._id);
    }, [selectedTournament, refreshAttendance, refreshTrials]);

    // ── attendance marking ──────────────────────────────────────────────────
    const handleMarkAttendance = async (playerId, status) => {
        setMarkingId(playerId);
        setError('');
        setMessage('');
        try {
            await tournamentAPI.markAttendance(selectedTournament._id, playerId, status);
            // Optimistic UI update
            setAttendance(prev => prev.map(a =>
                a.playerId?.toString() === playerId.toString()
                    ? { ...a, status, markedAt: new Date().toISOString() }
                    : a
            ));
            const playerName = attendance.find(a => a.playerId?.toString() === playerId.toString())?.player?.fullName;
            setMessage(`✅ ${playerName || 'Player'} marked as ${status}`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setMarkingId(null);
        }
    };

    // ── trial recording ─────────────────────────────────────────────────────
    const handleRecordTrial = async (e) => {
        e.preventDefault();
        if (!selectedPlayer || !selectedTournament) return;
        setSubmitting(true);
        setError('');
        setMessage('');
        try {
            await tournamentAPI.recordTrial({
                playerId: selectedPlayer._id,
                tournamentId: selectedTournament._id,
                battingSkill: Number(trialForm.battingSkill),
                bowlingSkill: Number(trialForm.bowlingSkill),
                fieldingSkill: Number(trialForm.fieldingSkill),
                fitness: Number(trialForm.fitness),
                matchAwareness: Number(trialForm.matchAwareness),
                notes: trialForm.notes,
            });
            setMessage(`✅ Trial recorded for ${selectedPlayer.fullName}! ML classification complete.`);
            setSelectedPlayer(null);
            setTrialForm({ battingSkill: 50, bowlingSkill: 50, fieldingSkill: 50, fitness: 50, matchAwareness: 50, notes: '' });
            await refreshTrials(selectedTournament._id);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to record trial');
        } finally {
            setSubmitting(false);
        }
    };

    // ── sub-components ───────────────────────────────────────────────────────
    const ScoreSlider = ({ label, field, value }) => (
        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <label className="text-gray-400 text-sm">{label}</label>
                <span className="text-gold font-bold">{value}/100</span>
            </div>
            <input type="range" min="0" max="100" value={value}
                onChange={e => setTrialForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full accent-yellow-400"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Poor (0)</span><span>Average (50)</span><span>Excellent (100)</span>
            </div>
        </div>
    );

    // ── render helpers ───────────────────────────────────────────────────────
    const AttendanceRow = ({ entry }) => {
        const { playerId, player, status } = entry;
        const pid = playerId?.toString();
        const busy = markingId === pid;
        return (
            <div className={`flex items-center justify-between px-4 py-3 rounded-lg border transition ${status === 'PRESENT' ? 'border-green-500/30 bg-green-900/5' :
                status === 'ABSENT' ? 'border-red-500/20 bg-red-900/5' :
                    'border-border'
                }`}>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{player?.fullName || '—'}</p>
                    <p className="text-xs text-gray-400">{player?.role} • {player?.yearsOfExperience}yrs</p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                    <AttendanceBadge status={status} />
                    {status !== 'PRESENT' && (
                        <button
                            onClick={() => handleMarkAttendance(pid, 'PRESENT')}
                            disabled={busy}
                            className="text-xs px-2 py-1 rounded border border-green-500/40 text-green-400 hover:bg-green-500/10 disabled:opacity-40 transition"
                        >
                            {busy ? '…' : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    {status !== 'ABSENT' && (
                        <button
                            onClick={() => handleMarkAttendance(pid, 'ABSENT')}
                            disabled={busy}
                            className="text-xs px-2 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition"
                        >
                            {busy ? '…' : <UserX className="w-3.5 h-3.5" />}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // ── loading state ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg">
                <Header />
                <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}
                        className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            <Header />

            <div className="py-10">
                <div className="container mx-auto px-4">

                    {/* Page Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                            <ClipboardList className="w-10 h-10 text-gold" />
                            Admin — Trial Management
                        </h1>
                        <p className="text-gray-400 text-lg">Mark attendance, then record trial data for present players.</p>
                    </motion.div>

                    {/* Alerts */}
                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
                            </motion.div>
                        )}
                        {message && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />{message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Nav tabs */}
                    <div className="flex gap-3 mb-8 flex-wrap">
                        {[
                            { key: 'attendance', label: 'Attendance', icon: <Users className="w-4 h-4" />, count: attendance.length },
                            { key: 'evaluation', label: 'Evaluation', icon: <Zap className="w-4 h-4" />, count: pendingEval.length },
                            { key: 'results', label: 'Trial Results', icon: <Trophy className="w-4 h-4" />, count: trials.length },
                            { key: 'match', label: 'Match Results', icon: <Trophy className="w-4 h-4" />, count: null, navigate: '/admin/match-results' },
                        ].map(tab => (
                            <motion.button key={tab.key}
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                onClick={() => tab.navigate ? navigate(tab.navigate) : setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border ${activeTab === tab.key && !tab.navigate
                                    ? 'bg-gold text-dark-bg border-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-gold/30 hover:text-white'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                                {tab.count !== null && tab.count > 0 && (
                                    <span className="ml-1 text-xs bg-gold/20 text-gold rounded-full px-2 py-0.5">{tab.count}</span>
                                )}
                            </motion.button>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-4 gap-8">

                        {/* Left sidebar: Tournament Selector */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card border border-gold/30 lg:col-span-1 self-start">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-gold" /> Tournament
                            </h2>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {tournaments.map(t => (
                                    <button key={t._id}
                                        onClick={() => { setSelectedTournament(t); setActiveTab('attendance'); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition text-sm ${selectedTournament?._id === t._id
                                            ? 'border-gold bg-gold/10 text-gold'
                                            : 'border-border text-gray-300 hover:border-gold/50'
                                            }`}
                                    >
                                        <p className="font-semibold truncate">{t.name}</p>
                                        <p className="text-xs text-gray-400">{t.status} • {t.registeredPlayers?.length || 0} registered</p>
                                    </button>
                                ))}
                                {tournaments.length === 0 && <p className="text-gray-400 text-sm">No tournaments</p>}
                            </div>

                            {/* Attendance summary */}
                            {selectedTournament && attendance.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-gold/10 space-y-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Attendance</p>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-400">✅ Present</span>
                                        <span className="font-bold text-green-400">{presentPlayers.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-400">❌ Absent</span>
                                        <span className="font-bold text-red-400">{absentPlayers.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-yellow-400">⏳ Pending</span>
                                        <span className="font-bold text-yellow-400">{pendingPlayers.length}</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Right content area */}
                        <div className="lg:col-span-3">

                            {/* ── ATTENDANCE TAB ─────────────────────────────────── */}
                            {activeTab === 'attendance' && (
                                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className="card border border-gold/30">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                                <Users className="w-5 h-5 text-gold" />
                                                Mark Trial Attendance
                                                {selectedTournament && (
                                                    <span className="text-sm font-normal text-gray-400 ml-2">— {selectedTournament.name}</span>
                                                )}
                                            </h2>
                                            {selectedTournament && (
                                                <button
                                                    onClick={() => setActiveTab('evaluation')}
                                                    disabled={presentPlayers.length === 0}
                                                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gold/40 text-gold hover:bg-gold/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                >
                                                    Proceed to Evaluation <ChevronRight className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {!selectedTournament ? (
                                            <p className="text-gray-400">Select a tournament first.</p>
                                        ) : attendanceLoading ? (
                                            <div className="flex justify-center py-10">
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full"
                                                />
                                            </div>
                                        ) : attendance.length === 0 ? (
                                            <div className="text-center py-10">
                                                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                                <p className="text-gray-400">No players registered yet.</p>
                                                <p className="text-gray-500 text-sm mt-1">Players register themselves via the Tournaments page.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-xs text-gray-500 mb-4">
                                                    Use the <span className="text-green-400">✓</span> / <span className="text-red-400">✗</span> buttons to mark each player's physical trial attendance. Only PRESENT players can be evaluated.
                                                </p>
                                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                                    {/* Pending first */}
                                                    {pendingPlayers.length > 0 && (
                                                        <>
                                                            <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wide mb-1">⏳ Not Yet Marked</p>
                                                            {pendingPlayers.map(e => <AttendanceRow key={e.playerId} entry={e} />)}
                                                            <div className="mt-3 mb-1" />
                                                        </>
                                                    )}
                                                    {/* Present */}
                                                    {presentPlayers.length > 0 && (
                                                        <>
                                                            <p className="text-xs text-green-400 font-semibold uppercase tracking-wide mb-1">✅ Present</p>
                                                            {presentPlayers.map(e => <AttendanceRow key={e.playerId} entry={e} />)}
                                                            <div className="mt-3 mb-1" />
                                                        </>
                                                    )}
                                                    {/* Absent */}
                                                    {absentPlayers.length > 0 && (
                                                        <>
                                                            <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-1">❌ Absent</p>
                                                            {absentPlayers.map(e => <AttendanceRow key={e.playerId} entry={e} />)}
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── EVALUATION TAB ────────────────────────────────── */}
                            {activeTab === 'evaluation' && (
                                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-6">

                                    {/* Player list (PRESENT only) */}
                                    <div className="card border border-gold/30">
                                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                            <UserCheck className="w-5 h-5 text-gold" />
                                            Present Players
                                            <span className="text-sm text-gray-400 ml-auto font-normal">
                                                {pendingEval.length} pending / {doneEval.length} done
                                            </span>
                                        </h2>

                                        {presentPlayers.length === 0 ? (
                                            <div className="text-center py-10">
                                                <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                                <p className="text-gray-400 text-sm">No players marked PRESENT yet.</p>
                                                <button onClick={() => setActiveTab('attendance')}
                                                    className="mt-3 text-sm text-gold hover:underline">
                                                    ← Go back to Attendance
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                                                {pendingEval.length > 0 && (
                                                    <>
                                                        <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wide mb-1">⏳ Awaiting Evaluation</p>
                                                        {pendingEval.map(({ playerId, player }) => (
                                                            <button key={playerId}
                                                                onClick={() => { setSelectedPlayer({ _id: playerId, ...player }); setMessage(''); setError(''); }}
                                                                className={`w-full text-left px-4 py-3 rounded-lg border transition ${selectedPlayer?._id?.toString() === playerId?.toString()
                                                                    ? 'border-gold bg-gold/10 text-gold'
                                                                    : 'border-border text-gray-300 hover:border-gold/50'
                                                                    }`}
                                                            >
                                                                <p className="font-semibold">{player?.fullName}</p>
                                                                <p className="text-xs text-gray-400">{player?.role} • {player?.yearsOfExperience}yrs</p>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                                {doneEval.length > 0 && (
                                                    <>
                                                        <p className="text-xs text-green-400 font-semibold uppercase tracking-wide mt-4 mb-1">✅ Evaluated</p>
                                                        {doneEval.map(({ playerId, player }) => {
                                                            const trial = trials.find(t => (t.playerId?._id || t.playerId)?.toString() === playerId?.toString());
                                                            return (
                                                                <div key={playerId} className="px-4 py-3 rounded-lg border border-green-500/20 bg-green-900/5 text-gray-400">
                                                                    <p className="font-semibold text-gray-300 text-sm">{player?.fullName}</p>
                                                                    <p className="text-xs">{trial?.category || 'N/A'} • Score: {Math.round(trial?.finalScore || 0)}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Trial form */}
                                    <div className="card border border-gold/30">
                                        {!selectedPlayer ? (
                                            <div className="text-center py-12">
                                                <ClipboardList className="w-14 h-14 text-gold/30 mx-auto mb-4" />
                                                <p className="text-gray-400">Select a PRESENT player from the list to record their trial performance.</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleRecordTrial}>
                                                <div className="flex items-start justify-between mb-5">
                                                    <div>
                                                        <h2 className="text-xl font-bold text-white">Record Trial</h2>
                                                        <p className="text-gold text-sm">{selectedPlayer.fullName}</p>
                                                        <p className="text-gray-400 text-xs">{selectedPlayer.role} • {selectedPlayer.yearsOfExperience} yrs exp</p>
                                                    </div>
                                                    <button type="button" onClick={() => setSelectedPlayer(null)}
                                                        className="text-gray-400 hover:text-white text-xl leading-none">×</button>
                                                </div>

                                                <ScoreSlider label="Batting Skill" field="battingSkill" value={trialForm.battingSkill} />
                                                <ScoreSlider label="Bowling Skill" field="bowlingSkill" value={trialForm.bowlingSkill} />
                                                <ScoreSlider label="Fielding Skill" field="fieldingSkill" value={trialForm.fieldingSkill} />
                                                <ScoreSlider label="Fitness" field="fitness" value={trialForm.fitness} />
                                                <ScoreSlider label="Match Awareness" field="matchAwareness" value={trialForm.matchAwareness} />

                                                <div className="mb-4">
                                                    <label className="text-gray-400 text-sm block mb-1">Notes (optional)</label>
                                                    <textarea value={trialForm.notes}
                                                        onChange={e => setTrialForm(p => ({ ...p, notes: e.target.value }))}
                                                        className="input-field resize-none" rows={2}
                                                        placeholder="Observations…"
                                                    />
                                                </div>

                                                <div className="p-3 bg-gold/10 border border-gold/20 rounded-lg mb-4 text-xs text-gray-300">
                                                    🤖 Submission triggers AI-assisted classification based on evaluation metrics.
                                                </div>

                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                    type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
                                                    {submitting ? 'Processing ML Classification…' : '🚀 Submit Trial & Classify'}
                                                </motion.button>
                                            </form>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── RESULTS TAB ───────────────────────────────────── */}
                            {activeTab === 'results' && (
                                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card border border-gold/30">
                                    <h2 className="text-2xl font-bold text-white mb-6">Trial Results — {selectedTournament?.name}</h2>
                                    {trials.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                            <p className="text-gray-400">No trials recorded yet.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gold/30 text-left">
                                                        {['Player', 'Role', 'Bat', 'Bowl', 'Field', 'Fit', 'Aware', 'Score', 'Category', 'Base Price'].map(h => (
                                                            <th key={h} className="text-gold py-3 pb-4 pr-4">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {trials.map(trial => (
                                                        <tr key={trial._id} className="border-b border-border hover:bg-gold/5 transition">
                                                            <td className="py-3 text-white font-semibold pr-4">{trial.playerId?.fullName || 'N/A'}</td>
                                                            <td className="text-gray-400 pr-4">{trial.playerId?.role || '—'}</td>
                                                            <td className="text-white pr-3">{trial.battingSkill}</td>
                                                            <td className="text-white pr-3">{trial.bowlingSkill}</td>
                                                            <td className="text-white pr-3">{trial.fieldingSkill}</td>
                                                            <td className="text-white pr-3">{trial.fitness}</td>
                                                            <td className="text-white pr-3">{trial.matchAwareness}</td>
                                                            <td className="text-gold font-bold pr-3">{Math.round(trial.finalScore || 0)}</td>
                                                            <td className="pr-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${trial.category === 'Advanced' ? 'bg-gold/20 text-gold' :
                                                                    trial.category === 'Intermediate' ? 'bg-blue-500/20 text-blue-400' :
                                                                        'bg-green-500/20 text-green-400'
                                                                    }`}>{trial.category || 'N/A'}</span>
                                                            </td>
                                                            <td className="text-green-400 font-bold">₹{(trial.basePrice || 0).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrialManagementPage;
