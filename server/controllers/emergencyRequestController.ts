import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertEmergencyRequestSchema, updateEmergencyRequestSchema } from "@shared/schema";
import { sendSuccess, sendError } from "../utils/apiResponse";

/**
 * Get all emergency requests (admin only)
 */
export async function getAllEmergencyRequests(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return sendError(res, "Not authenticated", 401);
    }
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return sendError(res, "Unauthorized access", 403);
    }
    
    const requests = await storage.getEmergencyRequests();
    return sendSuccess(res, requests, "Emergency requests retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Get emergency requests for the current user
 */
export async function getUserEmergencyRequests(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return sendError(res, "Not authenticated", 401);
    }
    
    const userId = req.user.id;
    const requests = await storage.getEmergencyRequestsForUser(userId);
    return sendSuccess(res, requests, "User emergency requests retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific emergency request by ID
 */
export async function getEmergencyRequestById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return sendError(res, "Not authenticated", 401);
    }
    
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return sendError(res, "Invalid request ID", 400);
    }
    
    const request = await storage.getEmergencyRequest(requestId);
    if (!request) {
      return sendError(res, "Emergency request not found", 404);
    }
    
    // Users can only see their own requests unless they are admin
    if (request.userId !== req.user.id && !req.user.isAdmin) {
      return sendError(res, "Unauthorized access", 403);
    }
    
    return sendSuccess(res, request, "Emergency request retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new emergency request
 */
export async function createEmergencyRequest(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return sendError(res, "Not authenticated", 401);
    }
    
    // Validate request input
    const requestInput = insertEmergencyRequestSchema.safeParse(req.body);
    if (!requestInput.success) {
      return sendError(res, "Invalid request data", 400, requestInput.error);
    }
    
    // Associate with current user
    const newRequest = {
      ...requestInput.data,
      userId: req.user.id,
      status: "pending" // default status
    };
    
    const createdRequest = await storage.createEmergencyRequest(newRequest);
    
    return sendSuccess(res, createdRequest, "Emergency request created successfully", 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update an emergency request
 * Normal users can only update their own requests
 * Admin users can update any request including status changes
 */
export async function updateEmergencyRequest(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return sendError(res, "Not authenticated", 401);
    }
    
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return sendError(res, "Invalid request ID", 400);
    }
    
    // Get the existing request
    const existingRequest = await storage.getEmergencyRequest(requestId);
    if (!existingRequest) {
      return sendError(res, "Emergency request not found", 404);
    }
    
    // Users can only update their own requests unless they are admin
    if (existingRequest.userId !== req.user.id && !req.user.isAdmin) {
      return sendError(res, "Unauthorized access", 403);
    }
    
    // Validate update data
    const updateInput = updateEmergencyRequestSchema.safeParse(req.body);
    if (!updateInput.success) {
      return sendError(res, "Invalid update data", 400, updateInput.error);
    }
    
    // Normal users cannot change status
    if (!req.user.isAdmin && updateInput.data.status) {
      return sendError(res, "Unauthorized to change request status", 403);
    }
    
    // Update request
    const updatedRequest = await storage.updateEmergencyRequest(requestId, updateInput.data);
    if (!updatedRequest) {
      return sendError(res, "Failed to update emergency request", 500);
    }

    // Send email notification
    try {
      const user = await storage.getUser(existingRequest.userId);
      if (user && user.email) {
        await sendStatusUpdateEmail(
          user.email,
          updatedRequest.status,
          updatedRequest.description || "",
          updatedRequest.medicalFacilityId ? await storage.getMedicalFacility(updatedRequest.medicalFacilityId) : null
        );
      }
    } catch (error) {
      console.error("Failed to send status update email:", error);
      // Continue even if email fails
    }
    
    return sendSuccess(res, updatedRequest, "Emergency request updated successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an emergency request
 * Admin users can delete any request
 * Normal users can only delete their own requests
 */
export async function deleteEmergencyRequest(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return sendError(res, "Not authenticated", 401);
    }
    
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return sendError(res, "Invalid request ID", 400);
    }
    
    // Get the existing request
    const existingRequest = await storage.getEmergencyRequest(requestId);
    if (!existingRequest) {
      return sendError(res, "Emergency request not found", 404);
    }
    
    // Users can only delete their own requests unless they are admin
    if (existingRequest.userId !== req.user.id && !req.user.isAdmin) {
      return sendError(res, "Unauthorized access", 403);
    }
    
    const deleted = await storage.deleteEmergencyRequest(requestId);
    if (!deleted) {
      return sendError(res, "Failed to delete emergency request", 500);
    }
    
    return sendSuccess(res, null, "Emergency request deleted successfully");
  } catch (error) {
    next(error);
  }
}