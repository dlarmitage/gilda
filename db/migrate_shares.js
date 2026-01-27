require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function migrate() {
    const sql = neon(process.env.DATABASE_URL);

    console.log('Creating share_links table...');
    try {
        await sql`
      CREATE TABLE IF NOT EXISTS share_links (
        id VARCHAR(255) PRIMARY KEY,
        pdf_content TEXT,
        pdf_metadata JSONB,
        documents JSONB,
        user_id UUID,
        brand_color VARCHAR(7) DEFAULT '#4880db',
        brand_transparency DECIMAL(3,2) DEFAULT 0.50,
        access_count INTEGER DEFAULT 0,
        last_accessed TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log('Table created successfully.');
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
}

migrate();
