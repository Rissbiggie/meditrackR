import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  medicalConditions: text("medical_conditions"),
  weight: text("weight"),
  bloodPressure: text("blood_pressure"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  relationship: text("relationship"),
});

export const medicalFacilities = pgTable("medical_facilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // hospital, clinic, pharmacy
  address: text("address"),
  phone: text("phone"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  openingHours: text("opening_hours"),
});

export const emergencyRequests = pgTable("emergency_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, processing, completed, canceled
  location: jsonb("location").notNull(), // { latitude, longitude }
  description: text("description"),
  medicalFacilityId: integer("medical_facility_id").references(() => medicalFacilities.id),
  assignedResponder: integer("assigned_responder").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema validation for user insertion
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  phone: true,
  bloodType: true,
  allergies: true,
  medicalConditions: true,
  isAdmin: true,
});

// Schema validation for emergency contact insertion
export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).pick({
  userId: true,
  name: true,
  phone: true,
  relationship: true,
});

// Schema validation for medical facility insertion
export const insertMedicalFacilitySchema = createInsertSchema(medicalFacilities).pick({
  name: true,
  type: true,
  address: true,
  phone: true,
  latitude: true,
  longitude: true,
  openingHours: true,
});

// Schema validation for emergency request insertion
export const insertEmergencyRequestSchema = createInsertSchema(emergencyRequests).pick({
  userId: true,
  status: true,
  location: true,
  description: true,
  medicalFacilityId: true,
  assignedResponder: true,
});

// Schema for updating emergency request status
export const updateEmergencyRequestSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "canceled"]),
  medicalFacilityId: z.number().optional(),
  assignedResponder: z.number().optional(),
  description: z.string().optional(),
});

// Define types for TypeScript
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;

export type InsertMedicalFacility = z.infer<typeof insertMedicalFacilitySchema>;
export type MedicalFacility = typeof medicalFacilities.$inferSelect;

export type InsertEmergencyRequest = z.infer<typeof insertEmergencyRequestSchema>;
export type EmergencyRequest = typeof emergencyRequests.$inferSelect;
export type UpdateEmergencyRequest = z.infer<typeof updateEmergencyRequestSchema>;

// Validation schema for login
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;
