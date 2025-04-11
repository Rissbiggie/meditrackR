// Script to test database connection and schema
console.log('Testing database connection...');

// Import the pg module to test PostgreSQL connection
const { Pool } = require('pg');

// Get the DATABASE_URL from environment or use a default for testing
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/meditrack';

// Create a connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function testConnection() {
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // Test a simple query to get PostgreSQL version
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // List all tables in the current schema
    console.log('\nListing all tables:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tables.rows.length === 0) {
      console.log('No tables found. Please run db-push.js to create tables.');
    } else {
      tables.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('\nDatabase test completed successfully.');
    } else {
      console.error('\nDatabase test failed.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });