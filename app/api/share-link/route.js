import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// In-memory storage for demo (in production, use database)
const shareLinks = new Map();

export async function POST(request) {
  try {
    const { pdfContent, pdfMetadata, documents, userId } = await request.json();

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'At least one document is required to create share link' },
        { status: 400 }
      );
    }
    
    // Generate combined content from documents if pdfContent is not provided
    let combinedContent = pdfContent;
    if (!combinedContent && documents) {
      combinedContent = documents
        .filter(doc => doc.content && doc.content.trim().length > 0)
        .map(doc => `=== ${doc.filename} ===\n\n${doc.content}\n\n`)
        .join('');
    }

    // Generate unique share ID
    const shareId = nanoid(12);
    
    // Store the shared content
    const shareData = {
      id: shareId,
      pdfContent: combinedContent,
      pdfMetadata,
      documents,
      userId,
      createdAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessed: null
    };

    shareLinks.set(shareId, shareData);

    // Return the share link
    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/shared/${shareId}`;

    return NextResponse.json({
      shareId,
      shareUrl,
      message: 'Share link created successfully'
    });

  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    const shareData = shareLinks.get(shareId);

    if (!shareData) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }

    // Update access statistics
    shareData.accessCount += 1;
    shareData.lastAccessed = new Date().toISOString();

    return NextResponse.json({
      shareId: shareData.id,
      pdfContent: shareData.pdfContent,
      pdfMetadata: shareData.pdfMetadata,
      documents: shareData.documents,
      createdAt: shareData.createdAt,
      accessCount: shareData.accessCount
    });

  } catch (error) {
    console.error('Error retrieving share link:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve share link' },
      { status: 500 }
    );
  }
}
