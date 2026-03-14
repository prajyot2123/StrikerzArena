import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { auctionAPI } from '../utils/api';

export const useAuctionSocket = (auctionId, token) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [auctionState, setAuctionState] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [recentBids, setRecentBids] = useState([]);
  const [error, setError] = useState(null);
  const [bidError, setBidError] = useState(null);
  const [biddingTimer, setBiddingTimer] = useState(null); // { totalTime, remainingTime }
  const [highestBid, setHighestBid] = useState(null); // { amount, teamName, teamId }
  const [teamPurses, setTeamPurses] = useState({}); // { teamId: { usedPurse, remainingPurse } }

  // Keep a stable ref to auctionId for use in async socket closures
  const currentAuctionIdRef = useRef(auctionId);
  useEffect(() => { currentAuctionIdRef.current = auctionId; }, [auctionId]);

  // Initialize socket connection
  useEffect(() => {
    if (!auctionId || !token) return;

    const socketURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const newSocket = io(socketURL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
      setError(null); // Clear any previous connection errors
      
      // Join auction room (works for initial connect and reconnect)
      newSocket.emit('joinAuction', { auctionId, token });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setError('Connection failed. Retrying...');
    });

    // Auction events
    newSocket.on('auctionState', (data) => {
      setAuctionState(data.auction);
      setCurrentPlayer(data.currentPlayer);
      setRecentBids([]);
      setHighestBid(null);
      setBiddingTimer(null);
    });

    // === NEW: Bid placed ===
    newSocket.on('bidPlaced', (data) => {
      setRecentBids((prev) => [
        { ...data, id: data.bidId || `${data.teamId}-${data.playerId}-${Date.now()}` },
        ...prev.slice(0, 9), // Keep last 10 bids
      ]);
      setBidError(null); // Clear any previous errors
    });

    // === NEW: Update highest bid ===
    newSocket.on('updateHighestBid', (data) => {
      setHighestBid({
        amount: data.highestBid,
        teamName: data.leadingTeamName,
        teamId: data.leadingTeam,
      });
    });

    // === NEW: Bidding timer started ===
    newSocket.on('biddingTimerStarted', (data) => {
      setBiddingTimer({
        totalTime: data.totalTime,
        remainingTime: data.remainingTime,
      });
    });

    // === NEW: Bidding timer tick ===
    newSocket.on('biddingTimerTick', (data) => {
      setBiddingTimer((prev) => ({
        ...prev,
        remainingTime: data.remainingTime,
      }));
    });

    // === NEW: Team purse updated ===
    newSocket.on('teamPurseUpdated', (data) => {
      setTeamPurses((prev) => ({
        ...prev,
        [data.teamId]: {
          usedPurse: data.usedPurse,
          remainingPurse: data.remainingPurse,
        },
      }));
    });

    // === NEW: Bid error ===
    newSocket.on('bidError', (data) => {
      setBidError(data.message);
      setTimeout(() => setBidError(null), 3000); // Clear after 3 seconds
    });

    newSocket.on('playerChanged', (data) => {
      setCurrentPlayer(data.currentPlayer);
      setRecentBids([]);
      setHighestBid(null);
      setBiddingTimer(null);
      // Update counts if the backend sent them (present after nextPlayer / timer finalization)
      if (data.soldCount !== undefined || data.unsoldCount !== undefined) {
        setAuctionState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            soldPlayers:   data.soldCount !== undefined ? Array(data.soldCount).fill({}) : prev.soldPlayers,
            unsoldPlayers: data.unsoldCount !== undefined ? Array(data.unsoldCount).fill({}) : prev.unsoldPlayers,
          };
        });
      }
    });

    newSocket.on('playerSold', (data) => {
      // Optimistically update soldPlayers count so UI doesn't show 0
      setAuctionState((prev) => {
        if (!prev) return prev;
        const alreadyIn = prev.soldPlayers?.some(
          (e) => (e.playerId?._id ?? e.playerId)?.toString() === data.playerId?.toString()
        );
        if (alreadyIn) return prev;
        return {
          ...prev,
          soldPlayers: [
            ...(prev.soldPlayers || []),
            { playerId: data.playerId, teamId: data.teamId, soldPrice: data.soldPrice },
          ],
        };
      });
    });

    newSocket.on('playerUnsold', (data) => {
      // Optimistically update unsoldPlayers count
      setAuctionState((prev) => {
        if (!prev) return prev;
        const alreadyIn = prev.unsoldPlayers?.some(
          (id) => id?.toString() === data.playerId?.toString()
        );
        if (alreadyIn) return prev;
        return {
          ...prev,
          unsoldPlayers: [...(prev.unsoldPlayers || []), data.playerId],
        };
      });
    });

    newSocket.on('auctionEnded', async (data) => {
      // 1. Immediately show completion with counts from the event payload
      setAuctionState((prev) => ({
        ...prev,
        status: 'COMPLETED',
        // Use socket-provided counts as a fast-path fallback
        soldPlayers:   data.soldCount !== undefined ? Array(data.soldCount).fill({}) : (prev?.soldPlayers || []),
        unsoldPlayers: data.unsoldCount !== undefined ? Array(data.unsoldCount).fill({})  : (prev?.unsoldPlayers || []),
      }));
      setCurrentPlayer(null);
      setBiddingTimer(null);

      // 2. Re-fetch from API to get authoritative populated data for the complete view
      try {
        const res = await auctionAPI.getAuctionDetails(currentAuctionIdRef.current);
        if (res.data.auction) {
          setAuctionState(res.data.auction);
        }
      } catch (e) {
        console.error('Failed to re-fetch auction state on end:', e);
      }
    });

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [auctionId, token]);

  // Place bid
  const placeBid = useCallback(
    (playerId, teamId, amount) => {
      if (!socket || !connected) {
        setBidError('Not connected to auction');
        return false;
      }
      
      socket.emit('placeBid', { auctionId, playerId, teamId, amount });
      return true;
    },
    [socket, connected, auctionId]
  );

  // Next player
  const nextPlayer = useCallback(() => {
    if (!socket || !connected) {
      setError('Not connected to auction');
      return false;
    }
    
    socket.emit('nextPlayer', { auctionId });
    return true;
  }, [socket, connected, auctionId]);

  // Sold player
  const soldPlayer = useCallback((playerId, teamId, soldPrice) => {
    if (!socket || !connected) {
      setError('Not connected to auction');
      return false;
    }
    
    socket.emit('soldPlayer', { auctionId, playerId, teamId, soldPrice });
    return true;
  }, [socket, connected, auctionId]);

  // Unsold player
  const unBidPlayer = useCallback((playerId) => {
    if (!socket || !connected) {
      setError('Not connected to auction');
      return false;
    }
    
    socket.emit('unsoldPlayer', { auctionId, playerId });
    return true;
  }, [socket, connected, auctionId]);

  return {
    socket,
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
    nextPlayer,
    soldPlayer,
    unBidPlayer,
  };
};

export default useAuctionSocket;
