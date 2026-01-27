import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createShareLink, getShareLink } from '../../../lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // AI Generation of Public Title and Description
    let publicTitle = "Knowledge Base";
    let publicDescription = "An AI-powered assistant for your documents.";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional strategist. Your task is to generate a user-friendly, public-facing title and a 1-sentence description for a knowledge base based on the provided document content snippets. The title should be actionable (e.g., 'See Your Course Calendar' or 'Employee Handbook Helper') and the description should be helpful. Return ONLY a JSON object with 'title' and 'description' keys."
          },
          {
            role: "user",
            content: `Document Snippets:\n${finalPdfContent?.substring(0, 5000)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content);
      publicTitle = aiResponse.title;
      publicDescription = aiResponse.description;
    } catch (aiErr) {
      console.error("AI Meta Generation Error:", aiErr);
      // Fallback to filename if AI fails
      if (finalDocuments && finalDocuments.length > 0) {
        publicTitle = `Explore ${finalDocuments[0].filename.replace(/\s*\(Part\s*\d+\)/i, '')}`;
      }
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
      brandTransparency: brandTransparency !== undefined ? parseFloat(brandTransparency) : 0.5,
      publicTitle,
      publicDescription
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
