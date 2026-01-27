import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { getActivePDF, getUserPDFs, searchPDFChunks } from '../../../lib/db';
import { shareLinks } from '../../../lib/shared-store';
import { generateEmbeddings } from '../../../lib/embeddings';

export async function POST(request) {
  try {
    const { message, conversationHistory, pdfContent, userId, shareId } = await request.json();

    if (!message) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let handbookContent = pdfContent;


    // NEW RAG LOGIC: Search for relevant chunks in Postgres
    let relevantChunks = [];
    if (userId || shareId) {
      console.log('Performing vector search for message:', message);
      try {
        const queryEmbedding = await generateEmbeddings(message);
        // If it's a shared link, we might need a generic search or use a specific user's context
        // For now, if shareId is provided, we fetch the userId from shared store
        let searchUserId = userId;
        if (!searchUserId && shareId) {
          const shareData = shareLinks.get(shareId);
          searchUserId = shareData?.userId;
        }

        if (searchUserId) {
          relevantChunks = await searchPDFChunks(searchUserId, queryEmbedding, 15);
          console.log(`Found ${relevantChunks.length} relevant chunks via vector search`);
        }
      } catch (searchError) {
        console.error('Vector search failed, falling back to full context:', searchError);
      }
    }

    // Build the augmented content from chunks if found
    if (relevantChunks.length > 0) {
      handbookContent = relevantChunks
        .map(chunk => `[Source: ${chunk.original_filename}]\n${chunk.content}`)
        .join('\n\n---\n\n');
      console.log('Using augmented context from vector search, length:', handbookContent.length);
    } else if (!handbookContent && userId) {
      console.log('No pdfContent in request, fetching from DB for userId:', userId);
      const activePdf = await getActivePDF(userId);
      if (activePdf) {
        handbookContent = activePdf.content_text;
        console.log('Loaded PDF content from DB, length:', handbookContent.length);
      }
    } else if (!handbookContent && shareId) {
      console.log('No pdfContent in request, fetching from shared store for shareId:', shareId);
      const shareData = shareLinks.get(shareId);
      if (shareData) {
        handbookContent = shareData.pdfContent;
        console.log('Loaded PDF content from shared store, length:', handbookContent?.length);
      }
    }

    // Still no content, load the default PDF from disk
    if (!handbookContent) {
      // Try multiple possible paths for the PDF file
      const possiblePaths = [
        path.join(process.cwd(), 'uploads', 'sample_employee_handbook.pdf'),
        path.join(__dirname, '..', '..', '..', 'uploads', 'sample_employee_handbook.pdf'),
        path.join(process.cwd(), 'sample_employee_handbook.pdf'),
        path.join(__dirname, 'sample_employee_handbook.pdf')
      ];

      let pdfPath = null;
      console.log('Checking for PDF at possible paths:');
      for (const testPath of possiblePaths) {
        console.log('  Checking:', testPath, '- exists:', fs.existsSync(testPath));
        if (fs.existsSync(testPath)) {
          pdfPath = testPath;
          console.log('Found PDF at:', pdfPath);
          break;
        }
      }

      if (pdfPath) {
        try {
          const pdfBuffer = fs.readFileSync(pdfPath);
          console.log('PDF buffer size:', pdfBuffer.length);

          // Use dynamic import for pdf-parse
          const pdfParse = (await import('pdf-parse')).default;
          const data = await pdfParse(pdfBuffer);

          console.log('PDF parsing successful, text length:', data.text.length);
          console.log('PDF text preview:', data.text.substring(0, 200));

          handbookContent = data.text;
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          console.error('PDF parsing error details:', pdfError.message);
          // Fallback to sample content if PDF parsing fails
          handbookContent = `*** FALLBACK CONTENT - PDF PARSING FAILED ***
          
This is the hardcoded fallback content that should NOT be used if PDF parsing is working correctly.

The PDF parsing has failed and this fallback text is being used instead.

If you see this message, it means the PDF file could not be parsed properly.

TEST CONTENT:
- This is clearly fallback text
- The PDF parsing is not working
- Check the server logs for errors

DRESS CODE: This fallback content does NOT contain dress code information.`;
        }
      } else {
        return Response.json(
          { error: 'No employee handbook loaded. Please upload a PDF first.' },
          { status: 400 }
        );
      }
    }

    // Debug: Log which content is being used
    console.log('Using handbook content length:', handbookContent.length);

    // Safety check: Truncate content if it's too large for OpenAI token limits
    // GPT-4 Turbo has a 128k token limit. 1 token ~= 4 chars, so ~400k chars is a safe limit for content.
    // We'll use 300k chars to leave room for messages and history.
    const MAX_CHARS = 300000;
    if (handbookContent.length > MAX_CHARS) {
      console.warn(`Content too large (${handbookContent.length} chars), truncating to ${MAX_CHARS} chars`);
      handbookContent = handbookContent.substring(0, MAX_CHARS) + "\n\n[Content truncated due to size limits...]";
    }

    console.log('Content source:', handbookContent.includes('ABC Company') ? 'FALLBACK TEXT' : 'PDF CONTENT');

    // Build the system prompt
    const systemPrompt = `You are Gilda, a helpful virtual assistant. Your role is to answer questions ONLY based on the document provided below. 

IMPORTANT RULES:
- Only answer questions using information from the document
- If the document doesn't contain the answer, politely say so
- Never make up information or answer from general knowledge
- Be professional, friendly, and helpful
- Keep responses concise and relevant

DOCUMENT:
${handbookContent}

Remember: Only use the information from the document above to answer questions.`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages,
      max_completion_tokens: 1000,
    });

    const assistantMessage = completion.choices[0].message.content;

    return Response.json({
      response: assistantMessage,
      message: assistantMessage, // Keep both for compatibility
      conversationHistory: [
        ...(conversationHistory || []),
        { role: 'user', content: message },
        { role: 'assistant', content: assistantMessage }
      ]
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return Response.json(
      { error: 'Failed to process chat message', details: error.message },
      { status: 500 }
    );
  }
}
