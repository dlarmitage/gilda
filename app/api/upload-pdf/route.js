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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Simple, clean PDF parsing - no fancy options
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);

    return Response.json({
      success: true,
      content: data.text,
      metadata: {
        filename: file.name,
        pages: data.numpages,
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

