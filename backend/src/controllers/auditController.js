import AuditLog from "../models/AuditLog.js";

export const logAction = async (userId, userEmail, action, resource, req, status = "success", details = null) => {
  try {
    const auditLog = new AuditLog({
      userId,
      userEmail,
      action,
      resource,
      status,
      ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
      userAgent: req.get("user-agent"),
      details,
    });
    await auditLog.save();
  } catch (error) {
    console.error("Failed to log action:", error);
  }
};

export const getAllAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 })
      .limit(100);

    const formattedLogs = logs.map(log => ({
      _id: log._id,
      user: log.userEmail,
      action: log.action,
      resource: log.resource,
      timestamp: log.createdAt.toISOString().replace('T', ' ').split('.')[0],
      status: log.status,
      ip: log.ipAddress,
    }));

    res.json({ logs: formattedLogs });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch audit logs", error });
  }
};

export const getAuditLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await AuditLog.find({ userId })
      .sort({ createdAt: -1 });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch audit logs", error });
  }
};
