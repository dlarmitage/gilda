import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embeddings for a given text or array of texts
 */
export async function generateEmbeddings(text) {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float",
        });

        if (Array.isArray(text)) {
            return response.data.map(item => item.embedding);
        }
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embeddings:', error);
        throw error;
    }
}

/**
 * Split text into chunks
 */
export function chunkText(text, chunkSize = 2000, overlap = 500) {
    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;

        // If not at the end of text, try to find a natural break point
        if (endIndex < text.length) {
            // Find the last period, newline, or space within the chunk
            const searchWindow = text.substring(startIndex, endIndex);
            const lastPeriod = searchWindow.lastIndexOf('.');
            const lastNewline = searchWindow.lastIndexOf('\n');
            const lastSpace = searchWindow.lastIndexOf(' ');

            const breakPoint = Math.max(lastPeriod, lastNewline, lastSpace);
            if (breakPoint > chunkSize * 0.5) {
                endIndex = startIndex + breakPoint + 1;
            }
        }

        chunks.push(text.substring(startIndex, endIndex).trim());
        startIndex = endIndex - overlap;

        // Safety check to prevent infinite loop
        if (overlap >= chunkSize) startIndex = endIndex;
    }

    return chunks.filter(c => c.length > 0);
}
