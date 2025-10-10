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
        const newDocuments = uploadData.files.map(file => ({
          id: Date.now() + Math.random(), // Simple unique ID
          filename: file.filename,
          content: file.content,
          size: file.size,
          uploadedAt: file.uploadedAt || new Date().toISOString()
        }));
        
        allDocuments = [...documents, ...newDocuments];
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
        <div className="upload-modal-overlay">
          <div className="upload-modal">
            <div className="upload-modal-header">
              <h2>Upload Documents</h2>
              <button className="close-btn" onClick={() => setShowUpload(false)}>
                ×
              </button>
            </div>
            <div className="upload-modal-content">
              <p className="modal-description">
                Upload one or more PDF documents to get started with Gilda. You can upload multiple company policy documents, handbooks, or manuals at once.
              </p>
              <PDFUpload onPdfUpload={handlePdfUpload} hideTitle={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

