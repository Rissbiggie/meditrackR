// Script to push database schema to PostgreSQL using Drizzle ORM
console.log('Pushing database schema to PostgreSQL...');

// Import required modules
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { exit } from 'process';

// Import schema - we'll use direct SQL statements instead of importing schema 
// since importing TypeScript modules directly can be problematic in Node
console.log('Using direct SQL statements for database schema');

// Get the DATABASE_URL from environment or use a default for testing
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  console.log('Please make sure the PostgreSQL database is configured correctly');
  process.exit(1);
}

async function pushSchema() {
  let client;
  try {
    console.log('Connecting to database...');
    // Create a PostgreSQL client
    client = postgres(DATABASE_URL, { max: 1 });
    
    // Test connection with a simple query
    await client`SELECT 1`;
    console.log('Database connection successful');
    
    // Create Drizzle instance with empty schema since we're using direct SQL
    const db = drizzle(client);
    
    console.log('Creating tables if they don\'t exist...');
    
    // Define SQL statements to create tables directly based on schema.ts
    const statements = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        blood_type VARCHAR(10),
        allergies TEXT,
        medical_conditions TEXT,
        is_admin BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )`,
      
      // Emergency contacts table
      `CREATE TABLE IF NOT EXISTS emergency_contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        relationship VARCHAR(50)
      )`,
      
      // Medical facilities table
      `CREATE TABLE IF NOT EXISTS medical_facilities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        latitude TEXT NOT NULL,
        longitude TEXT NOT NULL,
        opening_hours TEXT
      )`,
      
      // Emergency requests table
      `CREATE TABLE IF NOT EXISTS emergency_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        location JSONB NOT NULL,
        description TEXT,
        medical_facility_id INTEGER REFERENCES medical_facilities(id),
        assigned_responder INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )`,
      
      // Session table for authentication
      `CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )`
    ];
    
    // Execute each SQL statement
    for (const sql of statements) {
      try {
        await client.unsafe(sql);
        console.log('Table created or verified successfully');
      } catch (err) {
        console.error('Error executing SQL:', err.message);
        console.error('SQL statement:', sql);
        return false;
      }
    }
    
    // Create sample medical facilities if none exist
    const facilitiesCount = await client`SELECT COUNT(*) FROM medical_facilities`;
    
    if (parseInt(facilitiesCount[0].count) === 0) {
      console.log('Adding sample medical facilities...');
      
      try {
        await client`
          INSERT INTO medical_facilities (name, type, address, phone, latitude, longitude, opening_hours)
          VALUES 
            ('City General Hospital', 'hospital', '123 Main St, Cityville', '123-456-7890', '40.7128', '-74.0060', '24/7'),
            ('Riverside Medical Center', 'hospital', '456 River Rd, Cityville', '123-456-7891', '40.7135', '-74.0045', '24/7'),
            ('Downtown Urgent Care', 'clinic', '789 Center Ave, Cityville', '123-456-7892', '40.7140', '-74.0070', '8:00 AM - 10:00 PM'),
            ('Community Pharmacy', 'pharmacy', '321 Oak St, Cityville', '123-456-7893', '40.7120', '-74.0080', '8:00 AM - 9:00 PM')
        `;
        console.log('Sample medical facilities added successfully');
      } catch (err) {
        console.error('Error adding sample medical facilities:', err.message);
        // Continue even if adding samples fails
      }
    } else {
      console.log(`Found ${facilitiesCount[0].count} existing medical facilities, skipping sample data`);
    }
    
    console.log('Schema push completed successfully!');
    
    return true;
  } catch (error) {
    console.error('Error during schema push:', error.message);
    return false;
  } finally {
    // Release the client connection
    if (client) {
      console.log('Closing database connection...');
      await client.end();
    }
  }
}

pushSchema()
  .then(success => {
    if (success) {
      console.log('Database schema push completed.');
      process.exit(0);
    } else {
      console.error('Database schema push failed.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });