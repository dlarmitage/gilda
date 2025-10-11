'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'next/navigation';
import DynamicGradient from '../../../src/components/DynamicGradient';

export default function SharedGildaPage() {
  const params = useParams();
  const shareId = params.shareId;
  
  const [pdfContent, setPdfContent] = useState(null);
  const [pdfMetadata, setPdfMetadata] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [brandColor, setBrandColor] = useState('#4880db');
  const [brandTransparency, setBrandTransparency] = useState(0.5);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (shareId) {
      loadSharedData();
    }
  }, [shareId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const loadSharedData = async () => {
    try {
      const response = await fetch(`/api/share-link?shareId=${shareId}`);
      const data = await response.json();

      if (response.ok) {
        setPdfContent(data.pdfContent);
        setPdfMetadata(data.pdfMetadata);
        setDocuments(data.documents || []);
        setBrandColor(data.brandColor || '#4880db');
        setBrandTransparency(data.brandTransparency !== undefined ? data.brandTransparency : 0.5);
        setMessages([{
          role: 'assistant',
          content: `👋 Hello! I'm Gilda, your AI assistant. I have access to your company's policy documents and I'm here to help answer any questions you might have. I'm multilingual, so feel free to ask your questions in virtually any language. What would you like to know?`
        }]);
      } else {
        setError(data.error || 'Failed to load shared content');
      }
    } catch (err) {
      console.error('Error loading shared data:', err);
      setError('Failed to load shared content. Please check the link and try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !pdfContent) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      setConversationHistory(prev => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: data.response }]);
      
      // Focus back on input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      
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

  if (isLoadingData) {
    return (
      <DynamicGradient brandColor={brandColor} transparency={brandTransparency}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center bg-white bg-opacity-95 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
            <div className="text-6xl mb-4">🤖</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Gilda...</h1>
            <p className="text-gray-600">Please wait while we prepare your AI assistant</p>
          </div>
        </div>
      </DynamicGradient>
    );
  }

  if (error) {
    return (
      <DynamicGradient brandColor={brandColor} transparency={brandTransparency}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md bg-white bg-opacity-95 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              The share link may have expired or been removed. Please contact your HR administrator for a new link.
            </p>
          </div>
        </div>
      </DynamicGradient>
    );
  }

  return (
    <DynamicGradient brandColor={brandColor} transparency={brandTransparency}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white p-5 shadow-lg border-b border-gray-200">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-4xl">🤖</span>
              <h1 className="text-3xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.5px' }}>Gilda</h1>
            </div>
            <div className="flex items-center">
              {documents && documents.length > 0 ? (
                <div className="flex flex-wrap gap-2 items-center">
                  {documents.map((doc, index) => (
                    <div key={index} className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-full text-sm font-medium text-gray-800 border border-gray-200 shadow-sm">
                      <span>📄</span>
                      <span>{doc.filename}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-800 text-sm">{`📄 ${pdfMetadata?.filename || 'Company Documents'}`}</span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            const textColor = isUser ? (isLightColor(brandColor) ? '#1f2937' : '#ffffff') : undefined;
            const gradientEnd = isUser ? getGradientEndColor(brandColor) : undefined;
            const messageStyle = isUser ? {
              background: `linear-gradient(135deg, ${brandColor} 0%, ${gradientEnd} 100%)`,
              color: textColor
            } : {};

            return (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? ''
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                  style={messageStyle}
                >
                  {message.role === 'assistant' ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t bg-white bg-opacity-90 backdrop-blur-md p-4">
        <div className="max-w-4xl mx-auto flex space-x-3">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your company policies..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Send
          </button>
        </div>
        </div>
      </div>
    </DynamicGradient>
  );
}
