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
      // Get user's active PDF from Neon Data API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NEON_DATA_API_URL}/pdf_uploads?user_id=eq.${user.id}&is_active=eq.true&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const pdfs = await response.json();
        if (pdfs && pdfs.length > 0) {
          const pdf = pdfs[0];
          setPdfLoaded(true);
          setPdfContent(pdf.content_text);
          setPdfMetadata({
            filename: pdf.original_filename,
            size: pdf.file_size,
            uploadedAt: pdf.created_at,
            isDefault: false
          });
        }
      }
    } catch (error) {
      console.error('Error checking PDF status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUpload = async (uploadData) => {
    try {
      // Save PDF to Neon Data API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NEON_DATA_API_URL}/pdf_uploads`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: user.id,
            filename: uploadData.filename,
            original_filename: uploadData.filename,
            content_text: uploadData.content,
            file_size: uploadData.content.length,
            is_active: true
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        setPdfContent(uploadData.content);
        setPdfMetadata({
          filename: uploadData.filename,
          size: uploadData.content.length,
          uploadedAt: new Date().toISOString(),
          isDefault: false
        });
        setPdfLoaded(true);
        setShowUpload(false);
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
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

