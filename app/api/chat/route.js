import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { message, conversationHistory, pdfContent } = await request.json();

    if (!message) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let handbookContent = pdfContent;

    // If no PDF content provided, load the default PDF
    if (!handbookContent) {
      const pdfPath = path.join(process.cwd(), 'uploads', 'sample_employee_handbook.pdf');
      
      if (fs.existsSync(pdfPath)) {
        const pdfBuffer = fs.readFileSync(pdfPath);
        // Use dynamic import for pdf-parse with options to avoid test file issues
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(pdfBuffer, {
          // Prevent pdf-parse from looking for test files
          max: 0
        });
        handbookContent = data.text;
      } else {
        return Response.json(
          { error: 'No employee handbook loaded. Please upload a PDF first.' },
          { status: 400 }
        );
      }
    }

    // Build the system prompt
    const systemPrompt = `You are Gilda, a helpful virtual HR assistant. Your role is to answer questions ONLY based on the employee handbook provided below. 

IMPORTANT RULES:
- Only answer questions using information from the handbook
- If the handbook doesn't contain the answer, politely say so
- Never make up information or answer from general knowledge
- Be professional, friendly, and helpful
- Keep responses concise and relevant

EMPLOYEE HANDBOOK:
${handbookContent}

Remember: Only use the information from the handbook above to answer questions.`;

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
      message: assistantMessage,
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

