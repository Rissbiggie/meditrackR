import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { sendSuccess, sendError } from "../utils/apiResponse";

/**
 * Get all medical facilities
 */
export async function getAllMedicalFacilities(req: Request, res: Response, next: NextFunction) {
  try {
    const facilities = await storage.getMedicalFacilities();
    return sendSuccess(res, facilities, "Medical facilities retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific medical facility by ID
 */
export async function getMedicalFacilityById(req: Request, res: Response, next: NextFunction) {
  try {
    const facilityId = parseInt(req.params.id);
    if (isNaN(facilityId)) {
      return sendError(res, "Invalid facility ID", 400);
    }
    
    const facility = await storage.getMedicalFacility(facilityId);
    if (!facility) {
      return sendError(res, "Medical facility not found", 404);
    }
    
    return sendSuccess(res, facility, "Medical facility retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Get nearby medical facilities based on user's location
 */
export async function getNearbyMedicalFacilities(req: Request, res: Response, next: NextFunction) {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    
    if (!latitude || !longitude) {
      return sendError(res, "Latitude and longitude are required", 400);
    }
    
    if (typeof latitude !== 'string' || typeof longitude !== 'string') {
      return sendError(res, "Latitude and longitude must be strings", 400);
    }
    
    const parsedRadius = parseInt(radius as string);
    if (isNaN(parsedRadius) || parsedRadius <= 0) {
      return sendError(res, "Radius must be a positive number", 400);
    }
    
    const facilities = await storage.getNearbyMedicalFacilities(
      latitude, 
      longitude, 
      parsedRadius
    );
    
    return sendSuccess(res, facilities, "Nearby medical facilities retrieved successfully");
  } catch (error) {
    next(error);
  }
}