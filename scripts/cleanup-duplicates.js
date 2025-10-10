const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanupDuplicates() {
  console.log('Starting cleanup of duplicate documents...');
  
  try {
    // Get all documents for the user
    const userId = '1b16d379-808e-4566-bcc1-7f764ec47f62';
    
    console.log('Current documents in database:');
    const allDocs = await pool.query(`
      SELECT id, filename, original_filename, created_at, is_active
      FROM pdf_uploads 
      WHERE user_id = $1
      ORDER BY created_at ASC
    `, [userId]);
    
    console.table(allDocs.rows);
    
    if (allDocs.rows.length <= 1) {
      console.log('No duplicates found. Exiting.');
      return;
    }
    
    // Keep only the most recent document, delete the rest
    const documentsToKeep = allDocs.rows.slice(-1); // Keep the last (most recent) one
    const documentsToDelete = allDocs.rows.slice(0, -1); // Delete all others
    
    console.log(`Keeping document ID ${documentsToKeep[0].id} (most recent)`);
    console.log(`Deleting ${documentsToDelete.length} duplicate documents:`, documentsToDelete.map(d => d.id));
    
    // Delete the duplicates
    const deleteIds = documentsToDelete.map(d => d.id);
    if (deleteIds.length > 0) {
      await pool.query(`
        DELETE FROM pdf_uploads 
        WHERE id = ANY($1)
      `, [deleteIds]);
      
      console.log(`Successfully deleted ${deleteIds.length} duplicate documents`);
    }
    
    // Verify cleanup
    const remainingDocs = await pool.query(`
      SELECT id, filename, original_filename, created_at, is_active
      FROM pdf_uploads 
      WHERE user_id = $1
      ORDER BY created_at ASC
    `, [userId]);
    
    console.log('Remaining documents after cleanup:');
    console.table(remainingDocs.rows);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await pool.end();
  }
}

cleanupDuplicates();
