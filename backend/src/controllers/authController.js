import User from "../models/User.js";
import Player from "../models/Player.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../config/jwt.js";
import { logAction } from "./auditController.js";

export const registerUser = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      role: role || "PLAYER",
    });

    await newUser.save();

    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser._id, email: newUser.email, role: newUser.role },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Registration error", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "User account is inactive" });
    }

    const token = generateToken(user._id, user.role);

    // Log the login action
    await logAction(user._id, user.email, 'LOGIN', `${user.role} Login`, req);

    res.json({
      message: "Login successful",
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

// Register a new player with complete profile data
export const registerPlayerComplete = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      age,
      playerRole,
      yearsOfExperience,
      battingStyle,
      bowlingStyle,
      phone,
      address,
    } = req.body;

    // Validation
    if (!email || !password || !fullName || !age || !playerRole || yearsOfExperience === undefined || !battingStyle) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Create user account
    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      role: "PLAYER",
    });
    await newUser.save();

    // Create player profile
    const newPlayer = new Player({
      userId: newUser._id,
      fullName,
      age: parseInt(age),
      role: playerRole,
      yearsOfExperience: parseInt(yearsOfExperience),
      battingStyle,
      bowlingStyle: bowlingStyle || "None",
      contactDetails: {
        phone: phone || "",
        address: address || "",
      },
      status: "REGISTERED",
    });
    await newPlayer.save();

    // Generate token
    const token = generateToken(newUser._id, newUser.role);

    // Log the registration
    await logAction(newUser._id, newUser.email, 'CREATE_ACCOUNT', `Player Registration - ${playerRole}`, req);

    res.status(201).json({
      message: "Player registered successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
      player: {
        id: newPlayer._id,
        age: newPlayer.age,
        playerRole: newPlayer.role,
        yearsOfExperience: newPlayer.yearsOfExperience,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Player registration error", error: error.message });
  }
};
