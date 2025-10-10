'use client';

import { useState, useEffect } from 'react';
import { useUser } from "@stackframe/stack";
import ChatInterface from './components/ChatInterface';
import PDFUpload from './components/PDFUpload';
import './App.css';

// PDF extraction function (using proper PDF.js setup)
const extractTextFromPDF = async (file) => {
  try {
    // Load PDF.js dynamically following the official documentation
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure the worker to use a local copy to avoid CORS issues
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
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      
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

export default function App() {
  const user = useUser();
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfContent, setPdfContent] = useState(null);
  const [pdfMetadata, setPdfMetadata] = useState(null);
  const [documents, setDocuments] = useState([]); // Array of individual documents
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (user) {
      checkPdfStatus();
    } else {
      // Load default document for non-authenticated users
      loadDefaultDocument();
    }
  }, [user]);

  const loadDefaultDocument = () => {
    // Add the default sample employee handbook to documents
    const defaultDoc = {
      id: 'default-sample-handbook',
      filename: 'sample_employee_handbook.pdf',
      content: 'Default document content', // Temporary content for display
      size: 0,
      uploadedAt: new Date().toISOString(),
      isDefault: true
    };
    
    setDocuments([defaultDoc]);
    setPdfMetadata({
      filename: 'sample_employee_handbook.pdf',
      isDefault: true
    });
    setPdfLoaded(true);
    setIsLoading(false);
  };

  const checkPdfStatus = async () => {
    try {
      // Check for existing documents in database for this user
      const userId = user?.id;
      console.log('Checking PDF status for user ID:', userId);
      
      if (userId) {
        const response = await fetch(`/api/documents?userId=${userId}`);
        console.log('Database response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Database response data:', data);
          
          if (data.documents && data.documents.length > 0) {
            console.log('Found existing documents for user:', data.documents.length);
            console.log('Documents:', data.documents);
            setDocuments(data.documents);
            
            // Combine existing documents for chat
            const combinedContent = data.documents
              .filter(doc => doc.content) // Only include documents with content
              .map(doc => `=== ${doc.filename} ===\n\n${doc.content}\n\n`)
              .join('');
            
            if (combinedContent) {
              setPdfContent(combinedContent);
              setPdfMetadata({
                filename: `${data.documents.length} documents`,
                size: combinedContent.length,
                uploadedAt: new Date().toISOString(),
                isDefault: false,
                isMultiple: data.documents.length > 1
              });
              
              setPdfLoaded(true);
              setIsLoading(false);
              console.log('Successfully loaded existing documents, going to chat interface');
              return;
            }
          }
        } else {
          console.error('Failed to fetch documents:', response.statusText);
        }
      }
      
      // No existing documents found, proceed to upload interface
      console.log('No existing documents found, proceeding to upload interface');
    } catch (error) {
      console.error('Error checking PDF status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUpload = async (uploadData) => {
    try {
      const userId = user?.id;
      let allDocuments = [];
      
      // If uploadData contains individual files, store them
      if (uploadData.files && uploadData.files.length > 0) {
        // Process files if they're File objects (from new modal) or already processed
        if (uploadData.files[0] instanceof File) {
          // Files are raw File objects, need to process them
          const processedFiles = await Promise.all(
            uploadData.files.map(async (file) => {
              const pdfText = await extractTextFromPDF(file);
              return {
                id: Date.now() + Math.random(),
                filename: file.name,
                content: pdfText,
                size: file.size,
                uploadedAt: new Date().toISOString()
              };
            })
          );
          allDocuments = [...documents, ...processedFiles];
        } else {
          // Files are already processed objects
          const newDocuments = uploadData.files.map(file => ({
            id: Date.now() + Math.random(),
            filename: file.filename,
            content: file.content,
            size: file.size,
            uploadedAt: file.uploadedAt || new Date().toISOString()
          }));
          allDocuments = [...documents, ...newDocuments];
        }
      } else {
        // Fallback for single file uploads
        const newDoc = {
          id: Date.now() + Math.random(),
          filename: uploadData.filename,
          content: uploadData.content,
          size: uploadData.content.length,
          uploadedAt: new Date().toISOString()
        };
        
        allDocuments = [newDoc];
      }
      
      // Save documents to database if user is authenticated
      if (userId && allDocuments.length > 0) {
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            documents: allDocuments
          })
        });
        
        if (!response.ok) {
          console.error('Failed to save documents to database');
        }
      }
      
      setDocuments(allDocuments);
      
      // Combine all documents for chat
      const combinedContent = allDocuments
        .map(doc => `=== ${doc.filename} ===\n\n${doc.content}\n\n`)
        .join('');
      
      setPdfContent(combinedContent);
      setPdfMetadata({
        filename: `${allDocuments.length} documents`,
        size: combinedContent.length,
        uploadedAt: new Date().toISOString(),
        isDefault: false,
        fileCount: allDocuments.length
      });
      
      setPdfLoaded(true);
      setShowUpload(false); // Close modal after upload
      console.log('PDFs uploaded successfully');
    } catch (error) {
      console.error('Error processing PDF:', error);
    }
  };

  const handleUploadNew = () => {
    setShowUpload(true);
  };

  const handleRemoveDocument = async (documentId) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    setDocuments(updatedDocuments);
    
    // Update database if user is authenticated
    const userId = user?.id;
    if (userId && updatedDocuments.length >= 0) {
      try {
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            documents: updatedDocuments
          })
        });
        
        if (!response.ok) {
          console.error('Failed to update documents in database');
        }
      } catch (error) {
        console.error('Error updating documents:', error);
      }
    }
    
    if (updatedDocuments.length === 0) {
      // No documents left
      setPdfLoaded(false);
      setPdfContent(null);
      setPdfMetadata(null);
    } else {
      // Update combined content and metadata
      const combinedContent = updatedDocuments
        .map(doc => `=== ${doc.filename} ===\n\n${doc.content}\n\n`)
        .join('');
      
      setPdfContent(combinedContent);
      setPdfMetadata({
        filename: `${updatedDocuments.length} documents`,
        size: combinedContent.length,
        uploadedAt: new Date().toISOString(),
        isDefault: false,
        fileCount: updatedDocuments.length
      });
    }
  };

  const handleBackToChat = () => {
    setShowUpload(false);
  };

  const handleFileInput = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handlePdfUpload({ files: Array.from(files) });
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>Loading Gilda...</p>
      </div>
    );
  }

  // Always show chat interface, with upload as modal if needed
  return (
    <div className="app-container">
      <ChatInterface
        pdfContent={pdfContent}
        pdfMetadata={pdfMetadata}
        documents={documents}
        onUploadNew={handleUploadNew}
        onRemoveDocument={handleRemoveDocument}
        user={user}
      />
      
      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Documents</h2>
              <button className="close-btn" onClick={() => setShowUpload(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-text">
                Upload PDF documents to get started with Gilda
              </p>
              <div className="upload-area" onClick={() => document.getElementById('file-input').click()}>
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Drop PDFs here or click to browse</h3>
                <p>Upload multiple PDF documents at once</p>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileInput}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

