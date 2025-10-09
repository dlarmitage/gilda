'use client';

import { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import PDFUpload from './components/PDFUpload';
import './App.css';

export default function App() {
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
      const response = await fetch('/api/pdf-status');
      const data = await response.json();

      if (data.pdfLoaded) {
        setPdfLoaded(true);
        setPdfMetadata(data.metadata);
      }
    } catch (error) {
      console.error('Error checking PDF status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUpload = (uploadData) => {
    setPdfContent(uploadData.content);
    setPdfMetadata(uploadData.metadata);
    setPdfLoaded(true);
    setShowUpload(false);
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
      />
    </div>
  );
}

