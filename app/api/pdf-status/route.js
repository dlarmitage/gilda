import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const pdfPath = path.join(process.cwd(), 'uploads', 'sample_employee_handbook.pdf');
    const pdfExists = fs.existsSync(pdfPath);

    if (pdfExists) {
      const stats = fs.statSync(pdfPath);
      
      return Response.json({
        pdfLoaded: true,
        isDefault: true,
        metadata: {
          filename: 'sample_employee_handbook.pdf',
          size: stats.size,
          uploadedAt: stats.mtime
        }
      });
    }

    return Response.json({
      pdfLoaded: false,
      isDefault: false
    });
  } catch (error) {
    console.error('Error checking PDF status:', error);
    return Response.json(
      { error: 'Failed to check PDF status' },
      { status: 500 }
    );
  }
}

