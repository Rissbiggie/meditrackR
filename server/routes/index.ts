import { Express, Router } from "express";
import emergencyRequestRoutes from "./emergencyRequestRoutes";
import userRoutes from "./userRoutes";
import medicalFacilityRoutes from "./medicalFacilityRoutes";

// Create empty router objects for now - will be implemented properly when files exist
const emergencyContactRoutes = Router();

export default function setupRoutes(app: Express) {
  // Register all API routes
  app.use("/api/user", userRoutes);
  app.use("/api/emergency-contacts", emergencyContactRoutes);
  app.use("/api/medical-facilities", medicalFacilityRoutes);
  app.use("/api/emergency-requests", emergencyRequestRoutes);
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });
}