import express from "express";
import { getPlatformStats, emailReport, scheduleReport } from "../controllers/statsController.js";
import { authMiddleware, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/platform-overview", authMiddleware, authorize("SUPER_ADMIN"), getPlatformStats);
router.post("/email", authMiddleware, authorize("SUPER_ADMIN"), emailReport);
router.post("/schedule", authMiddleware, authorize("SUPER_ADMIN"), scheduleReport);

export default router;
