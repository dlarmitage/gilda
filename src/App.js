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
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    checkPdfStatus();
  }, []);

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
      // For now, just store the PDF data locally without saving to database
      setPdfContent(uploadData.content);
      setPdfMetadata({
        filename: uploadData.filename,
        size: uploadData.content.length,
        uploadedAt: new Date().toISOString(),
        isDefault: false
      });
      setPdfLoaded(true);
      setShowUpload(false);
      console.log('PDF uploaded successfully:', uploadData.filename);
    } catch (error) {
      console.error('Error processing PDF:', error);
    }
  };

  const handleUploadNew = () => {
    setShowUpload(true);
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
        onUploadNew={handleUploadNew}
        user={user}
      />
    </div>
  );
}

