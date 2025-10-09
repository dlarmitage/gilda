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

    try {
      // Try using pdf-parse with a more robust approach
      const pdfParse = (await import('pdf-parse')).default;
      
      // Use a more conservative approach to avoid the test file issue
      const data = await pdfParse(buffer, {
        max: 0,
        // Try to avoid the problematic test file lookup
        normalizeWhitespace: false,
        disableCombineTextItems: false
      });

      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF appears to be empty or contains no extractable text');
      }

      return Response.json({
        success: true,
        content: data.text,
        metadata: {
          filename: file.name,
          pages: data.numpages || 'Unknown',
          uploadedAt: new Date().toISOString(),
          isDefault: false
        }
      });

    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      
      // If PDF parsing fails, return an error with helpful message
      return Response.json(
        { 
          error: `Unable to extract text from your PDF. This could be because:
- The PDF is password-protected
- The PDF contains only images (scanned document)
- The PDF is corrupted
- The PDF uses a format that's not supported

Please try with a different PDF or contact support if the issue persists.` 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing PDF:', error);
    return Response.json(
      { error: 'Failed to process PDF file. Please try again.' },
      { status: 500 }
    );
  }
}

