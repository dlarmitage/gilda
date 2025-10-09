import { useState } from 'react';
import './PDFUpload.css';

export default function PDFUpload({ onPdfUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Try client-side PDF parsing first
      const pdfText = await extractTextFromPDF(file);
      
      if (pdfText) {
        // Successfully extracted text client-side
        onPdfUpload({
          success: true,
          content: pdfText,
          metadata: {
            filename: file.name,
            pages: 'Extracted client-side',
            uploadedAt: new Date().toISOString(),
            isDefault: false
          }
        });
      } else {
        // Fallback to server-side processing
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch('/api/upload-pdf', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload PDF');
        }

        onPdfUpload(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Client-side PDF text extraction using PDF.js
  const extractTextFromPDF = async (file) => {
    try {
      // Load PDF.js dynamically
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set up PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      return fullText.trim();
    } catch (error) {
      console.log('Client-side PDF parsing failed, will try server-side:', error);
      return null;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  return (
    <div className="pdf-upload-container">
      <div className="upload-card">
        <h2>Upload Employee Handbook</h2>
        <p className="upload-description">
          Upload your employee handbook PDF to get started with Gilda, your virtual HR assistant.
        </p>

        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isUploading ? (
            <div className="upload-status">
              <div className="spinner"></div>
              <p>Processing PDF...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📄</div>
              <p className="drop-text">
                Drag and drop your PDF here, or click to browse
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="file-input"
                id="pdf-input"
              />
              <label htmlFor="pdf-input" className="browse-button">
                Choose PDF File
              </label>
            </>
          )}
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}

