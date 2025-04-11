import { Request, Response, NextFunction } from "express";

/**
 * Custom application error class with HTTP status code
 */
export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }
  
  // Handle known NodeJS/Express errors
  if (err.name === "SyntaxError") {
    return res.status(400).json({
      status: "error",
      message: "Invalid JSON",
    });
  }
  
  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
  
  // Generic error response for unhandled errors
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}

/**
 * 404 not found handler for unmatched routes
 */
export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    status: "error",
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
}