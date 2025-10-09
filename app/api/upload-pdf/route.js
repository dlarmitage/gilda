export async function POST(request) {
  try {
    const { content, filename } = await request.json();

    if (!content) {
      return Response.json(
        { error: 'No PDF content provided' },
        { status: 400 }
      );
    }

    // Simple server-side processing - just validate and return
    return Response.json({
      success: true,
      content: content,
      metadata: {
        filename: filename || 'Uploaded PDF',
        pages: 'Client-side processed',
        uploadedAt: new Date().toISOString(),
        isDefault: false
      }
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return Response.json(
      { error: 'Failed to process PDF file. Please try again.' },
      { status: 500 }
    );
  }
}

