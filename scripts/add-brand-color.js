/**
 * Migration script to add brand_color column to users table
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function addBrandColorColumn() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Adding brand_color column to users table...');
    
    // Add brand_color column if it doesn't exist
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS brand_color VARCHAR(7) DEFAULT '#4880db'
    `;
    
    console.log('✅ Successfully added brand_color column to users table');
    console.log('Default brand color: #4880db (blue)');
    
  } catch (error) {
    console.error('❌ Error adding brand_color column:', error);
    throw error;
  }
}

addBrandColorColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

