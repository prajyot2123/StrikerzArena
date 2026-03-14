import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: [
        "LOGIN",
        "LOGOUT",
        "CREATE_ACCOUNT",
        "CREATE_TOURNAMENT",
        "UPDATE_TOURNAMENT",
        "CREATE_TEAM",
        "DELETE_USER",
        "UPDATE_SETTINGS",
        "EXPORT_DATA",
      ],
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
