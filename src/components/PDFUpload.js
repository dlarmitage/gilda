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
      // Use PDF.js for client-side PDF text extraction
      const pdfText = await extractTextFromPDF(file);
      
      if (pdfText && pdfText.trim().length > 0) {
        // Send extracted text to server for processing
        const response = await fetch('/api/upload-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: pdfText,
            filename: file.name
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to process PDF');
        }

        onPdfUpload(data);
      } else {
        throw new Error('Could not extract text from PDF. The PDF might be image-based or corrupted.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Client-side PDF text extraction using PDF.js (following official examples)
  const extractTextFromPDF = async (file) => {
    try {
      // Load PDF.js dynamically following the official documentation
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configure the worker to use a local copy to avoid CORS issues
      // Use the local worker file from the public directory
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      // Convert file to ArrayBuffer as required by PDF.js
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document following the Hello World example
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        // Use system fonts to avoid font loading issues
        useSystemFonts: true
      }).promise;
      
      let fullText = '';
      
      // Extract text from each page following the official examples
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items from the page
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .trim();
        
        if (pageText) {
          fullText += pageText + '\n\n';
        }
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('PDF.js extraction error:', error);
      throw new Error(`PDF processing failed: ${error.message}`);
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

