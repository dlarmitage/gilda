import { neon } from '@neondatabase/serverless';

// Initialize Neon serverless connection
const sql = neon(process.env.DATABASE_URL);

/**
 * Execute a SQL query using Neon's tagged template literal syntax
 * Note: Neon requires using template literals, not parameterized queries
 * This is a helper function that constructs the query properly
 */
export async function query(queryString, params = []) {
  try {
    // For Neon, we need to use their specific query method
    const result = await sql.query(queryString, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result[0] || null;
}

/**
 * Create a new user
 */
export async function createUser(email, passwordHash, name = null) {
  const result = await query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
    [email, passwordHash, name]
  );
  return result[0];
}

/**
 * Get user by ID
 */
export async function getUserById(id) {
  const result = await query(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [id]
  );
  return result[0] || null;
}

/**
 * Create a PDF upload record
 */
export async function createPDFUpload(userId, filename, originalFilename, contentText, fileSize) {
  // Deactivate previous PDFs for this user
  await query(
    'UPDATE pdf_uploads SET is_active = false WHERE user_id = $1',
    [userId]
  );
  
  // Insert new PDF
  const result = await query(
    `INSERT INTO pdf_uploads (user_id, filename, original_filename, content_text, file_size, is_active) 
     VALUES ($1, $2, $3, $4, $5, true) 
     RETURNING id, filename, original_filename, file_size, created_at`,
    [userId, filename, originalFilename, contentText, fileSize]
  );
  return result[0];
}

/**
 * Get active PDF for a user
 */
export async function getActivePDF(userId) {
  const result = await query(
    'SELECT * FROM pdf_uploads WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  return result[0] || null;
}

/**
 * Get all PDFs for a user
 */
export async function getUserPDFs(userId) {
  return await query(
    'SELECT id, filename, original_filename, file_size, is_active, created_at FROM pdf_uploads WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
}

/**
 * Save chat message
 */
export async function saveChatMessage(userId, pdfUploadId, role, content) {
  const result = await query(
    'INSERT INTO chat_history (user_id, pdf_upload_id, role, content) VALUES ($1, $2, $3, $4) RETURNING id',
    [userId, pdfUploadId, role, content]
  );
  return result[0];
}

/**
 * Get chat history for a user
 */
export async function getChatHistory(userId, pdfUploadId = null, limit = 50) {
  let queryStr = 'SELECT role, content, created_at FROM chat_history WHERE user_id = $1';
  let params = [userId];
  
  if (pdfUploadId) {
    queryStr += ' AND pdf_upload_id = $2';
    params.push(pdfUploadId);
  }
  
  queryStr += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
  params.push(limit);
  
  const result = await query(queryStr, params);
  return result.reverse(); // Return in chronological order
}

export default sql;

