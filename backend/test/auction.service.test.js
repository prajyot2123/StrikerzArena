import test from "node:test";
import assert from "node:assert/strict";
import { auctionServiceTestables } from "../src/services/auctionService.js";

test("multi-bid flow enforces minimum increment and keeps highest bid", () => {
  const result = auctionServiceTestables.simulateBiddingSession({
    purseRemaining: 1000000,
    minimumIncrement: 50000,
    bids: [
      { teamId: "t1", amount: 50000 },
      { teamId: "t2", amount: 90000 }, // invalid (< 100000)
      { teamId: "t2", amount: 100000 }, // valid
      { teamId: "t1", amount: 130000 }, // invalid (< 150000)
      { teamId: "t1", amount: 150000 }, // valid
    ],
  });

  assert.equal(result.acceptedBids.length, 3);
  assert.equal(result.highestBid, 150000);
});

test("purse remains unchanged during bidding window", () => {
  const result = auctionServiceTestables.simulateBiddingSession({
    purseRemaining: 1000000,
    minimumIncrement: 10000,
    bids: [
      { teamId: "t1", amount: 10000 },
      { teamId: "t1", amount: 20000 },
      { teamId: "t1", amount: 50000 },
    ],
  });

  assert.equal(result.purseDuringBidding, 1000000);
});

test("purse is deducted only after finalize when player is sold", () => {
  const result = auctionServiceTestables.simulateBiddingSession({
    purseRemaining: 1000000,
    minimumIncrement: 10000,
    bids: [
      { teamId: "t1", amount: 10000 },
      { teamId: "t2", amount: 30000 },
      { teamId: "t1", amount: 70000 },
    ],
  });

  assert.equal(result.sold, true);
  assert.equal(result.purseDuringBidding, 1000000);
  assert.equal(result.purseAfterFinalize, 930000);
});

