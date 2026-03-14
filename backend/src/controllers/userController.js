import User from "../models/User.js";
import { hashPassword, generateRandomPassword } from "../utils/password.js";
import { logAction } from "./auditController.js";

export const createOrganizer = async (req, res) => {
  try {
    // Only Super Admin can create organizers
    if (req.userRole !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin can create organizers" });
    }

    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ message: "Email and fullName required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const tempPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(tempPassword);

    const newOrganizer = new User({
      email,
      password: hashedPassword,
      fullName,
      role: "ORGANIZER",
      createdBy: req.userId,
    });

    await newOrganizer.save();

    // Log the action
    const user = await User.findById(req.userId);
    await logAction(req.userId, user.email, 'CREATE_ACCOUNT', `New Organizer: ${fullName}`, req);

    res.status(201).json({
      message: "Organizer created successfully",
      organizer: {
        id: newOrganizer._id,
        email: newOrganizer.email,
        fullName: newOrganizer.fullName,
        tempPassword, // Only shown once!
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating organizer", error: error.message });
  }
};

export const createAdmin = async (req, res) => {
  try {
    // Only Organizer can create admins for their tournament
    if (req.userRole !== "ORGANIZER") {
      return res.status(403).json({ message: "Only Organizer can create admins" });
    }

    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ message: "Email and fullName required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const tempPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(tempPassword);

    const newAdmin = new User({
      email,
      password: hashedPassword,
      fullName,
      role: "ADMIN",
      organizerId: req.userId,
      createdBy: req.userId,
    });

    await newAdmin.save();

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        fullName: newAdmin.fullName,
        tempPassword, // Only shown once!
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating admin", error: error.message });
  }
};

export const createTeamOwner = async (req, res) => {
  try {
    if (req.userRole !== "ORGANIZER") {
      return res.status(403).json({ message: "Only Organizer can create team owners" });
    }

    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ message: "Email and fullName required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const tempPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(tempPassword);

    const newTeamOwner = new User({
      email,
      password: hashedPassword,
      fullName,
      role: "TEAM_OWNER",
      organizerId: req.userId,
      createdBy: req.userId,
    });

    await newTeamOwner.save();

    res.status(201).json({
      message: "Team Owner created successfully",
      teamOwner: {
        id: newTeamOwner._id,
        email: newTeamOwner.email,
        fullName: newTeamOwner.fullName,
        tempPassword, // Only shown once!
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating team owner", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    if (req.userRole !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find().select("-password");
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    if (req.userRole !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;

    // Prevent super admin from deactivating themselves
    if (id === req.userId.toString()) {
      return res.status(400).json({ message: "You cannot change your own account status" });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deactivating another SUPER_ADMIN
    if (targetUser.role === "SUPER_ADMIN") {
      return res.status(400).json({ message: "Cannot change status of a Super Admin account" });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    const action = targetUser.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER";
    const actor = await User.findById(req.userId);
    await logAction(
      req.userId,
      actor.email,
      action,
      `${action}: ${targetUser.fullName} (${targetUser.email})`,
      req
    );

    res.json({
      message: `User ${targetUser.isActive ? "activated" : "deactivated"} successfully`,
      user: {
        _id: targetUser._id,
        isActive: targetUser.isActive,
        fullName: targetUser.fullName,
        email: targetUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error toggling user status", error: error.message });
  }
};
