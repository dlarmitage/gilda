'use client';

import { useState, useEffect } from 'react';
import { useUser } from "@stackframe/stack";
import ChatInterface from './components/ChatInterface';
import PDFUpload from './components/PDFUpload';
import DynamicGradient from './components/DynamicGradient';
import './App.css';

// PDF extraction function (using proper PDF.js setup)
const extractTextFromPDF = async (file) => {
  try {
    // Load PDF.js dynamically
    const pdfjsLib = await import('pdfjs-dist');

    if (!pdfjsLib || !pdfjsLib.getDocument) {
      throw new Error('PDF.js library failed to load properly');
    }

    // Configure the worker to use a local copy to avoid CORS issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

    // Convert file to ArrayBuffer as required by PDF.js
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
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
    console.error('PDF extraction error:', error);
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [brandColor, setBrandColor] = useState('#4880db');
  const [brandTransparency, setBrandTransparency] = useState(0.5);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  useEffect(() => {
    if (user) {
      checkPdfStatus();
      loadUserBrandColor();
    } else {
      // Load default document for non-authenticated users
      loadDefaultDocument();
    }
  }, [user]);

  const loadUserBrandColor = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/brand-color?userId=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        if (data.brandColor) {
          setBrandColor(data.brandColor);
        }
        if (data.brandTransparency !== undefined) {
          setBrandTransparency(data.brandTransparency);
        }
      }
    } catch (error) {
      console.error('Error loading brand settings:', error);
    }
  };

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
            console.log('First document content check:', data.documents[0]?.content ? 'has content' : 'no content');
            console.log('First document keys:', Object.keys(data.documents[0] || {}));

            setDocuments(data.documents);

            // Combine existing documents for chat
            const documentsWithContent = data.documents.filter(doc => doc.content && doc.content.trim().length > 0);
            console.log('Documents with content:', documentsWithContent.length);

            const combinedContent = documentsWithContent
              .map(doc => `=== ${doc.filename} ===\n\n${doc.content}\n\n`)
              .join('');

            console.log('Combined content length:', combinedContent.length);

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
    setIsUploading(true);
    setUploadStatus('Starting upload...');
    try {
      const userId = user?.id;
      let allDocuments = [];

      // If uploadData contains individual files, store them
      if (uploadData.files && uploadData.files.length > 0) {
        // Process files if they're File objects (from new modal) or already processed
        if (uploadData.files[0] instanceof File) {
          // Files are raw File objects, need to process them
          const processedFiles = await Promise.all(
            uploadData.files.map(async (file, index) => {
              setUploadStatus(`Extracting text from ${file.name}...`);
              // Check for duplicate filenames
              const existingDoc = documents.find(doc => doc.filename === file.name);
              if (existingDoc) {
                console.warn(`Document "${file.name}" already exists. Skipping duplicate.`);
                return null;
              }

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

          // Filter out null values (duplicates)
          const validProcessedFiles = processedFiles.filter(file => file !== null);
          allDocuments = [...documents, ...validProcessedFiles];
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
        console.log('Saving documents to database...');
        console.log('Documents to save:', allDocuments);
        console.log('User ID:', userId);
        setUploadStatus('Preparing documents for database...');

        // Validate that all documents have content before saving
        const validDocuments = allDocuments.filter(doc => {
          const hasContent = doc.content && doc.content.trim().length > 0;
          if (!hasContent) {
            console.warn('Skipping document without content:', doc.filename);
          }
          return hasContent;
        });

        if (validDocuments.length === 0) {
          console.error('No documents with valid content to save');
        } else {
          // Safety: Vercel has a 4.5MB payload limit. 
          // We'll split massive documents into smaller "parts" if they exceed the limit.
          const MAX_PART_SIZE = 3000000; // ~3MB per part
          let documentsToUpload = [];

          validDocuments.forEach(doc => {
            if (doc.content.length > MAX_PART_SIZE) {
              setUploadStatus(`Large document detected: ${doc.filename}. Splitting for transport...`);
              console.log(`Document ${doc.filename} is too large (${doc.content.length} chars), splitting into parts...`);
              const parts = Math.ceil(doc.content.length / MAX_PART_SIZE);

              for (let i = 0; i < parts; i++) {
                const start = i * MAX_PART_SIZE;
                const end = Math.min(start + MAX_PART_SIZE, doc.content.length);
                const partContent = doc.content.substring(start, end);

                documentsToUpload.push({
                  ...doc,
                  id: `${doc.id}-part-${i}`,
                  filename: i === 0 ? doc.filename : `${doc.filename} (Part ${i + 1})`,
                  content: partContent,
                  size: partContent.length
                });
              }
            } else {
              documentsToUpload.push(doc);
            }
          });

          // Upload documents in batches if total payload still exceeds limit
          const uploadInBatches = async (allDocs) => {
            const batchLimit = 3500000; // ~3.5MB total per request
            let currentBatch = [];
            let currentBatchSize = 0;
            let batchCount = 0;

            for (let i = 0; i < allDocs.length; i++) {
              const doc = allDocs[i];
              const docChars = doc.content?.length || 0;
              if (currentBatchSize + docChars > batchLimit && currentBatch.length > 0) {
                await sendBatch(currentBatch, batchCount === 0);
                batchCount++;
                currentBatch = [];
                currentBatchSize = 0;
              }
              currentBatch.push(doc);
              currentBatchSize += docChars;
            }

            if (currentBatch.length > 0) {
              await sendBatch(currentBatch, batchCount === 0);
            }
          };

          const sendBatch = async (batch, isFirst) => {
            const response = await fetch('/api/documents', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, documents: batch, clearExisting: isFirst })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Failed to save batch:', response.statusText, errorText);
              return;
            }

            // Read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(line => line.trim());

              for (const line of lines) {
                try {
                  const data = JSON.parse(line);
                  if (data.status === 'indexing') {
                    setUploadStatus(`Indexing ${data.filename}: chunk ${data.currentChunk} / ${data.totalChunks}...`);
                  } else if (data.status === 'saving') {
                    setUploadStatus(`Saving ${data.filename} to database...`);
                  } else if (data.status === 'chunked') {
                    setUploadStatus(`Prepared ${data.chunkCount} chunks for ${data.filename}...`);
                  } else if (data.status === 'success') {
                    console.log('Batch processed successfully');
                  } else if (data.status === 'error') {
                    console.error('Error during indexing:', data.message);
                    alert(`Error: ${data.message}`);
                  }
                } catch (e) {
                  console.error('Error parsing stream chunk:', e, line);
                }
              }
            }
          };

          await uploadInBatches(documentsToUpload);
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
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const handleUploadNew = () => {
    setShowUpload(true);
  };

  const handleRemoveDocument = (documentId) => {
    const doc = documents.find(d => d.id === documentId);
    setDocumentToDelete(doc);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    const documentId = documentToDelete.id;
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    setDocuments(updatedDocuments);
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);

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
            documents: updatedDocuments,
            clearExisting: true // Re-save the final list
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
      setPdfLoaded(false);
      setPdfContent(null);
      setPdfMetadata(null);
    } else {
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Filter for PDF files only
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      if (pdfFiles.length > 0) {
        await handlePdfUpload({ files: pdfFiles });
      } else {
        alert('Please drop only PDF files.');
      }
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
    <DynamicGradient brandColor={brandColor} transparency={brandTransparency}>
      <div className="app-container">
        <ChatInterface
          pdfContent={pdfContent}
          pdfMetadata={pdfMetadata}
          documents={documents}
          onUploadNew={handleUploadNew}
          onRemoveDocument={handleRemoveDocument}
          user={user}
          brandColor={brandColor}
          brandTransparency={brandTransparency}
          onBrandColorChange={(newColor) => {
            setBrandColor(newColor);
          }}
          onBrandTransparencyChange={(newTransparency) => {
            setBrandTransparency(newTransparency);
          }}
        />

        {/* Upload Modal */}
        {showUpload && (
          <div className="modal-overlay" onClick={() => setShowUpload(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Upload Documents</h2>
                <button className="close-btn" onClick={() => setShowUpload(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-text">
                  Upload PDF documents to get started with Gilda
                </p>
                <div
                  className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
                  onClick={() => document.getElementById('file-input').click()}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                {isUploading && (
                  <div className="upload-loading-overlay">
                    <div className="spinner"></div>
                    <p className="upload-status-text">{uploadStatus}</p>
                    <p className="upload-warning-text">Don't close this window, we're building your AI index.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal confirmation-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Remove Document?</h2>
                <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-text">
                  Are you sure you want to remove <strong>{documentToDelete?.filename}</strong>?
                </p>
                <div className="warning-box">
                  <span className="warning-icon">⚠️</span>
                  <p>Deleting this will remove all indexed AI context for this document. You will need to re-upload and re-index if you want to use it again.</p>
                </div>
                <div className="modal-actions">
                  <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                  <button className="confirm-delete-btn" onClick={confirmDelete}>Remove Document</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DynamicGradient>
  );
}

