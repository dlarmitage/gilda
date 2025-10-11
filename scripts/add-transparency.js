/**
 * Migration script to add brand_transparency column to users table
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function addTransparencyColumn() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Adding brand_transparency column to users table...');
    
    // Add brand_transparency column if it doesn't exist
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS brand_transparency DECIMAL(3,2) DEFAULT 0.50
    `;
    
    console.log('✅ Successfully added brand_transparency column to users table');
    console.log('Default transparency: 0.50 (50%)');
    
  } catch (error) {
    console.error('❌ Error adding brand_transparency column:', error);
    throw error;
  }
}

addTransparencyColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

