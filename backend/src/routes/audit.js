import express from "express";
import { getAllAuditLogs, getAuditLogsByUser } from "../controllers/auditController.js";
import { authMiddleware, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, authorize("SUPER_ADMIN"), getAllAuditLogs);
router.get("/user/:userId", authMiddleware, getAuditLogsByUser);

export default router;
