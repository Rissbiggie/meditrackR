import { 
  type User, type InsertUser,
  type EmergencyContact, type InsertEmergencyContact,
  type MedicalFacility, type InsertMedicalFacility,
  type EmergencyRequest, type InsertEmergencyRequest, type UpdateEmergencyRequest
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from './controllers/userController';

// Memory session store
const MemoryStore = createMemoryStore(session);

// Define the storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAdminUsers(): Promise<User[]>;

  // Emergency contact methods
  getEmergencyContacts(userId: number): Promise<EmergencyContact[]>;
  getEmergencyContact(id: number): Promise<EmergencyContact | undefined>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  updateEmergencyContact(id: number, contact: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined>;
  deleteEmergencyContact(id: number): Promise<boolean>;

  // Medical facility methods
  getMedicalFacilities(): Promise<MedicalFacility[]>;
  getMedicalFacility(id: number): Promise<MedicalFacility | undefined>;
  createMedicalFacility(facility: InsertMedicalFacility): Promise<MedicalFacility>;
  getNearbyMedicalFacilities(latitude: string, longitude: string, radius: number): Promise<MedicalFacility[]>;

  // Emergency request methods
  getEmergencyRequests(): Promise<EmergencyRequest[]>;
  getEmergencyRequestsForUser(userId: number): Promise<EmergencyRequest[]>;
  getEmergencyRequest(id: number): Promise<EmergencyRequest | undefined>;
  createEmergencyRequest(request: InsertEmergencyRequest): Promise<EmergencyRequest>;
  updateEmergencyRequest(id: number, request: UpdateEmergencyRequest): Promise<EmergencyRequest | undefined>;
  deleteEmergencyRequest(id: number): Promise<boolean>;

  // Session store for auth
  sessionStore: any; // Using any here because the SessionStore type is not properly exported

  // Database initialization
  initializeDatabase(): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private emergencyContacts: EmergencyContact[] = [];
  private medicalFacilities: MedicalFacility[] = [];
  private emergencyRequests: EmergencyRequest[] = [];
  sessionStore: any;

  private nextIds = {
    users: 1,
    emergencyContacts: 1,
    medicalFacilities: 1,
    emergencyRequests: 1
  };

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    // Make sure we match the schema format
    const newUser: User = {
      id: this.nextIds.users++,
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name || '',
      phone: insertUser.phone || null,
      bloodType: insertUser.bloodType || null,
      allergies: insertUser.allergies || null,
      medicalConditions: insertUser.medicalConditions || null,
      isAdmin: insertUser.isAdmin || false,
      createdAt: now
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;

    const updatedUser = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date()
    };

    this.users[index] = updatedUser;
    return updatedUser;
  }

  async getAdminUsers(): Promise<User[]> {
    return this.users.filter(user => user.isAdmin);
  }

  // Emergency contact methods
  async getEmergencyContacts(userId: number): Promise<EmergencyContact[]> {
    return this.emergencyContacts.filter(contact => contact.userId === userId);
  }

  async getEmergencyContact(id: number): Promise<EmergencyContact | undefined> {
    return this.emergencyContacts.find(contact => contact.id === id);
  }

  async createEmergencyContact(insertContact: InsertEmergencyContact): Promise<EmergencyContact> {
    const newContact: EmergencyContact = {
      id: this.nextIds.emergencyContacts++,
      name: insertContact.name,
      phone: insertContact.phone,
      userId: insertContact.userId,
      relationship: insertContact.relationship || null
    };
    this.emergencyContacts.push(newContact);
    return newContact;
  }

  async updateEmergencyContact(id: number, contactData: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined> {
    const index = this.emergencyContacts.findIndex(contact => contact.id === id);
    if (index === -1) return undefined;

    const updatedContact = {
      ...this.emergencyContacts[index],
      ...contactData,
      updatedAt: new Date()
    };

    this.emergencyContacts[index] = updatedContact;
    return updatedContact;
  }

  async deleteEmergencyContact(id: number): Promise<boolean> {
    const initialLength = this.emergencyContacts.length;
    this.emergencyContacts = this.emergencyContacts.filter(contact => contact.id !== id);
    return initialLength > this.emergencyContacts.length;
  }

  // Medical facility methods
  async getMedicalFacilities(): Promise<MedicalFacility[]> {
    return this.medicalFacilities;
  }

  async getMedicalFacility(id: number): Promise<MedicalFacility | undefined> {
    return this.medicalFacilities.find(facility => facility.id === id);
  }

  async createMedicalFacility(insertFacility: InsertMedicalFacility): Promise<MedicalFacility> {
    const newFacility: MedicalFacility = {
      id: this.nextIds.medicalFacilities++,
      name: insertFacility.name,
      type: insertFacility.type,
      address: insertFacility.address || null,
      phone: insertFacility.phone || null,
      latitude: insertFacility.latitude,
      longitude: insertFacility.longitude,
      openingHours: insertFacility.openingHours || null
    };
    this.medicalFacilities.push(newFacility);
    return newFacility;
  }

  // Get nearby medical facilities based on haversine distance
  async getNearbyMedicalFacilities(latitude: string, longitude: string, radius: number): Promise<MedicalFacility[]> {
    const facilities = await this.getMedicalFacilities();

    const lat1 = parseFloat(latitude);
    const lon1 = parseFloat(longitude);

    if (isNaN(lat1) || isNaN(lon1)) {
      return [];
    }

    return facilities.filter(facility => {
      const lat2 = parseFloat(facility.latitude);
      const lon2 = parseFloat(facility.longitude);

      if (isNaN(lat2) || isNaN(lon2)) {
        return false;
      }

      // Haversine formula for distance calculation
      const R = 6371; // Earth radius in km
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const distance = R * c; // Distance in km

      return distance <= radius;
    });
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Emergency request methods
  async getEmergencyRequests(): Promise<EmergencyRequest[]> {
    return [...this.emergencyRequests].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async getEmergencyRequestsForUser(userId: number): Promise<EmergencyRequest[]> {
    return this.emergencyRequests
      .filter(request => request.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getEmergencyRequest(id: number): Promise<EmergencyRequest | undefined> {
    return this.emergencyRequests.find(request => request.id === id);
  }

  async createEmergencyRequest(insertRequest: InsertEmergencyRequest): Promise<EmergencyRequest> {
    const now = new Date();
    const newRequest: EmergencyRequest = {
      id: this.nextIds.emergencyRequests++,
      userId: insertRequest.userId,
      status: insertRequest.status || 'pending',
      location: insertRequest.location,
      description: insertRequest.description || null,
      medicalFacilityId: insertRequest.medicalFacilityId || null,
      assignedResponder: insertRequest.assignedResponder || null,
      createdAt: now,
      updatedAt: now
    };
    this.emergencyRequests.push(newRequest);
    return newRequest;
  }

  async updateEmergencyRequest(id: number, requestData: UpdateEmergencyRequest): Promise<EmergencyRequest | undefined> {
    const index = this.emergencyRequests.findIndex(request => request.id === id);
    if (index === -1) return undefined;

    const updatedRequest = {
      ...this.emergencyRequests[index],
      ...requestData,
      updatedAt: new Date()
    };

    this.emergencyRequests[index] = updatedRequest;
    return updatedRequest;
  }

  async deleteEmergencyRequest(id: number): Promise<boolean> {
    const initialLength = this.emergencyRequests.length;
    this.emergencyRequests = this.emergencyRequests.filter(request => request.id !== id);
    return initialLength > this.emergencyRequests.length;
  }

  // Initialize with sample data
  async initializeDatabase(): Promise<void> {
    try {
      console.log('Initializing in-memory database with sample data...');

      // Skip initialization if we already have data
      if (this.medicalFacilities.length > 0) {
        console.log('In-memory database already contains data');
        return;
      }

      // Add sample facilities
      const facilities: InsertMedicalFacility[] = [
        {
          name: "City General Hospital",
          type: "hospital",
          address: "123 Main St, Cityville",
          phone: "123-456-7890",
          latitude: "40.7128",
          longitude: "-74.0060",
          openingHours: "24/7",
        },
        {
          name: "Riverside Medical Center",
          type: "hospital",
          address: "456 River Rd, Cityville",
          phone: "123-456-7891",
          latitude: "40.7135",
          longitude: "-74.0045",
          openingHours: "24/7",
        },
        {
          name: "Downtown Urgent Care",
          type: "clinic",
          address: "789 Center Ave, Cityville",
          phone: "123-456-7892",
          latitude: "40.7140",
          longitude: "-74.0070",
          openingHours: "8:00 AM - 10:00 PM",
        },
        {
          name: "Community Pharmacy",
          type: "pharmacy",
          address: "321 Oak St, Cityville",
          phone: "123-456-7893",
          latitude: "40.7120",
          longitude: "-74.0080",
          openingHours: "8:00 AM - 9:00 PM",
        }
      ];

      for (const facility of facilities) {
        await this.createMedicalFacility(facility);
      }

      // Initialize admin users
      await this.createUser({ username: "Gloria@123", password: await hashPassword("Gloria@123"), name: "Gloria", isAdmin: true });
      await this.createUser({ username: "Lewis@123", password: await hashPassword("Lewis@123"), name: "Lewis", isAdmin: true });
      await this.createUser({ username: "nolove@sch", password: await hashPassword("Riss.Ochenya58"), name: "Nolove", isAdmin: true });


      console.log('In-memory database initialized successfully');
    } catch (error: any) {
      console.error('Error initializing in-memory database:', error);
      throw new Error('In-memory database initialization failed: ' + error.message);
    }
  }
}

// Export an instance of the in-memory storage
export const storage = new MemStorage();