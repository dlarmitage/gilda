import { neon } from '@neondatabase/serverless';

// Initialize Neon serverless connection
const sql = neon(process.env.DATABASE_URL);

/**
 * Execute a SQL query using Neon's tagged template literal syntax
 * Note: Neon requires using template literals, not parameterized queries
 */
export async function query(template, ...params) {
  try {
    // For Neon, we need to use their tagged template literal syntax
    const result = await sql(template, ...params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  const result = await query`SELECT * FROM users WHERE email = ${email}`;
  return result[0] || null;
}

/**
 * Create a new user
 */
export async function createUser(email, passwordHash, name = null, userId = null) {
  const result = await query`
    INSERT INTO users (id, email, password_hash, name) 
    VALUES (${userId || 'gen_random_uuid()'}, ${email}, ${passwordHash}, ${name}) 
    RETURNING id, email, name, created_at
  `;
  return result[0];
}

/**
 * Get user by ID
 */
export async function getUserById(id) {
  const result = await query`SELECT id, email, name, created_at FROM users WHERE id = ${id}`;
  return result[0] || null;
}

/**
 * Create a PDF upload record
 */
export async function createPDFUpload(userId, filename, originalFilename, contentText, fileSize) {
  // Insert new PDF
  const result = await query`
    INSERT INTO pdf_uploads (user_id, filename, original_filename, content_text, file_size, is_active) 
    VALUES (${userId}, ${filename}, ${originalFilename}, ${contentText}, ${fileSize}, true) 
    RETURNING id, filename, original_filename, file_size, created_at
  `;
  return result[0];
}

/**
 * Get active PDF for a user
 */
export async function getActivePDF(userId) {
  const result = await query`
    SELECT * FROM pdf_uploads 
    WHERE user_id = ${userId} AND is_active = true 
    ORDER BY created_at DESC LIMIT 1
  `;
  return result[0] || null;
}

/**
 * Get all PDFs for a user
 */
export async function getUserPDFs(userId) {
  return await query`
    SELECT id, filename, original_filename, content_text, file_size, is_active, created_at 
    FROM pdf_uploads 
    WHERE user_id = ${userId} 
    ORDER BY created_at DESC
  `;
}

/**
 * Save chat message
 */
export async function saveChatMessage(userId, pdfUploadId, role, content) {
  const result = await query`
    INSERT INTO chat_history (user_id, pdf_upload_id, role, content) 
    VALUES (${userId}, ${pdfUploadId}, ${role}, ${content}) 
    RETURNING id
  `;
  return result[0];
}

/**
 * Get chat history for a user
 */
export async function getChatHistory(userId, pdfUploadId = null, limit = 50) {
  let result;

  if (pdfUploadId) {
    result = await query`
      SELECT role, content, created_at 
      FROM chat_history 
      WHERE user_id = ${userId} AND pdf_upload_id = ${pdfUploadId}
      ORDER BY created_at DESC LIMIT ${limit}
    `;
  } else {
    result = await query`
      SELECT role, content, created_at 
      FROM chat_history 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT ${limit}
    `;
  }

  return result.reverse(); // Return in chronological order
}

/**
 * Save chunks for a PDF
 */
export async function savePDFChunks(pdfUploadId, chunks, embeddings) {
  try {
    // Bulk insert chunks for significantly better performance
    // format: (pdf_upload_id, content, embedding)
    const batchSize = 25;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const chunkBatch = chunks.slice(i, i + batchSize);
      const embeddingBatch = embeddings.slice(i, i + batchSize);

      // We'll use a transaction/single query for each batch
      // Since Neon's serverless driver handles tagged templates, we can't easily dynamic-generate
      // the values array for a bulk insert with a variable amount of items via the tagged template safely.
      // However, we can use the traditional sql() syntax if needed, but for simplicity and safety,
      // we'll use a single query with multiple rows if the driver supports it, or stick to Promise.all 
      // but with a larger pool.

      // Re-implementing with a more efficient Promise.all pattern for the batch
      await Promise.all(chunkBatch.map((content, j) => {
        const embeddingStr = `[${embeddingBatch[j].join(',')}]`;
        return query`
          INSERT INTO pdf_chunks (pdf_upload_id, content, embedding)
          VALUES (${pdfUploadId}, ${content}, ${embeddingStr}::vector)
        `;
      }));
    }

    return true;
  } catch (error) {
    console.error('Error saving PDF chunks:', error);
    throw error;
  }
}

/**
 * Search for relevant chunks using vector similarity
 */
export async function searchPDFChunks(userId, queryEmbedding, limit = 5) {
  try {
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // We search across all active PDFs for the user
    // Using cosine distance (<=>) which works best with embeddings
    const result = await query`
      SELECT c.content, 
             c.pdf_upload_id, 
             u.original_filename,
             1 - (c.embedding <=> ${embeddingStr}::vector) as similarity
      FROM pdf_chunks c
      JOIN pdf_uploads u ON c.pdf_upload_id = u.id
      WHERE u.user_id = ${userId} AND u.is_active = true
      ORDER BY c.embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;

    return result;
  } catch (error) {
    console.error('Error searching PDF chunks:', error);
    throw error;
  }
}

export default sql;

