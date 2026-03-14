import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { ChevronLeft, Gavel, TrendingUp, Users, Zap, Play, Pause, SkipForward, Check, X as XIcon, Eye } from 'lucide-react';
import { auctionAPI } from '../../utils/api';
import useAuctionSocket from '../../hooks/useAuctionSocket';
import { useAuth } from '../../hooks/useAuth';

const LiveAuctionPage = () => {
  const navigate = useNavigate();
  const { auctionId } = useParams();
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const userId = user?.id;

  const {
    connected,
    auctionState,
    currentPlayer,
    recentBids,
    error,
    bidError,
    biddingTimer,
    highestBid,
    teamPurses,
    placeBid,
    nextPlayer: wsNextPlayer,
    soldPlayer: wsSoldPlayer,
    unBidPlayer: wsUnsoldPlayer,
  } = useAuctionSocket(auctionId, token);

  const [myTeam, setMyTeam] = useState(null);
  const [currentBidAmount, setCurrentBidAmount] = useState('');
  const [localBidError, setLocalBidError] = useState('');
  const [biddingLoading, setBiddingLoading] = useState(false);
  const [selectedBidAmount, setSelectedBidAmount] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgMessage, setOrgMessage] = useState('');

  // is this user an organizer/admin who can control the auction?
  const isOrganizer = ['ORGANIZER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role);
  const isTeamOwner = user?.role === 'TEAM_OWNER';

  // Fetch the team owner's team for bidding
  useEffect(() => {
    const fetchTeams = async () => {
      if (!auctionState?.tournamentId) return;
      try {
        const res = await auctionAPI.getTournamentTeams(auctionState.tournamentId);
        const userTeam = res.data.teams?.find((t) => {
          const owner = t.ownerId;
          const ownerIdVal = owner?._id ? owner._id : owner;
          return ownerIdVal && ownerIdVal.toString() === userId;
        });
        setMyTeam(userTeam || null);
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };
    fetchTeams();
  }, [auctionState?.tournamentId, userId]);

  // Sync real-time purse updates from WebSocket into myTeam state
  useEffect(() => {
    if (!myTeam) return;
    const updatedPurse = teamPurses[myTeam._id];
    if (updatedPurse) {
      setMyTeam((prev) => ({
        ...prev,
        usedPurse: updatedPurse.usedPurse,
        remainingPurse: updatedPurse.remainingPurse,
      }));
    }
  }, [teamPurses, myTeam?._id]);

  // Handle bid submission
  const handlePlaceBid = (e) => {
    e.preventDefault();
    setLocalBidError('');
    const amount = Number(currentBidAmount || selectedBidAmount);
    if (!amount || amount <= 0) {
      setLocalBidError('Enter a valid bid amount');
      return;
    }
    if (!myTeam) {
      setLocalBidError('You need a team to bid. Create one in your dashboard first.');
      return;
    }
    if (amount > myTeam.remainingPurse) {
      setLocalBidError(`Bid exceeds your remaining purse (₹${myTeam.remainingPurse.toLocaleString()})`);
      return;
    }
    setBiddingLoading(true);
    const success = placeBid(currentPlayer._id, myTeam._id, amount);
    if (!success) setLocalBidError('Not connected to auction server');
    setBiddingLoading(false);
    setCurrentBidAmount('');
    setSelectedBidAmount(null);
  };

  // Organizer control handler
  const handleOrgAction = async (action) => {
    setOrgLoading(true);
    setOrgMessage('');
    try {
      if (action === 'start') {
        await auctionAPI.updateAuctionStatus(auctionId, 'LIVE');
        setOrgMessage('✅ Auction started!');
      } else if (action === 'pause') {
        await auctionAPI.updateAuctionStatus(auctionId, 'PAUSED');
        setOrgMessage('✅ Auction paused!');
      } else if (action === 'finalize_sold') {
        const res = await auctionAPI.soldPlayer(auctionId, {});
        setOrgMessage(res.data.sold
          ? `✅ Sold to ${res.data.winningTeam || 'team'} for ₹${(res.data.soldPrice || 0).toLocaleString()}`
          : '⏭ No valid bids — player marked unsold');
      } else if (action === 'unsold') {
        await auctionAPI.unsoldPlayer(auctionId, {});
        setOrgMessage('✅ Player marked as unsold');
      } else if (action === 'next') {
        const res = await auctionAPI.nextAuctionPlayer(auctionId);
        setOrgMessage(res.data.auctionEnded ? '🏁 Auction completed!' : '✅ Moved to next player');
      }
      setTimeout(() => setOrgMessage(''), 3500);
    } catch (err) {
      setOrgMessage(`❌ ${err.response?.data?.message || 'Action failed'}`);
    } finally {
      setOrgLoading(false);
    }
  };

  // Quick bid amounts
  const quickBidAmounts = myTeam
    ? [
      myTeam.remainingPurse >= 50000 ? 50000 : null,
      myTeam.remainingPurse >= 100000 ? 100000 : null,
      myTeam.remainingPurse >= 250000 ? 250000 : null,
      Math.min(500000, myTeam.remainingPurse),
    ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)
    : [];

  // Timer color
  const timerColor =
    !biddingTimer ? 'text-gray-400' :
      biddingTimer.remainingTime <= 5 ? 'text-red-400' :
        biddingTimer.remainingTime <= 10 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => navigate(isOrganizer ? '/auction-management' : '/available-auctions')}
              className="text-gold hover:text-white transition p-2 border border-gold/30 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                <Gavel className="text-gold" />
                {auctionState?.status === 'LIVE' ? '🔴 LIVE Auction' : auctionState?.status === 'PAUSED' ? '⏸ Paused' : auctionState?.status === 'COMPLETED' ? '🏁 Completed' : 'Auction Room'}
              </h1>
              <p className="text-gray-400 mt-1">
                {connected ? '🟢 Connected' : '🔴 Disconnected'} • {auctionState?.playersToAuction?.length || 0} players • ID: {auctionId?.slice(-6)}
              </p>
            </div>
          </div>

          {/* Connection Status */}
          <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${auctionState?.status === 'LIVE' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
              auctionState?.status === 'PAUSED' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
                auctionState?.status === 'COMPLETED' ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                  'bg-gray-500/20 border-gray-500/50 text-gray-400'
            }`}>
            {auctionState?.status || 'Loading...'}
          </div>
        </motion.div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            ⚠️ {error}
          </div>
        )}

        {/* ── ORGANIZER CONTROL PANEL ── */}
        {isOrganizer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border-2 border-gold/50 mb-8 bg-gradient-to-br from-gold/5 to-transparent"
          >
            <h2 className="text-xl font-bold text-gold mb-4 flex items-center gap-2">
              ⚙️ Auction Control Panel <span className="text-sm text-gray-400 font-normal">({user?.role})</span>
            </h2>

            {orgMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${orgMessage.startsWith('❌') ? 'bg-red-900/30 border border-red-500/30 text-red-300' : 'bg-green-900/30 border border-green-500/30 text-green-300'
                }`}>
                {orgMessage}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {(auctionState?.status === 'SCHEDULED' || auctionState?.status === 'PAUSED') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOrgAction('start')}
                  disabled={orgLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-500/20 border border-green-500/50 text-green-400 font-semibold rounded-lg hover:bg-green-500/30 transition disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {auctionState?.status === 'PAUSED' ? 'Resume' : 'Start Auction'}
                </motion.button>
              )}

              {auctionState?.status === 'LIVE' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOrgAction('pause')}
                  disabled={orgLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-semibold rounded-lg hover:bg-yellow-500/30 transition disabled:opacity-50"
                >
                  <Pause className="w-4 h-4" />
                  Pause Auction
                </motion.button>
              )}

              {auctionState?.status !== 'COMPLETED' && currentPlayer && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOrgAction('finalize_sold')}
                    disabled={orgLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gold/20 border border-gold/50 text-gold font-semibold rounded-lg hover:bg-gold/30 transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Sell Player (Highest Bid)
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOrgAction('unsold')}
                    disabled={orgLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 border border-red-500/50 text-red-400 font-semibold rounded-lg hover:bg-red-500/30 transition disabled:opacity-50"
                  >
                    <XIcon className="w-4 h-4" />
                    Mark Unsold
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOrgAction('next')}
                    disabled={orgLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 border border-blue-500/50 text-blue-400 font-semibold rounded-lg hover:bg-blue-500/30 transition disabled:opacity-50"
                  >
                    <SkipForward className="w-4 h-4" />
                    Next Player
                  </motion.button>
                </>
              )}

              {orgLoading && <span className="text-gray-400 text-sm self-center">Processing...</span>}
            </div>

            {/* Auction Progress */}
            {auctionState && (
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gold/20">
                <div className="text-center">
                  <p className="text-gold font-bold text-xl">{auctionState.currentPlayerIndex + 1} / {auctionState.playersToAuction?.length || 0}</p>
                  <p className="text-gray-400 text-xs">Player</p>
                </div>
                <div className="text-center">
                  <p className="text-green-400 font-bold text-xl">{auctionState.soldPlayers?.length || 0}</p>
                  <p className="text-gray-400 text-xs">Sold</p>
                </div>
                <div className="text-center">
                  <p className="text-orange-400 font-bold text-xl">{auctionState.unsoldPlayers?.length || 0}</p>
                  <p className="text-gray-400 text-xs">Unsold</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Auction Completed Banner */}
        {auctionState?.status === 'COMPLETED' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card border-2 border-gold text-center py-12 mb-8"
          >
            <div className="text-6xl mb-4">🏁</div>
            <h2 className="text-3xl font-bold text-gold mb-2">Auction Completed!</h2>
            <p className="text-gray-400">
              {auctionState.soldPlayers?.length || 0} players sold •
              {auctionState.unsoldPlayers?.length || 0} unsold
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="mt-6 btn-primary inline-block"
            >
              Back to Dashboard
            </motion.button>
          </motion.div>
        )}

        {/* Main Auction Content */}
        {auctionState?.status !== 'COMPLETED' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: Current Player + Bidding */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Player Card */}
              {currentPlayer ? (
                <motion.div key={currentPlayer._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card border-2 border-gold">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">🎯 ON THE BLOCK</p>
                      <h2 className="text-3xl font-bold text-white">{currentPlayer.fullName}</h2>
                      <p className="text-gold">{currentPlayer.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs mb-1">TIMER</p>
                      <p className={`text-4xl font-bold font-mono ${timerColor}`}>
                        {biddingTimer ? biddingTimer.remainingTime : '—'}
                        {biddingTimer ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-dark-bg p-3 rounded border border-border text-center">
                      <p className="text-gray-400 text-xs mb-1">Category</p>
                      <p className="text-gold font-bold">{currentPlayer.category || 'N/A'}</p>
                    </div>
                    <div className="bg-dark-bg p-3 rounded border border-border text-center">
                      <p className="text-gray-400 text-xs mb-1">Base Price</p>
                      <p className="text-green-400 font-bold">₹{(currentPlayer.basePrice || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-dark-bg p-3 rounded border border-border text-center">
                      <p className="text-gray-400 text-xs mb-1">Age</p>
                      <p className="text-white font-bold">{currentPlayer.age || '—'}</p>
                    </div>
                    <div className="bg-dark-bg p-3 rounded border border-border text-center">
                      <p className="text-gray-400 text-xs mb-1">Experience</p>
                      <p className="text-white font-bold">{currentPlayer.yearsOfExperience || '—'} yrs</p>
                    </div>
                  </div>

                  {/* Highest Bid */}
                  {highestBid ? (
                    <div className="p-4 bg-gold/10 border border-gold/30 rounded-lg mb-4">
                      <p className="text-gray-400 text-sm">Highest Bid</p>
                      <p className="text-4xl font-bold text-gold">₹{highestBid.amount?.toLocaleString()}</p>
                      <p className="text-gray-300 text-sm mt-1">by {highestBid.teamName}</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-card-bg border border-border rounded-lg mb-4 text-center">
                      <p className="text-gray-400">No bids yet — be the first!</p>
                    </div>
                  )}

                  {/* Bid Form (Team Owners only) */}
                  {isTeamOwner && auctionState?.status === 'LIVE' && (
                    <form onSubmit={handlePlaceBid} className="space-y-3">
                      {(bidError || localBidError) && (
                        <div className="p-3 bg-red-900/30 border border-red-500/30 rounded text-red-300 text-sm">
                          {bidError || localBidError}
                        </div>
                      )}

                      {/* Quick amounts */}
                      {quickBidAmounts.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {quickBidAmounts.map((amount) => (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => { setSelectedBidAmount(amount); setCurrentBidAmount(amount.toString()); }}
                              className={`px-4 py-2 rounded border text-sm font-semibold transition ${selectedBidAmount === amount ? 'border-gold bg-gold/20 text-gold' : 'border-border text-gray-300 hover:border-gold'
                                }`}
                            >
                              ₹{(amount / 100000).toFixed(1)}L
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <input
                          type="number"
                          value={currentBidAmount}
                          onChange={(e) => { setCurrentBidAmount(e.target.value); setSelectedBidAmount(null); }}
                          placeholder={`Min: ₹${((highestBid?.amount || (currentPlayer.basePrice || 0)) + (auctionState?.minimumIncrement || 1000)).toLocaleString()}`}
                          className="flex-1 input-field"
                          min={1}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="submit"
                          disabled={biddingLoading || !myTeam}
                          className="btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                          <Gavel className="w-4 h-4" />
                          Bid
                        </motion.button>
                      </div>

                      {!myTeam && (
                        <p className="text-yellow-400 text-sm">⚠️ You need to create a team first to bid</p>
                      )}
                    </form>
                  )}

                  {isTeamOwner && auctionState?.status !== 'LIVE' && (
                    <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm text-center">
                      Auction is {auctionState?.status?.toLowerCase()} — bidding is disabled
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="card border border-gold/30 text-center py-16">
                  <Zap className="w-16 h-16 text-gold/30 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    {auctionState?.status === 'SCHEDULED'
                      ? 'Auction not started yet. Waiting for organizer to begin.'
                      : 'Waiting for auction to begin...'}
                  </p>
                  {isOrganizer && auctionState?.status === 'SCHEDULED' && (
                    <p className="text-gold text-sm mt-2">Use the control panel above to start the auction</p>
                  )}
                </div>
              )}

              {/* Recent Bids */}
              {recentBids.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card border border-gold/30">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gold" />
                    Recent Bids
                  </h3>
                  <div className="space-y-2">
                    {recentBids.slice(0, 8).map((bid, index) => (
                      <div
                        key={bid.id || index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${index === 0 ? 'border-gold/50 bg-gold/5' : 'border-border'
                          }`}
                      >
                        <div>
                          <p className="text-white font-semibold text-sm">{bid.teamName || 'Team'}</p>
                          {index === 0 && <p className="text-xs text-gold">Leading Bid</p>}
                        </div>
                        <p className={`font-bold ${index === 0 ? 'text-gold text-lg' : 'text-white'}`}>
                          ₹{(bid.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column: Team Purse */}
            <div className="space-y-6">
              {/* My Team Purse (Team Owner) */}
              {isTeamOwner && myTeam && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card border border-gold/30">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gold" />
                    My Team
                  </h3>
                  <p className="text-gold font-bold text-lg mb-4">{myTeam.name}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Remaining Purse</span>
                      <span className="text-green-400 font-bold">₹{myTeam.remainingPurse?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Used Purse</span>
                      <span className="text-orange-400 font-bold">₹{myTeam.usedPurse?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Players Bought</span>
                      <span className="text-white font-bold">{myTeam.players?.length || 0}</span>
                    </div>

                    {myTeam.remainingPurse > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Budget Used</span>
                          <span>{Math.round((myTeam.usedPurse / (myTeam.usedPurse + myTeam.remainingPurse)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-dark-bg rounded-full h-2">
                          <div
                            className="bg-gold h-2 rounded-full transition-all"
                            style={{ width: `${Math.round((myTeam.usedPurse / (myTeam.usedPurse + myTeam.remainingPurse)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {isTeamOwner && !myTeam && (
                <div className="card border border-yellow-500/30 bg-yellow-900/10 text-center py-8">
                  <p className="text-yellow-300 text-sm mb-3">No team found for this tournament</p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Create Team
                  </button>
                </div>
              )}

              {/* Auction Stats */}
              {auctionState && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card border border-gold/30">
                  <h3 className="text-xl font-bold text-white mb-4">Auction Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Players</span>
                      <span className="text-white font-bold">{auctionState.playersToAuction?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sold</span>
                      <span className="text-green-400 font-bold">{auctionState.soldPlayers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Unsold</span>
                      <span className="text-orange-400 font-bold">{auctionState.unsoldPlayers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Remaining</span>
                      <span className="text-blue-400 font-bold">
                        {Math.max(0, (auctionState.playersToAuction?.length || 0) - (auctionState.soldPlayers?.length || 0) - (auctionState.unsoldPlayers?.length || 0))}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveAuctionPage;
