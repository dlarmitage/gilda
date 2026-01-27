import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getActivePDF, getUserPDFs } from '../../../lib/db';

import { shareLinks } from '../../../lib/shared-store';

export async function POST(request) {
  try {
    const { pdfContent, pdfMetadata, documents, userId, brandColor, brandTransparency } = await request.json();

    let finalDocuments = documents;
    let finalPdfContent = pdfContent;

    // If documents are missing but userId is provided, fetch from DB
    if ((!finalDocuments || finalDocuments.length === 0) && userId) {
      console.log('Fetching documents from DB for share link, userId:', userId);
      const dbDocs = await getUserPDFs(userId);
      if (dbDocs && dbDocs.length > 0) {
        finalDocuments = dbDocs.map(doc => ({
          id: doc.id,
          filename: doc.original_filename,
          content: doc.content_text,
          size: doc.file_size
        }));
      }
    }

    if (!finalDocuments || finalDocuments.length === 0) {
      return NextResponse.json(
        { error: 'At least one document is required to create share link' },
        { status: 400 }
      );
    }

    // Generate combined content from documents if finalPdfContent is not provided
    if (!finalPdfContent && finalDocuments) {
      finalPdfContent = finalDocuments
        .filter(doc => doc.content && doc.content.trim().length > 0)
        .map(doc => `=== ${doc.filename} ===\n\n${doc.content}\n\n`)
        .join('');
    }

    // Safety: Limit stored content size (OpenAI token limits + memory safety)
    const MAX_CHARS = 300000;
    if (finalPdfContent && finalPdfContent.length > MAX_CHARS) {
      finalPdfContent = finalPdfContent.substring(0, MAX_CHARS) + "\n\n[Content truncated for shared view size limits]";
    }

    // Generate unique share ID
    const shareId = nanoid(12);

    // Store the shared content
    const shareData = {
      id: shareId,
      pdfContent: finalPdfContent,
      pdfMetadata,
      documents: finalDocuments,
      userId,
      brandColor: brandColor || '#4880db',
      brandTransparency: brandTransparency !== undefined ? parseFloat(brandTransparency) : 0.5,
      createdAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessed: null
    };

    shareLinks.set(shareId, shareData);

    // Determine the base URL dynamically from the request headers
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    // Return the share link
    const shareUrl = `${baseUrl}/shared/${shareId}`;

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
      brandColor: shareData.brandColor || '#4880db',
      brandTransparency: shareData.brandTransparency !== undefined ? shareData.brandTransparency : 0.5,
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
