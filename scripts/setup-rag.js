const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function setupRAG() {
    console.log('🚀 Setting up RAG support in Postgres...');

    try {
        // 1. Enable pgvector extension
        console.log('🔹 Enabling pgvector extension...');
        await sql`CREATE EXTENSION IF NOT EXISTS vector`;

        // 2. Create pdf_chunks table
        console.log('🔹 Creating pdf_chunks table...');
        await sql`
      CREATE TABLE IF NOT EXISTS pdf_chunks (
        id SERIAL PRIMARY KEY,
        pdf_upload_id INTEGER REFERENCES pdf_uploads(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding vector(1536),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        // 3. Create index for vector search
        console.log('🔹 Creating HNSW index for vector search...');
        // Note: HNSW is generally better for performance than IVFFlat
        await sql`
      CREATE INDEX IF NOT EXISTS idx_pdf_chunks_embedding 
      ON pdf_chunks USING hnsw (embedding vector_cosine_ops)
    `;

        console.log('✅ RAG setup complete!');
    } catch (error) {
        console.error('❌ Error setting up RAG:', error);
        process.exit(1);
    }
}

setupRAG();
