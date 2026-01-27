import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createShareLink, getShareLink } from '../../../lib/db';

export async function POST(request) {
  try {
    const { pdfContent, pdfMetadata, documents, userId, brandColor, brandTransparency } = await request.json();

    let finalDocuments = documents;
    let finalPdfContent = pdfContent;

    // Generate combined content from documents if finalPdfContent is not provided
    if (!finalPdfContent && finalDocuments) {
      finalPdfContent = finalDocuments
        .filter(doc => doc.content && doc.content.trim().length > 0)
        .map(doc => `=== ${doc.filename} ===\n\n${doc.content}\n\n`)
        .join('');
    }

    // Safety: Limit stored content size
    const MAX_CHARS = 300000;
    if (finalPdfContent && finalPdfContent.length > MAX_CHARS) {
      finalPdfContent = finalPdfContent.substring(0, MAX_CHARS) + "\n\n[Content truncated for shared view size limits]";
    }

    // Generate unique share ID
    const shareId = nanoid(12);

    // Store the shared content in the database
    const shareData = {
      pdfContent: finalPdfContent,
      pdfMetadata: pdfMetadata || {},
      documents: finalDocuments || [],
      userId,
      brandColor: brandColor || '#4880db',
      brandTransparency: brandTransparency !== undefined ? parseFloat(brandTransparency) : 0.5
    };

    await createShareLink(shareId, shareData);

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

    const shareData = await getShareLink(shareId);

    if (!shareData) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json(shareData);

  } catch (error) {
    console.error('Error retrieving share link:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve share link' },
      { status: 500 }
    );
  }
}
