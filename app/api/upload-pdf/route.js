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

    // Use PDF.js for server-side parsing
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    
    // Set up PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
    
    const pdf = await pdfjsLib.getDocument({
      data: buffer,
      useSystemFonts: true
    }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    return Response.json({
      success: true,
      content: fullText.trim(),
      metadata: {
        filename: file.name,
        pages: pdf.numPages,
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

