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
  // Deactivate previous PDFs for this user
  await query`UPDATE pdf_uploads SET is_active = false WHERE user_id = ${userId}`;
  
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
    SELECT id, filename, original_filename, file_size, is_active, created_at 
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

export default sql;

