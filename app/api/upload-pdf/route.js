import fs from 'fs';
import path from 'path';

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

    // Create the missing test file structure that pdf-parse expects
    const testDir = path.join(process.cwd(), 'test', 'data');
    const testFile = path.join(testDir, '05-versions-space.pdf');
    
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      // Create a dummy test file if it doesn't exist
      if (!fs.existsSync(testFile)) {
        fs.writeFileSync(testFile, Buffer.from('dummy test file'));
      }
    } catch (dirError) {
      console.log('Could not create test directory, continuing anyway');
    }

    // Now try PDF parsing
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

