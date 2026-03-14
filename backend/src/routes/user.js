import express from "express";
import { createOrganizer, createAdmin, createTeamOwner, getAllUsers, toggleUserStatus } from "../controllers/userController.js";
import { authMiddleware, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-organizer", authMiddleware, authorize("SUPER_ADMIN"), createOrganizer);
router.post("/create-admin", authMiddleware, authorize("ORGANIZER"), createAdmin);
router.post("/create-team-owner", authMiddleware, authorize("ORGANIZER"), createTeamOwner);
router.get("/all-users", authMiddleware, authorize("SUPER_ADMIN"), getAllUsers);
router.patch("/:id/toggle-status", authMiddleware, authorize("SUPER_ADMIN"), toggleUserStatus);

export default router;

