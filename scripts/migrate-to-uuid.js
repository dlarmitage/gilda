require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateToUUID() {
  try {
    console.log('Starting migration to UUID...');
    
    // Enable UUID extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Drop existing tables to recreate with UUID (this will lose existing data)
    console.log('Dropping existing tables...');
    await pool.query('DROP TABLE IF EXISTS chat_history CASCADE');
    await pool.query('DROP TABLE IF EXISTS pdf_uploads CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    
    // Create users table with UUID
    console.log('Creating users table with UUID...');
    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create pdf_uploads table with UUID foreign key
    console.log('Creating pdf_uploads table...');
    await pool.query(`
      CREATE TABLE pdf_uploads (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        content_text TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type VARCHAR(100) DEFAULT 'application/pdf',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create chat_history table with UUID foreign key
    console.log('Creating chat_history table...');
    await pool.query(`
      CREATE TABLE chat_history (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pdf_upload_id INTEGER REFERENCES pdf_uploads(id) ON DELETE SET NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    console.log('Creating indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pdf_uploads_user_id ON pdf_uploads(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pdf_uploads_is_active ON pdf_uploads(is_active)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_chat_history_pdf_upload_id ON chat_history(pdf_upload_id)');
    
    // Create update trigger function
    console.log('Creating update trigger...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    // Create triggers
    await pool.query(`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    
    await pool.query(`
      CREATE TRIGGER update_pdf_uploads_updated_at BEFORE UPDATE ON pdf_uploads
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateToUUID();
