import OpenAI from 'openai';
import { searchPDFChunks } from '../../../lib/db';
import { generateEmbeddings } from '../../../lib/embeddings';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        const { itemIdentifier, userId } = await request.json();

        if (!itemIdentifier || !userId) {
            return Response.json(
                { error: 'Identifier and User ID are required' },
                { status: 400 }
            );
        }

        // Use RAG to find the most relevant information about this specific identifier
        const queryEmbedding = await generateEmbeddings(`Detailed information about ${itemIdentifier}`);
        const relevantChunks = await searchPDFChunks(userId, queryEmbedding, 10);

        if (relevantChunks.length === 0) {
            return Response.json({ message: 'Information not found.' });
        }

        const context = relevantChunks
            .map(chunk => chunk.content)
            .join('\n\n---\n\n');

        const systemPrompt = `You are a helpful knowledge assistant. Provide a detailed summary about "${itemIdentifier}" based ONLY on the provided snippets. Include all relevant details, descriptions, and specifications found in the text.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Snippets from the document:\n${context}` }
            ],
            max_completion_tokens: 1000,
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
