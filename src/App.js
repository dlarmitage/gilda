'use client';

import { useState, useEffect } from 'react';
import { useUser } from "@stackframe/stack";
import ChatInterface from './components/ChatInterface';
import PDFUpload from './components/PDFUpload';
import './App.css';

export default function App() {
  const user = useUser();
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfContent, setPdfContent] = useState(null);
  const [pdfMetadata, setPdfMetadata] = useState(null);
  const [documents, setDocuments] = useState([]); // Array of individual documents
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    checkPdfStatus();
    // Load default PDF document
    loadDefaultDocument();
  }, []);

  const loadDefaultDocument = () => {
    // Add the default sample employee handbook to documents
    const defaultDoc = {
      id: 'default-sample-handbook',
      filename: 'sample_employee_handbook.pdf',
      content: null, // Will be loaded by the API
      size: null,
      uploadedAt: new Date().toISOString(),
      isDefault: true
    };
    
    setDocuments([defaultDoc]);
    setPdfMetadata({
      filename: 'sample_employee_handbook.pdf',
      isDefault: true
    });
  };

  const checkPdfStatus = async () => {
    try {
      // For now, skip the database check and just set loading to false
      // This allows the app to proceed to the upload interface
      console.log('User authenticated, proceeding to upload interface');
    } catch (error) {
      console.error('Error checking PDF status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUpload = async (uploadData) => {
    try {
      // If uploadData contains individual files, store them
      if (uploadData.files && uploadData.files.length > 0) {
        const newDocuments = uploadData.files.map(file => ({
          id: Date.now() + Math.random(), // Simple unique ID
          filename: file.filename,
          content: file.content,
          size: file.size,
          uploadedAt: file.uploadedAt || new Date().toISOString()
        }));
        
        setDocuments(prev => [...prev, ...newDocuments]);
        
        // Combine all documents for chat
        const allDocuments = [...documents, ...newDocuments];
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
      } else {
        // Fallback for single file uploads
        const newDoc = {
          id: Date.now() + Math.random(),
          filename: uploadData.filename,
          content: uploadData.content,
          size: uploadData.content.length,
          uploadedAt: new Date().toISOString()
        };
        
        setDocuments([newDoc]);
        setPdfContent(uploadData.content);
        setPdfMetadata({
          filename: uploadData.filename,
          size: uploadData.content.length,
          uploadedAt: new Date().toISOString(),
          isDefault: false,
          fileCount: 1
        });
      }
      
      setPdfLoaded(true);
      setShowUpload(false);
      console.log('PDFs uploaded successfully');
    } catch (error) {
      console.error('Error processing PDF:', error);
    }
  };

  const handleUploadNew = () => {
    setShowUpload(true);
  };

  const handleRemoveDocument = (documentId) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    setDocuments(updatedDocuments);
    
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

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>Loading Gilda...</p>
      </div>
    );
  }

  if (!pdfLoaded || showUpload) {
    return (
      <div className="app-container">
        {showUpload && pdfLoaded && (
          <button className="back-button" onClick={handleBackToChat}>
            ← Back to Chat
          </button>
        )}
        <PDFUpload onPdfUpload={handlePdfUpload} />
      </div>
    );
  }

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
    </div>
  );
}

