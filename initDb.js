import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
// No need to import schema directly since we're running raw SQL

async function main() {
  console.log('Initializing database...');
  
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is missing');
    process.exit(1);
  }
  
  try {
    // Connect to the database
    const queryClient = postgres(process.env.DATABASE_URL);
    const db = drizzle(queryClient);
    
    console.log('Connected to database');
    
    // Create tables if they don't exist
    await db.execute(`
      -- Create users table if not exists
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL,
        full_name VARCHAR(100),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create emergency_contacts table if not exists
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        relationship VARCHAR(50),
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create medical_facilities table if not exists
      CREATE TABLE IF NOT EXISTS medical_facilities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address VARCHAR(255) NOT NULL,
        city VARCHAR(50) NOT NULL,
        state VARCHAR(50),
        country VARCHAR(50) NOT NULL,
        postal_code VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(100),
        website VARCHAR(255),
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        facility_type VARCHAR(50) NOT NULL,
        is_24_hours BOOLEAN DEFAULT FALSE,
        services TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create emergency_requests table if not exists
      CREATE TABLE IF NOT EXISTS emergency_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        description TEXT,
        location JSONB NOT NULL,
        medical_facility_id INTEGER REFERENCES medical_facilities(id),
        assigned_responder INTEGER REFERENCES users(id),
        response_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
      );
    `);
    
    console.log('Database tables created successfully');
    
    // Create a session table for express-session with connect-pg-simple
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    
    console.log('Session table created successfully');
    
    // Insert sample medical facilities if they don't exist
    await db.execute(`
      INSERT INTO medical_facilities (name, address, type, phone, latitude, longitude, opening_hours)
      VALUES 
      ('City General Hospital', '123 Main St, Metropolis, NY 10001', 'Hospital', '555-1234', '40.7128', '-74.0060', '24/7'),
      ('Westside Urgent Care', '456 West Blvd, Metropolis, NY 10002', 'Urgent Care', '555-5678', '40.7200', '-74.0100', '24/7'),
      ('Eastside Medical Center', '789 East Ave, Metropolis, NY 10003', 'Hospital', '555-9012', '40.7300', '-73.9800', '24/7')
      ON CONFLICT (id) DO NOTHING;
    `);
    
    console.log('Sample medical facilities added');
    
    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main();