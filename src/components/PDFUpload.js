import { useState } from 'react';
import './PDFUpload.css';

export default function PDFUpload({ onPdfUpload, hideTitle = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [combinedContent, setCombinedContent] = useState('');

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    // Validate all files are PDFs
    const invalidFiles = Array.from(files).filter(file => file.type !== 'application/pdf');
    if (invalidFiles.length > 0) {
      setError(`Please upload only PDF files. Found ${invalidFiles.length} non-PDF file(s).`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const filePromises = Array.from(files).map(async (file) => {
        const pdfText = await extractTextFromPDF(file);
        return {
          filename: file.name,
          content: pdfText,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };
      });

      const processedFiles = await Promise.all(filePromises);
      
      // Filter out files that couldn't be processed
      const validFiles = processedFiles.filter(file => file.content && file.content.trim().length > 0);
      
      if (validFiles.length === 0) {
        throw new Error('Could not extract text from any PDFs. The PDFs might be image-based or corrupted.');
      }

      // Combine all PDF content
      const combinedText = validFiles
        .map(file => `=== ${file.filename} ===\n\n${file.content}\n\n`)
        .join('');

      // Update state
      setUploadedFiles(validFiles);
      setCombinedContent(combinedText);

      // Send combined content to server for processing
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: combinedText,
          filename: `${validFiles.length} documents`,
          fileCount: validFiles.length,
          files: validFiles.map(f => f.filename)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process PDFs');
      }

      onPdfUpload(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = async (file) => {
    await handleFiles([file]);
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
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    handleFiles(files);
  };

  return (
    <div className="pdf-upload-container">
      <div className="upload-card">
        {!hideTitle && (
          <>
            <h2>Upload Documents</h2>
            <p className="upload-description">
              Upload one or more PDF documents to get started with Gilda, your virtual assistant. 
              You can upload multiple company policy documents, handbooks, or manuals at once.
            </p>
          </>
        )}

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
                Drag and drop your PDFs here, or click to browse
              </p>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
                className="file-input"
                id="pdf-input"
              />
              <label htmlFor="pdf-input" className="browse-button">
                Choose PDF Files
              </label>
            </>
          )}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h3>📚 Uploaded Documents ({uploadedFiles.length})</h3>
            <div className="files-list">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-icon">📄</span>
                  <div className="file-info">
                    <span className="file-name">{file.filename}</span>
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}

