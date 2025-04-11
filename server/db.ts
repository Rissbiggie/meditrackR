import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';

const { Pool } = pg;

// Initialize the PostgreSQL connection pool
// Parse the connection string directly or use environment variables
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use the connection string directly
  poolConfig = {
    connectionString: process.env.DATABASE_URL
  };
} else {
  // Use separate environment variables
  poolConfig = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: String(process.env.PGPASSWORD) // Ensure password is a string
  };
}

// Create the pool with error handling
const pool = new Pool(poolConfig);

// Add error handler for the pool
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Create a Drizzle instance with the pg pool
export const db = drizzle(pool, { schema });

// Export the pool for session store
export { pool };