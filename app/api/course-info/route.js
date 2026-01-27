import OpenAI from 'openai';
import { searchPDFChunks } from '../../../lib/db';
import { generateEmbeddings } from '../../../lib/embeddings';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        const { courseCode, userId } = await request.json();

        if (!courseCode || !userId) {
            return Response.json(
                { error: 'Course code and User ID are required' },
                { status: 400 }
            );
        }

        // Use RAG to find the most relevant information about this specific course code
        const queryEmbedding = await generateEmbeddings(`Information about course ${courseCode}`);
        const relevantChunks = await searchPDFChunks(userId, queryEmbedding, 10);

        if (relevantChunks.length === 0) {
            return Response.json({ message: 'Course information not found.' });
        }

        const context = relevantChunks
            .map(chunk => chunk.content)
            .join('\n\n---\n\n');

        const systemPrompt = `You are a helpful academic advisor. Provide a detailed summary of the course ${courseCode} based ONLY on the provided snippets from the course catalog. Include description, credits, prerequisites, and any other relevant details if found.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Snippets from catalog:\n${context}` }
            ],
            max_completion_tokens: 800,
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
