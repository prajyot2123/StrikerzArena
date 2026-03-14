import express from "express";
import { registerUser, loginUser, getCurrentUser, registerPlayerComplete } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/register-player", registerPlayerComplete);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getCurrentUser);

export default router;
