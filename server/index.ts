import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { apiLogger } from "./middleware/loggingMiddleware";
import { errorHandler, notFound } from "./middleware/errorMiddleware";

const app = express();

// Core middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Application middleware
app.use(apiLogger);

(async () => {
  // Initialize database with initial data
  try {
    log("Initializing database...");
    await storage.initializeDatabase();
    log("Database initialized successfully.");
  } catch (error: any) {
    log(`Error initializing database: ${error instanceof Error ? error.message : String(error)}`);
    // Don't halt the server, let it continue to start up even if database initialization fails
    // This way the user can still access the application interface to diagnose and fix issues
  }

  // Register all application routes
  const server = await registerRoutes(app);

  // Vite setup for development - Must come before 404 handler
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Error handling middleware - must be after routes and vite setup
  app.use(notFound);
  app.use(errorHandler);

  // Start server
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, '0.0.0.0', () => {
    log(`MediTrack API server running on port ${port}`);
    log(`Mode: ${process.env.NODE_ENV}`);
  });
})();