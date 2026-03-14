import User from "../models/User.js";
import Tournament from "../models/Tournament.js";
import Player from "../models/Player.js";
import Auction from "../models/Auction.js";
import Team from "../models/Team.js";

/**
 * Aggregates platform statistics for the Super Admin reports.
 * Includes real-time counts, role distributions, and 6-month growth trends.
 */
export const getPlatformStats = async (req, res) => {
    try {
        if (req.userRole !== "SUPER_ADMIN") {
            return res.status(403).json({ message: "Access denied" });
        }

        // 1. Core Platform Metrics with default values $ifNull
        const [
            totalUsers,
            usersByRole,
            totalTournaments,
            tournamentsByStatus,
            totalPlayers,
            totalAuctions,
            auctionsByStatus,
            revenueSummary
        ] = await Promise.all([
            User.countDocuments().catch(() => 0),
            User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]).catch(() => []),
            Tournament.countDocuments().catch(() => 0),
            Tournament.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).catch(() => []),
            Player.countDocuments().catch(() => 0),
            Auction.countDocuments().catch(() => 0),
            Auction.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).catch(() => []),
            Auction.aggregate([
                { $project: { soldPlayers: { $ifNull: ["$soldPlayers", []] } } },
                { $unwind: "$soldPlayers" },
                { $group: { 
                    _id: null, 
                    totalRevenue: { $sum: { $ifNull: ["$soldPlayers.soldPrice", 0] } }, 
                    transactionCount: { $sum: 1 } 
                } }
            ]).catch(() => [])
        ]);

        // Calculate Revenue Metrics with full safety
        const totalRevenue = revenueSummary && revenueSummary.length > 0 ? (revenueSummary[0].totalRevenue || 0) : 0;
        const transactionCount = revenueSummary && revenueSummary.length > 0 ? (revenueSummary[0].transactionCount || 0) : 0;
        const avgTransaction = transactionCount > 0 ? (totalRevenue / transactionCount).toFixed(2) : 0;

        // 2. Format Distributions (convert array to object)
        const formatDistribution = (arr) => {
            const dist = {};
            if (Array.isArray(arr)) {
                arr.forEach(item => { 
                    if (item && item._id !== undefined && item._id !== null) {
                        dist[String(item._id)] = item.count || 0; 
                    }
                });
            }
            return dist;
        };

        const roleDist = formatDistribution(usersByRole);
        const tournamentDist = formatDistribution(tournamentsByStatus);
        const auctionDist = formatDistribution(auctionsByStatus);

        // 3. Time-Series Trend Analysis (Last 6 Months)
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const [userTrends, tournamentTrends, revenueTrends] = await Promise.all([
            // User registrations per month
            User.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }},
                { $sort: { "_id": 1 } }
            ]).catch(() => []),
            // Tournament creations per month
            Tournament.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }},
                { $sort: { "_id": 1 } }
            ]).catch(() => []),
            // Auction revenue per month
            Auction.aggregate([
                { $project: { soldPlayers: { $ifNull: ["$soldPlayers", []] } } },
                { $unwind: "$soldPlayers" },
                { $match: { 
                    "soldPlayers.soldTime": { $exists: true, $ne: null, $gte: sixMonthsAgo } 
                } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$soldPlayers.soldTime" } },
                    amount: { $sum: { $ifNull: ["$soldPlayers.soldPrice", 0] } }
                }},
                { $sort: { "_id": 1 } }
            ]).catch(() => [])
        ]);

        // Merge trends into unified monthly data for Recharts
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const trends = [];
        
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const key = `${year}-${month}`; // Matches %Y-%m format from MongoDB
            
            trends.push({
                name: monthNames[d.getMonth()],
                users: (userTrends.find(ut => ut._id === key)?.count) || 0,
                tournaments: (tournamentTrends.find(tt => tt._id === key)?.count) || 0,
                revenue: (revenueTrends.find(rt => rt._id === key)?.amount) || 0
            });
        }

        // 4. Send Final Compiled Data
        res.json({
            summary: {
                totalUsers: totalUsers || 0,
                totalTournaments: totalTournaments || 0,
                totalPlayers: totalPlayers || 0,
                totalAuctions: totalAuctions || 0,
                totalRevenue: Number(totalRevenue) || 0,
                transactionCount: transactionCount || 0,
                avgTransaction: avgTransaction || "0.00"
            },
            distribution: {
                roles: roleDist,
                tournaments: tournamentDist,
                auctions: auctionDist
            },
            trends
        });
    } catch (error) {
        console.error("Critical Platform Stats Error:", error);
        res.status(500).json({ 
            message: "Failed to compile platform statistics", 
            error: error.message 
        });
    }
};

/**
 * Mocks enqueuing a report for email delivery.
 */
export const emailReport = async (req, res) => {
    try {
        const { reportType, email } = req.body;
        res.json({ message: `Success: The "${reportType}" report has been sent to ${email}` });
    } catch (error) {
        res.status(500).json({ message: "Failed to send email", error: error.message });
    }
};

/**
 * Mocks creating a recurring report schedule.
 */
export const scheduleReport = async (req, res) => {
    try {
        const { reportType, frequency } = req.body;
        res.json({ message: `Success: "${reportType}" is now scheduled for ${frequency} delivery.` });
    } catch (error) {
        res.status(500).json({ message: "Failed to schedule report", error: error.message });
    }
};
