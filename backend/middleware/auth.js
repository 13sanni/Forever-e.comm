import jwt from "jsonwebtoken";
import loadEnv from "../config/env.js";

const getTokenFromHeaders = (headers) => {
  const authHeader = headers.authorization || headers.Authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return headers.token;
};

const authUser = async (req, res, next) => {
  try {
    const env = loadEnv();
    const token = getTokenFromHeaders(req.headers);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in again.",
      });
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
    });
  }
};

export default authUser;
