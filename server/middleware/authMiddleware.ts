import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/apiResponse";

// Simple rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

/**
 * Middleware to check if a user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  return sendError(res, "Unauthorized", 401);
}

/**
 * Middleware to prevent brute force login attempts
 * Limits to 5 attempts per 15 minutes from same IP address
 */
export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  
  // Skip in development environment
  if (process.env.NODE_ENV === "development") {
    return next();
  }
  
  const now = Date.now();
  const ipAttempts = loginAttempts.get(ip);
  
  // If no previous attempts or lock time expired, reset
  if (!ipAttempts || ipAttempts.resetTime < now) {
    loginAttempts.set(ip, { count: 1, resetTime: now + LOCK_TIME });
    return next();
  }
  
  // If max attempts reached, block
  if (ipAttempts.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((ipAttempts.resetTime - now) / (60 * 1000));
    return sendError(
      res,
      `Too many login attempts. Please try again in ${minutesLeft} minutes.`,
      429
    );
  }
  
  // Increment attempt count
  ipAttempts.count += 1;
  loginAttempts.set(ip, ipAttempts);
  
  next();
}