import jwt from "jsonwebtoken";

// Validate JWT_SECRET at startup
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "your_jwt_secret_key") {
  console.warn("⚠️  WARNING: JWT_SECRET not properly configured. Using default for development only.");
}

const getSecret = () => process.env.JWT_SECRET || "cricket_auction_dev_secret_2024";

export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    getSecret(),
    { expiresIn: "7d" }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, getSecret());
  } catch (error) {
    return null;
  }
};
