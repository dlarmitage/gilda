import { NextResponse } from 'next/server';
import { getUserPDFs, createPDFUpload, getActivePDF } from '../../../../lib/db';

// GET - Retrieve user's documents
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const documents = await getUserPDFs(userId);
    
    // Format documents for frontend
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      filename: doc.original_filename,
      content: doc.content_text,
      size: doc.file_size,
      uploadedAt: doc.created_at,
      isActive: doc.is_active
    }));

    return NextResponse.json({
      documents: formattedDocuments,
      activeDocument: formattedDocuments.find(doc => doc.isActive) || null
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
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
