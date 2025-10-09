import { useState, useRef, useEffect } from 'react';
import { useUser } from "@stackframe/stack";
import ReactMarkdown from 'react-markdown';
import './ChatInterface.css';

export default function ChatInterface({ pdfContent, pdfMetadata, documents, onUploadNew, onRemoveDocument, user }) {
  const { signOut } = useUser();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          pdfContent: pdfContent,
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleShare = async () => {
    if (!pdfContent) {
      alert('Please upload a PDF first before sharing');
      return;
    }

    setIsGeneratingLink(true);
    try {
      const response = await fetch('/api/share-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfContent,
          pdfMetadata,
          documents,
          userId: user?.id
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
          <h1>🤖 Gilda</h1>
          <div className="documents-container">
            {documents && documents.length > 0 ? (
              <div className="document-chips">
                {documents.map((doc) => (
                  <div key={doc.id} className="document-chip">
                    <span className="document-icon">📄</span>
                    <span className="document-name">{doc.filename}</span>
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
          <button className="share-btn" onClick={handleShare} disabled={!pdfContent || isGeneratingLink}>
            {isGeneratingLink ? '⏳' : '🔗'} {isGeneratingLink ? 'Creating...' : 'Share'}
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
            <p>I'm your virtual assistant. Ask me anything about your uploaded document.</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

