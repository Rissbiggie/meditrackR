import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertEmergencyContactSchema } from "@shared/schema";
import { z } from "zod";

/**
 * Get all emergency contacts for the current user
 */
export async function getEmergencyContacts(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const userId = req.user!.id;
    const contacts = await storage.getEmergencyContacts(userId);
    res.json(contacts);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new emergency contact for the current user
 */
export async function createEmergencyContact(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const userId = req.user!.id;
    const contactData = insertEmergencyContactSchema.parse({
      ...req.body,
      userId,
    });
    
    const contact = await storage.createEmergencyContact(contactData);
    res.status(201).json(contact);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid data", errors: error.errors });
    } else {
      next(error);
    }
  }
}

/**
 * Update an existing emergency contact
 */
export async function updateEmergencyContact(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const userId = req.user!.id;
    const contactId = parseInt(req.params.id);
    
    // Check if contact exists and belongs to user
    const existingContact = await storage.getEmergencyContact(contactId);
    if (!existingContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    if (existingContact.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to update this contact" });
    }
    
    const updateData = req.body;
    const updatedContact = await storage.updateEmergencyContact(contactId, updateData);
    res.json(updatedContact);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an emergency contact
 */
export async function deleteEmergencyContact(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const userId = req.user!.id;
    const contactId = parseInt(req.params.id);
    
    // Check if contact exists and belongs to user
    const existingContact = await storage.getEmergencyContact(contactId);
    if (!existingContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    if (existingContact.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this contact" });
    }
    
    await storage.deleteEmergencyContact(contactId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}