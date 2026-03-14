import Auction from "../models/Auction.js";
import { verifyToken } from "../config/jwt.js";
import {
  placeBidWithValidation,
  finalizeAuctionForCurrentPlayer,
  getAuctionState,
} from "../services/auctionService.js";

const BID_WINDOW_SECONDS = 30;
const auctionTimers = {};

const ensureTimerStore = (auctionId) => {
  if (!auctionTimers[auctionId]) {
    auctionTimers[auctionId] = {};
  }
  return auctionTimers[auctionId];
};

const startOrResetTimer = ({ io, auctionId, playerId, forceReset = false }) => {
  const store = ensureTimerStore(auctionId);
  const key = playerId.toString();
  const existing = store[key];

  if (existing && !forceReset && existing.remainingTime > 0) {
    return existing.remainingTime;
  }

  if (existing?.timeoutId) clearTimeout(existing.timeoutId);
  if (existing?.intervalId) clearInterval(existing.intervalId);

  let remainingTime = BID_WINDOW_SECONDS;

  io.to(`auction-${auctionId}`).emit("biddingTimerStarted", {
    playerId: key,
    totalTime: BID_WINDOW_SECONDS,
    remainingTime: BID_WINDOW_SECONDS,
  });

  const intervalId = setInterval(() => {
    remainingTime -= 1;
    if (store[key]) {
      store[key].remainingTime = remainingTime;
    }
    io.to(`auction-${auctionId}`).emit("biddingTimerTick", {
      playerId: key,
      remainingTime,
    });
    if (remainingTime <= 0) {
      clearInterval(intervalId);
    }
  }, 1000);

  const timeoutId = setTimeout(async () => {
    try {
      const result = await finalizeAuctionForCurrentPlayer(auctionId);

      if (result.sold) {
        io.to(`auction-${auctionId}`).emit('playerSold', {
          playerId:     result.playerId,
          teamId:       result.winningTeam?._id,
          teamName:     result.winningTeam?.name,
          soldPrice:    result.soldPrice,
          soldCount:    result.auction.soldPlayers?.length ?? 0,
          unsoldCount:  result.auction.unsoldPlayers?.length ?? 0,
        });
        if (result.winningTeam) {
          io.to(`auction-${auctionId}`).emit('teamPurseUpdated', {
            teamId:         result.winningTeam._id,
            usedPurse:      result.winningTeam.usedPurse,
            remainingPurse: result.winningTeam.remainingPurse,
            teamName:       result.winningTeam.name,
          });
        }
      } else if (result.unsold) {
        io.to(`auction-${auctionId}`).emit('playerUnsold', {
          playerId:    result.playerId,
          message:     'No valid bids received - player marked unsold',
          soldCount:   result.auction.soldPlayers?.length ?? 0,
          unsoldCount: result.auction.unsoldPlayers?.length ?? 0,
        });
      }

      if (result.auctionEnded) {
        io.to(`auction-${auctionId}`).emit('auctionEnded', {
          message:     'All players auctioned',
          soldCount:   result.auction.soldPlayers?.length ?? 0,
          unsoldCount: result.auction.unsoldPlayers?.length ?? 0,
        });
      } else if (result.nextPlayer?._id) {
        io.to(`auction-${auctionId}`).emit('playerChanged', {
          playerIndex:   result.auction.currentPlayerIndex,
          currentPlayer: result.nextPlayer,
          playerId:      result.nextPlayer._id,
          soldCount:     result.auction.soldPlayers?.length ?? 0,
          unsoldCount:   result.auction.unsoldPlayers?.length ?? 0,
        });
        startOrResetTimer({
          io,
          auctionId,
          playerId: result.nextPlayer._id,
          forceReset: true,
        });
      }
    } catch (error) {
      console.error('Error finalizing auction player:', error);
    } finally {
      if (store[key]?.intervalId) clearInterval(store[key].intervalId);
      delete store[key];
    }
  }, BID_WINDOW_SECONDS * 1000);

  store[key] = {
    timeoutId,
    intervalId,
    remainingTime: BID_WINDOW_SECONDS,
  };

  return BID_WINDOW_SECONDS;
};

const setupAuctionWebSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("joinAuction", async ({ auctionId, token }) => {
      try {
        const decoded = verifyToken(token);
        if (!decoded) {
          socket.emit("error", { message: "Invalid token" });
          return;
        }

        const { auction, currentPlayer } = await getAuctionState(auctionId);

        socket.join(`auction-${auctionId}`);
        socket.auctionId = auctionId;
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;

        socket.emit("auctionState", { auction, currentPlayer });

        if (auction.status === "LIVE" && currentPlayer?._id) {
          const store = ensureTimerStore(auctionId);
          const key = currentPlayer._id.toString();
          const existing = store[key];
          if (existing?.remainingTime > 0) {
            socket.emit("biddingTimerStarted", {
              playerId: key,
              totalTime: BID_WINDOW_SECONDS,
              remainingTime: existing.remainingTime,
            });
          } else {
            startOrResetTimer({
              io,
              auctionId,
              playerId: currentPlayer._id,
            });
          }
        }
      } catch (error) {
        socket.emit("error", { message: error.message || "Error joining auction" });
      }
    });

    socket.on("placeBid", async ({ auctionId, playerId, teamId, amount }) => {
      try {
        if (socket.userRole !== "TEAM_OWNER") {
          socket.emit("bidError", { message: "Only Team Owners can bid" });
          return;
        }

        const result = await placeBidWithValidation({
          auctionId,
          playerId,
          teamId,
          ownerId: socket.userId,
          amount,
        });

        io.to(`auction-${auctionId}`).emit("bidPlaced", {
          playerId,
          teamId,
          teamName: result.team.name,
          amount: Number(amount),
          bidTime: new Date(),
          bidId: result.bid._id,
        });

        io.to(`auction-${auctionId}`).emit("updateHighestBid", {
          playerId,
          highestBid: Number(amount),
          leadingTeam: teamId,
          leadingTeamName: result.team.name,
          minimumIncrement: result.auction.minimumIncrement || 1000,
        });

        startOrResetTimer({
          io,
          auctionId,
          playerId,
          forceReset: true,
        });
      } catch (error) {
        socket.emit("bidError", { message: error.message || "Error placing bid" });
      }
    });

    socket.on('nextPlayer', async ({ auctionId }) => {
      try {
        const allowedRoles = ['ADMIN', 'ORGANIZER', 'SUPER_ADMIN'];
        if (!allowedRoles.includes(socket.userRole)) {
          socket.emit('error', { message: 'Only Admins/Organizers/Super Admins can move to next player' });
          return;
        }

        const result = await finalizeAuctionForCurrentPlayer(auctionId);

        // Always emit sell/unsold result so all clients update their counts
        if (result.sold) {
          io.to(`auction-${auctionId}`).emit('playerSold', {
            playerId:    result.playerId,
            teamId:      result.winningTeam?._id,
            teamName:    result.winningTeam?.name,
            soldPrice:   result.soldPrice,
            soldCount:   result.auction.soldPlayers?.length ?? 0,
            unsoldCount: result.auction.unsoldPlayers?.length ?? 0,
          });
        } else if (result.unsold) {
          io.to(`auction-${auctionId}`).emit('playerUnsold', {
            playerId:    result.playerId,
            soldCount:   result.auction.soldPlayers?.length ?? 0,
            unsoldCount: result.auction.unsoldPlayers?.length ?? 0,
          });
        }

        if (result.auctionEnded) {
          io.to(`auction-${auctionId}`).emit('auctionEnded', {
            message:     'All players auctioned',
            soldCount:   result.auction.soldPlayers?.length ?? 0,
            unsoldCount: result.auction.unsoldPlayers?.length ?? 0,
          });
          return;
        }

        io.to(`auction-${auctionId}`).emit('playerChanged', {
          playerIndex:   result.auction.currentPlayerIndex,
          currentPlayer: result.nextPlayer,
          playerId:      result.nextPlayer?._id,
          soldCount:     result.auction.soldPlayers?.length ?? 0,
          unsoldCount:   result.auction.unsoldPlayers?.length ?? 0,
        });

        if (result.nextPlayer?._id) {
          startOrResetTimer({
            io,
            auctionId,
            playerId: result.nextPlayer._id,
            forceReset: true,
          });
        }
      } catch (error) {
        socket.emit('error', { message: error.message || 'Error moving to next player' });
      }
    });

    socket.on("auctionStatusChange", async ({ auctionId, status }) => {
      try {
        const allowedRoles = ["ADMIN", "ORGANIZER", "SUPER_ADMIN"];
        if (!allowedRoles.includes(socket.userRole)) {
          socket.emit("error", { message: "Only Admins/Organizers/Super Admins can change auction status" });
          return;
        }

        const auction = await Auction.findByIdAndUpdate(auctionId, { status }, { new: true }).populate("playersToAuction");
        if (!auction) {
          socket.emit("error", { message: "Auction not found" });
          return;
        }

        io.to(`auction-${auctionId}`).emit("auctionStatusChanged", { status: auction.status });

        const currentPlayer = auction.playersToAuction?.[auction.currentPlayerIndex];
        if (status === "LIVE" && currentPlayer?._id) {
          startOrResetTimer({
            io,
            auctionId,
            playerId: currentPlayer._id,
            forceReset: true,
          });
        }
      } catch (error) {
        socket.emit("error", { message: error.message || "Error changing auction status" });
      }
    });
  });
};

export default setupAuctionWebSocket;

