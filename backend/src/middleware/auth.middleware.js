import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Normal user authentication
export const protectRoute = async (req, res, next) => {
  try {
    let token = req.cookies.jwt;

    // Check for Authorization header if cookie is missing
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // 🚨 Ban check
    if (user.isBanned) {
      res.clearCookie("jwt"); // Auto logout
      return res.status(403).json({
        message: `Your account has been banned. Reason: ${user.banReason || "No reason provided"}`,
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Admin authentication check (NEW)
export const isAdmin = (req, res, next) => {
  try {
    if (req.user && req.user.role === "admin") {
      next(); // Admin verified
    } else {
      return res.status(403).json({ message: "Access Denied - Admins only" });
    }
  } catch (error) {
    console.log("Error in isAdmin middleware", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
