import { useState, useRef, useEffect } from 'react';
import { useUser } from "@stackframe/stack";
import ReactMarkdown from 'react-markdown';
import './ChatInterface.css';

export default function ChatInterface({ pdfContent, pdfMetadata, documents, onUploadNew, onRemoveDocument, user, brandColor = '#4880db', brandTransparency = 0.5, onBrandColorChange, onBrandTransparencyChange }) {
  const { signOut } = useUser();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [selectedBrandColor, setSelectedBrandColor] = useState(brandColor);
  const [selectedTransparency, setSelectedTransparency] = useState(brandTransparency);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState('');
  const [isFetchingCourse, setIsFetchingCourse] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Debug logging
  console.log('ChatInterface received documents:', documents);
  console.log('ChatInterface received pdfMetadata:', pdfMetadata);
  console.log('ChatInterface received pdfContent:', !!pdfContent, 'length:', pdfContent?.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to determine if a color is light or dark
  const isLightColor = (hexColor) => {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return true if light (luminance > 0.5)
    return luminance > 0.5;
  };

  // Create gradient color (slightly darker version)
  const getGradientEndColor = (hexColor) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Make it 20% darker
    const darkerR = Math.floor(r * 0.8);
    const darkerG = Math.floor(g * 0.8);
    const darkerB = Math.floor(b * 0.8);

    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  };

  const exampleQuestions = [];

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();
    setInputMessage('');

    // Focus input after sending message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    // Add user message to display
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: conversationHistory,
          // Removed pdfContent to avoid 413 Payload Too Large error
          // The server now fetches this from the DB using userId
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add assistant message to display
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);

      // Update conversation history
      setConversationHistory(data.conversationHistory);

      // Focus back on input after AI responds
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again.' }
      ]);

      // Focus back on input after error
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseAction = async (courseCode) => {
    setIsFetchingCourse(true);
    setSelectedCourse(courseCode);
    setShowCourseModal(true);
    setCourseDetails('Fetching course details...');

    try {
      const response = await fetch('/api/course-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode,
          userId: user?.id
        })
      });

      const data = await response.json();
      if (response.ok) {
        setCourseDetails(data.details);
      } else {
        setCourseDetails('Failed to load course details.');
      }
    } catch (error) {
      console.error('Error fetching course info:', error);
      setCourseDetails('Error loading course details.');
    } finally {
      setIsFetchingCourse(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleShare = async () => {
    console.log('Share button clicked - documents count:', documents?.length);
    console.log('Documents:', documents);

    if (!documents || documents.length === 0) {
      alert('Please upload a PDF first before sharing');
      return;
    }

    setSelectedBrandColor(brandColor); // Set current brand color when opening modal
    setSelectedTransparency(brandTransparency); // Set current transparency when opening modal
    setIsGeneratingLink(true);
    try {
      const response = await fetch('/api/share-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Removed pdfContent and documents to avoid 413 Payload Too Large error
          // The server can fetch these from the DB based on the userId
          pdfMetadata,
          userId: user?.id,
          brandColor: brandColor,
          brandTransparency: brandTransparency,
          // We still send filenames for metadata purposes if needed
          documentNames: documents.map(d => d.filename)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShareLink(data.shareUrl);
        setShowShareModal(true);
      } else {
        throw new Error(data.error || 'Failed to create share link');
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link. Please try again.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleBrandColorChange = async (newColor) => {
    setSelectedBrandColor(newColor);

    // Save to database
    if (user?.id) {
      try {
        const response = await fetch('/api/brand-color', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            brandColor: newColor,
            brandTransparency: selectedTransparency
          })
        });

        if (response.ok) {
          // Update parent component
          if (onBrandColorChange) {
            onBrandColorChange(newColor);
          }

          // Regenerate share link with new brand color
          const shareResponse = await fetch('/api/share-link', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              brandColor: newColor,
              brandTransparency: selectedTransparency
            })
          });

          const shareData = await shareResponse.json();
          if (shareResponse.ok) {
            setShareLink(shareData.shareUrl);
          }
        }
      } catch (error) {
        console.error('Error updating brand color:', error);
      }
    }
  };

  const handleTransparencyChange = async (newTransparency) => {
    setSelectedTransparency(newTransparency);

    // Save to database
    if (user?.id) {
      try {
        const response = await fetch('/api/brand-color', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            brandColor: selectedBrandColor,
            brandTransparency: newTransparency
          })
        });

        if (response.ok) {
          // Update parent component
          if (onBrandTransparencyChange) {
            onBrandTransparencyChange(newTransparency);
          }

          // Regenerate share link with new transparency
          const shareResponse = await fetch('/api/share-link', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              brandColor: selectedBrandColor,
              brandTransparency: newTransparency
            })
          });

          const shareData = await shareResponse.json();
          if (shareResponse.ok) {
            setShareLink(shareData.shareUrl);
          }
        }
      } catch (error) {
        console.error('Error updating transparency:', error);
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Share link copied to clipboard!');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <h1><span className="gilda-icon">🤖</span> Gilda</h1>
          <div className="documents-container">
            {documents && documents.length > 0 ? (
              <div className="document-chips">
                {documents.map((doc) => (
                  <div key={doc.id} className="document-chip">
                    <span className="document-icon">📄</span>
                    <span className="document-name">{doc.filename || doc.original_filename || 'Unknown Document'}</span>
                    <button
                      className="remove-doc-btn"
                      onClick={() => onRemoveDocument(doc.id)}
                      title="Remove this document"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pdf-info">
                <span className="pdf-name">
                  📄 {pdfMetadata?.filename || 'Document'}
                </span>
                {pdfMetadata?.isDefault && (
                  <span className="sample-badge">Sample</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button className="share-btn" onClick={handleShare} disabled={!documents || documents.length === 0 || isGeneratingLink}>
            {isGeneratingLink ? '⏳' : '📤'} {isGeneratingLink ? 'Creating...' : 'Share'}
          </button>
          <button className="upload-new-btn" onClick={onUploadNew}>
            Upload New PDF
          </button>
          <button className="signout-btn" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-screen">
            <div className="welcome-icon">👋</div>
            <h2>Welcome to Gilda!</h2>
            <p>I'm your virtual assistant. Ask me anything about your uploaded document. I'm multilingual, so feel free to ask your questions in virtually any language.</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const textColor = isUser ? (isLightColor(brandColor) ? '#1f2937' : '#ffffff') : undefined;
          const gradientEnd = isUser ? getGradientEndColor(brandColor) : undefined;
          const messageStyle = isUser ? {
            background: `linear-gradient(135deg, ${brandColor} 0%, ${gradientEnd} 100%)`,
            color: textColor
          } : {};

          return (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content" style={messageStyle}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => {
                        const isCourseLink = props.href?.startsWith('course:');
                        if (isCourseLink) {
                          const courseCode = props.href.replace('course:', '');
                          return (
                            <button
                              className="course-link-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                handleCourseAction(courseCode);
                              }}
                            >
                              {props.children}
                            </button>
                          );
                        }
                        return <a {...props} />;
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your document..."
          rows="1"
          disabled={isLoading}
        />
        <button
          className="send-button"
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isLoading}
        >
          ➤
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay">
          <div className="share-modal">
            <div className="share-modal-header">
              <h3>🔗 Share Gilda</h3>
              <button className="close-btn" onClick={() => setShowShareModal(false)}>
                ×
              </button>
            </div>
            <div className="share-modal-content">
              <p>Share this link with your team so they can ask questions about the company policies without needing to log in.</p>

              <div className="share-link-container">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="share-link-input"
                />
                <button className="copy-btn" onClick={copyToClipboard}>
                  📋 Copy
                </button>
              </div>
              <div className="share-info">
                <p><strong>📋 What they can do:</strong></p>
                <ul>
                  <li>Ask questions about company policies</li>
                  <li>Get instant answers from Gilda</li>
                  <li>No login required</li>
                  <li>Access expires after 30 days</li>
                </ul>
              </div>

              <div className="embed-section">
                <p><strong>🖼️ Embed in your website:</strong></p>
                <div className="embed-code-container">
                  <textarea
                    readOnly
                    value={`<iframe src="${shareLink}" width="100%" height="600px" frameborder="0" title="Gilda AI Assistant"></iframe>`}
                    className="embed-code-textarea"
                    rows="2"
                  />
                  <button className="copy-btn" onClick={() => {
                    const embedCode = `<iframe src="${shareLink}" width="100%" height="600px" frameborder="0" title="Gilda AI Assistant"></iframe>`;
                    navigator.clipboard.writeText(embedCode).then(() => {
                      alert('Embed code copied to clipboard!');
                    }).catch(() => {
                      // Fallback
                      const textArea = document.createElement('textarea');
                      textArea.value = embedCode;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      alert('Embed code copied to clipboard!');
                    });
                  }}>
                    📋 Copy Embed Code
                  </button>
                </div>
                <p className="embed-instructions">
                  <small>Paste this code into your website to embed Gilda directly in a page.</small>
                </p>
              </div>

              {/* Brand Color Picker with Gradient Intensity */}
              <div className="brand-color-section">
                <p><strong>🎨 Brand Color & Intensity</strong></p>
                <p className="color-picker-description">Choose a color that represents your brand and adjust the gradient intensity.</p>

                {/* Color Picker and Slider in one row */}
                <div className="color-picker-row">
                  <div className="color-picker-container">
                    <input
                      type="color"
                      value={selectedBrandColor}
                      onChange={(e) => handleBrandColorChange(e.target.value)}
                      className="color-picker-input"
                    />
                    <span className="color-value">{selectedBrandColor}</span>
                  </div>

                  {/* Transparency Slider */}
                  <div className="transparency-slider-container">
                    <div className="slider-labels">
                      <span className="slider-label">Subtle</span>
                      <span className="slider-label">Bold</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={selectedTransparency}
                      onChange={(e) => handleTransparencyChange(parseFloat(e.target.value))}
                      className="transparency-slider"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Detail Modal */}
      {showCourseModal && (
        <div className="modal-overlay course-modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal course-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📚 {selectedCourse} Details</h3>
              <button className="close-btn" onClick={() => setShowCourseModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-content course-modal-content">
              {isFetchingCourse ? (
                <div className="course-loading">
                  <div className="spinner"></div>
                  <p>Searching catalog for details...</p>
                </div>
              ) : (
                <div className="course-details-text">
                  <ReactMarkdown>{courseDetails}</ReactMarkdown>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="close-modal-btn" onClick={() => setShowCourseModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

