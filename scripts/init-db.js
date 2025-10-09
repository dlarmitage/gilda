import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('📖 Reading schema file...');
    const schemaPath = join(__dirname, '..', 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    console.log('🏗️  Creating tables...');
    // Use query method for DDL statements
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    await pool.query(schema);
    await pool.end();
    
    console.log('✅ Database initialized successfully!');
    console.log('\nTables created:');
    console.log('  - users');
    console.log('  - pdf_uploads');
    console.log('  - chat_history');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();

