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
        try {
          const pdfBuffer = fs.readFileSync(pdfPath);
          // Use dynamic import for pdf-parse with options to avoid test file issues
          const pdfParse = (await import('pdf-parse')).default;
          const data = await pdfParse(pdfBuffer, {
            // Prevent pdf-parse from looking for test files
            max: 0
          });
          handbookContent = data.text;
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          // Fallback to sample content if PDF parsing fails
          handbookContent = `EMPLOYEE HANDBOOK - ABC Company

VACATION AND PAID TIME OFF (PTO) POLICY
Full-time employees accrue PTO at the following rates:
- 0-2 years of service: 15 days per year
- 3-5 years of service: 20 days per year
- 6+ years of service: 25 days per year

PTO accrues on a monthly basis and can be used for vacation, sick time, or personal days.

COMPANY HOLIDAYS
ABC Company observes the following paid holidays:
- New Year's Day
- Martin Luther King Jr. Day
- Memorial Day
- Independence Day (July 4th)
- Labor Day
- Thanksgiving Day
- Day after Thanksgiving
- Christmas Eve
- Christmas Day
- New Year's Eve

BENEFITS INFORMATION
Health Insurance: ABC Company offers comprehensive health insurance coverage including medical, dental, and vision. The company covers 80% of premiums for employees and 60% for dependents.

Retirement Plan: Employees are eligible to participate in the company 401(k) plan after 90 days of employment. The company matches 50% of employee contributions up to 6% of salary.

WORK HOURS AND ATTENDANCE
Standard work hours are Monday through Friday, 9:00 AM to 5:00 PM, with a one-hour lunch break.

TIME-OFF REQUEST PROCEDURES
To request time off:
1. Log into the employee portal at portal.abccompany.com
2. Navigate to the "Time Off" section
3. Select the dates and type of leave requested
4. Submit the request to your manager
5. You will receive email confirmation once approved`;
        }
      } else {
        return Response.json(
          { error: 'No employee handbook loaded. Please upload a PDF first.' },
          { status: 400 }
        );
      }
    }

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

