import { NextResponse } from 'next/server';
import { getUserPDFs, createPDFUpload, getActivePDF, getUserById, createUser, query } from '../../../lib/db';

// GET - Retrieve user's documents
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('GET /api/documents - userId:', userId);

    if (!userId) {
      console.log('GET /api/documents - No userId provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('GET /api/documents - Calling getUserPDFs with userId:', userId);
    const documents = await getUserPDFs(userId);
    console.log('GET /api/documents - Raw documents from DB:', documents);
    
    // Format documents for frontend
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      filename: doc.original_filename,
      content: doc.content_text,
      size: doc.file_size,
      uploadedAt: doc.created_at,
      isActive: doc.is_active
    }));

    console.log('GET /api/documents - Formatted documents:', formattedDocuments);

    return NextResponse.json({
      documents: formattedDocuments,
      activeDocument: formattedDocuments.find(doc => doc.isActive) || null
    });

  } catch (error) {
    console.error('GET /api/documents - Error fetching documents:', error);
    console.error('GET /api/documents - Error details:', error.message);
    console.error('GET /api/documents - Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Save user's documents
export async function POST(request) {
  try {
    const { userId, documents } = await request.json();

    console.log('POST /api/documents - userId:', userId);
    console.log('POST /api/documents - documents:', documents);

    if (!userId || !documents || !Array.isArray(documents)) {
      console.log('POST /api/documents - Missing required fields:', { userId: !!userId, documents: !!documents, isArray: Array.isArray(documents) });
      return NextResponse.json(
        { error: 'User ID and documents array are required' },
        { status: 400 }
      );
    }

    console.log('POST /api/documents - Processing', documents.length, 'documents');

    // Ensure user exists in database (create if doesn't exist)
    let user = await getUserById(userId);
    if (!user) {
      console.log('POST /api/documents - User does not exist, creating user record');
      try {
        // Create user record with Neon Auth UUID as both id and email placeholder
        user = await createUser(`${userId}@neon-auth.local`, 'neon-auth-user', 'Neon Auth User', userId);
        console.log('POST /api/documents - User created:', user);
      } catch (userError) {
        console.error('POST /api/documents - Error creating user:', userError);
        return NextResponse.json(
          { error: 'Failed to create user record', details: userError.message },
          { status: 500 }
        );
      }
    } else {
      console.log('POST /api/documents - User exists:', user);
    }

    // DELETE ALL existing PDFs for this user first to prevent duplicates
    console.log('POST /api/documents - Deleting all existing PDFs for user to prevent duplicates');
    try {
      await query`
        DELETE FROM pdf_uploads 
        WHERE user_id = ${userId}
      `;
      console.log('POST /api/documents - All existing PDFs deleted');
    } catch (deleteError) {
      console.error('POST /api/documents - Error deleting existing PDFs:', deleteError);
      // Continue anyway - we'll try to insert new ones
    }

    // Insert new documents
    await Promise.all(documents.map(async (doc, index) => {
      console.log(`POST /api/documents - Processing document ${index + 1}:`, {
        filename: doc.filename,
        contentLength: doc.content ? doc.content.length : 0,
        size: doc.size
      });
      
      try {
        const result = await createPDFUpload(
          userId,
          doc.filename,
          doc.filename,
          doc.content,
          doc.size || doc.content.length
        );
        console.log(`POST /api/documents - Document ${index + 1} saved:`, result);
      } catch (docError) {
        console.error(`POST /api/documents - Error saving document ${index + 1}:`, docError);
        throw docError;
      }
    }));

    console.log('POST /api/documents - All documents saved successfully');

    return NextResponse.json({
      message: 'Documents saved successfully',
      count: documents.length
    });

  } catch (error) {
    console.error('POST /api/documents - Error saving documents:', error);
    console.error('POST /api/documents - Error details:', error.message);
    console.error('POST /api/documents - Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to save documents', details: error.message },
      { status: 500 }
    );
  }
}
