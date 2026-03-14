import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";

const DEFAULT_MIN_INCREMENT = 1000;

const buildMinAllowedBid = (currentHighestBid, minimumIncrement) => {
  if (!currentHighestBid) return minimumIncrement;
  return currentHighestBid + minimumIncrement;
};

const getCurrentPlayerId = (auction) => {
  const playerRef = auction.playersToAuction?.[auction.currentPlayerIndex];
  if (!playerRef) return null;
  return playerRef._id ? playerRef._id.toString() : playerRef.toString();
};

const advanceAuction = async (auction) => {
  if (auction.currentPlayerIndex < auction.playersToAuction.length - 1) {
    auction.currentPlayerIndex += 1;
  } else {
    auction.status  = "COMPLETED";
    auction.endTime = new Date();
  }
  await auction.save();
  await auction.populate("playersToAuction");
  const nextPlayer = auction.playersToAuction[auction.currentPlayerIndex] || null;
  return nextPlayer;
};

// ─────────────────────────────────────────────
export const placeBidWithValidation = async ({ auctionId, playerId, teamId, ownerId, amount }) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Bid amount must be greater than 0");
  }

  const auction = await Auction.findById(auctionId);
  if (!auction) throw new Error("Auction not found");
  if (auction.status !== "LIVE") throw new Error("Auction is not live");

  const currentPlayerId = getCurrentPlayerId(auction);
  if (!currentPlayerId || currentPlayerId !== playerId.toString()) {
    throw new Error("Bidding is only allowed for the current player");
  }

  const team = await Team.findOne({ _id: teamId, ownerId, remainingPurse: { $gte: numericAmount } });
  if (!team) throw new Error("Team not found or insufficient purse");

  const currentHighestBidDoc = await Bid.findOne({ auctionId, playerId }).sort({ amount: -1 });
  const currentHighestBid    = currentHighestBidDoc?.amount || 0;
  const minIncrement         = auction.minimumIncrement || DEFAULT_MIN_INCREMENT;
  const minAllowedBid        = buildMinAllowedBid(currentHighestBid, minIncrement);

  if (numericAmount < minAllowedBid) {
    throw new Error(`Bid must be at least ₹${minAllowedBid}`);
  }

  const bid = await Bid.create({ auctionId, playerId, teamId, amount: numericAmount });

  return { bid, team, auction, currentHighestBid: numericAmount, minAllowedBid };
};

// ─────────────────────────────────────────────
// Finalize: find highest bidder → sell to them → advance
// ─────────────────────────────────────────────
export const finalizeAuctionForCurrentPlayer = async (auctionId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new Error("Auction not found");

  const currentPlayerId = getCurrentPlayerId(auction);
  if (!currentPlayerId) {
    auction.status = "COMPLETED";
    await auction.save();
    return { auction, auctionEnded: true, sold: false, unsold: false, playerId: null };
  }

  const [highestBid, player] = await Promise.all([
    Bid.findOne({ auctionId, playerId: currentPlayerId }).sort({ amount: -1 }),
    Player.findById(currentPlayerId),
  ]);

  let sold = false, unsold = false, winningTeam = null, soldPrice = 0, winningBid = null;

  if (highestBid) {
    const orderedBids = await Bid.find({ auctionId, playerId: currentPlayerId }).sort({ amount: -1, createdAt: 1 });

    for (const bid of orderedBids) {
      const team = await Team.findOneAndUpdate(
        {
          _id:               bid.teamId,
          remainingPurse:    { $gte: bid.amount },
          "players.playerId": { $ne: currentPlayerId },
        },
        {
          $inc:   { usedPurse: bid.amount, remainingPurse: -bid.amount },
          $push:  { players: { playerId: currentPlayerId, biddedPrice: bid.amount, role: player?.role || "Player" } },
        },
        { new: true }
      );

      if (team) {
        sold        = true;
        winningTeam = team;
        soldPrice   = bid.amount;
        winningBid  = bid;
        break;
      }
    }
  }

  if (sold && winningBid) {
    await Promise.all([
      Bid.updateMany({ auctionId, playerId: currentPlayerId }, { isWinningBid: false }),
      Bid.findByIdAndUpdate(winningBid._id, { isWinningBid: true }),
      Player.findByIdAndUpdate(currentPlayerId, { 
        status: "SOLD", 
        soldPrice, 
        soldTo: winningTeam._id,
        // Also archive active tournament data immediately
        $push: {
          tournamentHistory: {
            tournamentId: auction.tournamentId,
            teamId: winningTeam._id,
            status: "SOLD",
            soldPrice,
            category: player?.category,
            score: 0 // Could be trial score if available
          }
        }
      }),
    ]);

    if (!auction.soldPlayers.some(e => e.playerId.toString() === currentPlayerId)) {
      auction.soldPlayers.push({ playerId: currentPlayerId, teamId: winningTeam._id, soldPrice, soldTime: new Date() });
    }
    auction.unsoldPlayers = auction.unsoldPlayers.filter(id => id.toString() !== currentPlayerId);

  } else {
    unsold = true;
    await Player.findByIdAndUpdate(currentPlayerId, { status: "UNSOLD", soldPrice: 0, soldTo: null });
    if (!auction.unsoldPlayers.some(id => id.toString() === currentPlayerId)) {
      auction.unsoldPlayers.push(currentPlayerId);
    }
  }

  const nextPlayer = await advanceAuction(auction);

  return {
    auction,
    nextPlayer,
    sold, unsold,
    playerId: currentPlayerId,
    winningTeam,
    soldPrice,
    auctionEnded: auction.status === "COMPLETED",
  };
};

// ─────────────────────────────────────────────
// NEW: Explicitly mark current player as unsold (admin decision, skip bid check)
// ─────────────────────────────────────────────
export const markCurrentPlayerUnsold = async (auctionId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new Error("Auction not found");

  const currentPlayerId = getCurrentPlayerId(auction);
  if (!currentPlayerId) {
    auction.status = "COMPLETED";
    await auction.save();
    return { auction, auctionEnded: true };
  }

  await Player.findByIdAndUpdate(currentPlayerId, { status: "UNSOLD", soldPrice: 0, soldTo: null });

  if (!auction.unsoldPlayers.some(id => id.toString() === currentPlayerId)) {
    auction.unsoldPlayers.push(currentPlayerId);
  }

  const nextPlayer = await advanceAuction(auction);

  return {
    auction,
    nextPlayer,
    unsold:       true,
    playerId:     currentPlayerId,
    auctionEnded: auction.status === "COMPLETED",
  };
};

// ─────────────────────────────────────────────
export const getAuctionState = async (auctionId) => {
  const auction = await Auction.findById(auctionId)
    .populate("playersToAuction")
    .populate("soldPlayers.playerId")
    .populate("soldPlayers.teamId")
    .populate("unsoldPlayers")
    .exec();

  if (!auction) throw new Error("Auction not found");

  const currentPlayer = auction.playersToAuction[auction.currentPlayerIndex] || null;
  const recentBids    = await Bid.find({ auctionId, playerId: currentPlayer?._id })
    .populate("teamId")
    .sort({ createdAt: -1 })
    .limit(10)
    .exec();

  return { auction, currentPlayer, recentBids: recentBids.reverse() };
};

// ─────────────────────────────────────────────
// Test helpers
export const auctionServiceTestables = {
  buildMinAllowedBid,
};