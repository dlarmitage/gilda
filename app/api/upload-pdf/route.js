export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf');

    if (!file) {
      return Response.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type || !file.type.includes('pdf')) {
      return Response.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // For now, return a success response with placeholder content
    // This allows the upload to work while we resolve the pdf-parse issue
    return Response.json({
      success: true,
      content: `This is a placeholder for your uploaded PDF: ${file.name}

Since PDF parsing is temporarily having issues in production, you can still use the chat functionality with the sample employee handbook content. The system will use the default handbook content for responses.

To get the full functionality working with your custom PDF, we may need to implement an alternative PDF parsing solution or resolve the pdf-parse library compatibility issues in the Vercel environment.`,
      metadata: {
        filename: file.name,
        pages: 'Unknown (parsing temporarily disabled)',
        uploadedAt: new Date().toISOString(),
        isDefault: false
      }
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return Response.json(
      { error: 'Failed to process PDF file' },
      { status: 500 }
    );
  }
}

