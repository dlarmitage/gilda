import { NextResponse } from 'next/server';
import { getUserPDFs, createPDFUpload, getActivePDF } from '../../../lib/db';

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

    if (!userId || !documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: 'User ID and documents array are required' },
        { status: 400 }
      );
    }

    // Deactivate all existing PDFs for this user first
    await Promise.all(documents.map(async (doc) => {
      await createPDFUpload(
        userId,
        doc.filename,
        doc.filename,
        doc.content,
        doc.size || doc.content.length
      );
    }));

    return NextResponse.json({
      message: 'Documents saved successfully',
      count: documents.length
    });

  } catch (error) {
    console.error('Error saving documents:', error);
    return NextResponse.json(
      { error: 'Failed to save documents' },
      { status: 500 }
    );
  }
}
