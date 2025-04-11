import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertUserSchema, loginSchema } from "@shared/schema";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Register a new user
 */
import { sendLoginNotification, sendWelcomeEmail } from '../utils/emailService';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate user input
    const userInput = insertUserSchema.safeParse(req.body);
    
    if (!userInput.success) {
      return sendError(res, "Invalid user data", 400, userInput.error);
    }

    // Send welcome email
    if (userInput.data.email) {
      await sendWelcomeEmail(userInput.data.email, userInput.data.username)
        .catch(error => console.error('Failed to send welcome email:', error));
    }
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userInput.data.username);
    
    if (existingUser) {
      return sendError(res, "Username already exists", 400);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userInput.data.password);
    
    // Create user with hashed password
    const user = await storage.createUser({
      ...userInput.data,
      password: hashedPassword
    });

    // Send welcome email
    if (userInput.data.email) {
      try {
        await sendWelcomeEmail(userInput.data.email, userInput.data.username);
        console.log('Welcome email sent successfully to:', userInput.data.email);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Continue with registration even if email fails
      }
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    // Log the user in
    req.login(user, (err) => {
      if (err) return next(err);
      return sendSuccess(res, userWithoutPassword, "User registered successfully", 201);
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return sendError(res, "Not authenticated", 401);
  }
  
  // Remove password from response
  const { password, ...userWithoutPassword } = req.user;
  
  return sendSuccess(res, userWithoutPassword, "User retrieved successfully");
}

/**
 * Get all admin users (accessible only by admins)
 */
export async function getAdminUsers(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return sendError(res, "Not authenticated", 401);
    }
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return sendError(res, "Unauthorized access", 403);
    }
    
    const adminUsers = await storage.getAdminUsers();
    
    // Remove passwords from response
    const adminsWithoutPasswords = adminUsers.map(admin => {
      const { password, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    });
    
    return sendSuccess(res, adminsWithoutPasswords, "Admin users retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return sendError(res, "Not authenticated", 401);
    }
    
    const userId = req.user.id;
    
    // Prevent updating username and password through this endpoint
    const { username, password, isAdmin, ...allowedUpdates } = req.body;
    
    // Update user
    const updatedUser = await storage.updateUser(userId, allowedUpdates);
    
    if (!updatedUser) {
      return sendError(res, "User not found", 404);
    }
    
    // Remove password from response
    const { password: userPassword, ...userWithoutPassword } = updatedUser;
    
    return sendSuccess(res, userWithoutPassword, "User profile updated successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Logout current user
 */
export function logout(req: Request, res: Response, next: NextFunction) {
  req.logout((err) => {
    if (err) return next(err);
    return sendSuccess(res, null, "User logged out successfully");
  });
}

/**
 * Set user as admin (for development purposes)
 */
export async function setUserAsAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return sendError(res, "Not authenticated", 401);
    }
    
    const userId = req.user.id;
    
    // Update user to be admin
    const userData = { isAdmin: true } as any;
    const updatedUser = await storage.updateUser(userId, userData);
    
    if (!updatedUser) {
      return sendError(res, "User not found", 404);
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    return sendSuccess(res, userWithoutPassword, "User has been set as admin");
  } catch (error) {
    next(error);
  }
}