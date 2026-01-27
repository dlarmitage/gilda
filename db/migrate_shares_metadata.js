require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function migrate() {
    const sql = neon(process.env.DATABASE_URL);

    console.log('Adding public_title and public_description to share_links...');
    try {
        await sql`
      ALTER TABLE share_links 
      ADD COLUMN IF NOT EXISTS public_title TEXT,
      ADD COLUMN IF NOT EXISTS public_description TEXT;
    `;
        console.log('Columns added successfully.');
    } catch (error) {
        console.error('Error migrating table:', error);
        process.exit(1);
    }
}

migrate();
