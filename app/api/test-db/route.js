import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not found in environment variables' },
        { status: 500 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Test basic connection
    console.log('Testing basic query...');
    const result = await sql`SELECT NOW() as current_time`;
    console.log('Basic query result:', result);

    // Test if tables exist
    console.log('Checking if tables exist...');
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'pdf_uploads', 'chat_history')
    `;
    console.log('Tables found:', tablesResult);

    // Test if pdf_uploads table has any data
    console.log('Checking pdf_uploads table...');
    const pdfCount = await sql`SELECT COUNT(*) as count FROM pdf_uploads`;
    console.log('PDF uploads count:', pdfCount);

    // Test with a specific user ID
    const testUserId = '1b16d379-808e-4566-bcc1-7f764ec47f62';
    console.log('Testing query with user ID:', testUserId);
    const userDocs = await sql`
      SELECT id, filename, original_filename, file_size, is_active, created_at 
      FROM pdf_uploads 
      WHERE user_id = ${testUserId} 
      ORDER BY created_at DESC
    `;
    console.log('User documents:', userDocs);

    return NextResponse.json({
      success: true,
      currentTime: result[0],
      tables: tablesResult,
      pdfCount: pdfCount[0],
      userDocuments: userDocs
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database test failed', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}
