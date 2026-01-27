import OpenAI from 'openai';
import { searchPDFChunks, getShareLink } from '../../../lib/db';
import { generateEmbeddings } from '../../../lib/embeddings';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        const { searchQuery, userId, shareId } = await request.json();

        if (!searchQuery) {
            return Response.json(
                { error: 'Search query is required' },
                { status: 400 }
            );
        }

        let searchUserId = userId;
        if (!searchUserId && shareId) {
            const shareData = await getShareLink(shareId);
            searchUserId = shareData?.userId;
        }

        if (!searchUserId) {
            return Response.json(
                { error: 'User ID or Share ID is required' },
                { status: 400 }
            );
        }

        // Use RAG to find everything relevant to the specific search query
        console.log(`Performing deep dive RAG for: "${searchQuery}"`);
        const queryEmbedding = await generateEmbeddings(`Find all detailed information about: ${searchQuery}`);
        const relevantChunks = await searchPDFChunks(userId, queryEmbedding, 15); // Increased to 15 for deep dives

        if (relevantChunks.length === 0) {
            return Response.json({ details: `I couldn't find any specific information about "${searchQuery}" in the document.` });
        }

        const context = relevantChunks
            .map(chunk => chunk.content)
            .join('\n\n---\n\n');

        const systemPrompt = `You are Gilda's "Source Insight" specialist. Your task is to provide the EXACT, VERBATIM language and comprehensive details regarding: "${searchQuery}".
    
RULES:
1. Show the original language as it appears in source snippets.
2. Provide all specific details (codes, requirements, dates, etc.).
3. SEARCH RECURSION: If you mention another related policy, course code, or significant entity that exists in the document, format it as an interactive link: [**Name**](#lookup:Search Query).
   - Example: "Prerequisite: [**ANTH 2200**](#lookup:ANTH 2200 course details)"
4. Format with clear headings and bolded terms.
5. Only use the provided snippets.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Snippets from the document regarding "${searchQuery}":\n${context}` }
            ],
            max_completion_tokens: 1200,
        });

        return Response.json({
            details: completion.choices[0].message.content
        });

    } catch (error) {
        console.error('Error fetching course info:', error);
        return Response.json(
            { error: 'Failed to fetch course information' },
            { status: 500 }
        );
    }
}
