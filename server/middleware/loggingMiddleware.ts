import { Request, Response, NextFunction } from "express";

/**
 * API request logger middleware
 * Logs incoming requests and their basic details
 */
export function apiLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Log when the request completes
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    // Log different status codes differently
    if (res.statusCode >= 500) {
      console.error(logMessage);
    } else if (res.statusCode >= 400) {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  });
  
  next();
}