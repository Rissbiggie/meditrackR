import express from "express";
import { 
  getEmergencyContacts, 
  createEmergencyContact, 
  updateEmergencyContact, 
  deleteEmergencyContact 
} from "../controllers/emergencyContactController";
import { isAuthenticated } from "../middleware/authMiddleware";

const router = express.Router();

// Get all emergency contacts for user - GET /api/emergency-contacts
router.get("/", isAuthenticated, getEmergencyContacts);

// Create a new emergency contact - POST /api/emergency-contacts
router.post("/", isAuthenticated, createEmergencyContact);

// Update an emergency contact - PUT /api/emergency-contacts/:id
router.put("/:id", isAuthenticated, updateEmergencyContact);

// Delete an emergency contact - DELETE /api/emergency-contacts/:id
router.delete("/:id", isAuthenticated, deleteEmergencyContact);

export default router;