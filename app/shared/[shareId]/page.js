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
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [brandColor, setBrandColor] = useState('#4880db');
  const [brandTransparency, setBrandTransparency] = useState(0.5);
  const [userId, setUserId] = useState(null);
  const [publicTitle, setPublicTitle] = useState('Knowledge Base');
  const [publicDescription, setPublicDescription] = useState('Ask me anything about these documents.');

  // Item lookup modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDetails, setItemDetails] = useState('');
  const [isFetchingItem, setIsFetchingItem] = useState(false);

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

  // Function to determine if a color is light or dark using Rec. 709 luminance
  const getContrastColor = (hexColor) => {
    // Default to dark text if no color
    if (!hexColor) return '#1f2937';

    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // If parsing failed, return dark text as fallback
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '#1f2937';

    // Calculate relative luminance using Rec. 709 formula
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    // Return dark gray for light backgrounds, white for dark backgrounds
    // Increased threshold to 0.6 to favor white text on medium-brightness colors
    return luminance > 0.6 ? '#1f2937' : '#ffffff';
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
        setUserId(data.userId);

        // Use AI-generated title/description if available, else fallback
        const title = data.publicTitle || (data.documents?.[0]?.filename.replace(/\s*\(Part\s*\d+\)/i, '') || 'Knowledge Base');
        const description = data.publicDescription || 'Ask me anything about these documents.';

        setPublicTitle(title);
        setPublicDescription(description);

        setMessages([{
          role: 'assistant',
          content: `👋 Hello! I'm Gilda, your AI assistant. I've been trained on the **${title}** knowledge base and I'm here to help you find specific insights. What would you like to know?`
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

  const handleItemLookup = async (queryText) => {
    setIsFetchingItem(true);
    setSelectedItem(queryText);
    setShowItemModal(true);
    setItemDetails('Performing deep dive search...');

    try {
      const response = await fetch('/api/detail-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: queryText,
          userId: userId, // From shared data
          shareId: shareId
        })
      });

      const data = await response.json();
      if (response.ok) {
        setItemDetails(data.details);
      } else {
        setItemDetails('Failed to load details.');
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      setItemDetails('Error loading details.');
    } finally {
      setIsFetchingItem(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading || !pdfContent) return;

    const queryMessage = userMessage.trim();
    setUserMessage('');
    setMessages(prev => [...prev, { role: 'user', content: queryMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: queryMessage,
          conversationHistory: conversationHistory,
          // Removed pdfContent to avoid 413 Payload Too Large error
          // The server now fetches this from the shared store using shareId
          shareId: shareId,
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
            <div className="hidden md:flex flex-col items-end text-right">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{publicTitle}</h2>
              <p className="text-xs text-gray-500 max-w-sm italic line-clamp-1">{publicDescription}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              const textColor = isUser ? getContrastColor(brandColor) : undefined;
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
                    className={`max-w-3xl px-4 py-3 rounded-lg ${message.role === 'user'
                      ? ''
                      : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    style={messageStyle}
                  >
                    {message.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          strong: ({ children }) => <strong style={{ color: brandColor, fontWeight: '700' }}>{children}</strong>,
                          a: ({ node, ...props }) => {
                            const href = props.href || '';
                            if (href.startsWith('#lookup:')) {
                              const query = decodeURIComponent(href.replace('#lookup:', ''));
                              return (
                                <span
                                  className="deep-dive-link"
                                  style={{ color: brandColor, fontWeight: 'bold', cursor: 'pointer', display: 'inline' }}
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleItemLookup(query);
                                  }}
                                >
                                  {props.children}
                                </span>
                              );
                            }
                            return <a {...props} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} />;
                          }
                        }}
                      >
                        {message.content.replace(/]\(#lookup:([^)]+)\)/g, (match, query) => {
                          const cleanQuery = query.replace(/%20/g, ' ');
                          return `](#lookup:${encodeURIComponent(cleanQuery)})`;
                        })}
                      </ReactMarkdown>
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
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask me anything about this knowledge base...`}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!userMessage.trim() || isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Send
            </button>
          </div>
        </div>

        {/* Source Insight Modal */}
        {showItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>🔍</span> {selectedItem ? decodeURIComponent(selectedItem).replace(/%20/g, ' ') : ''} Details
                </h3>
                <button
                  onClick={() => setShowItemModal(false)}
                  className="p-2 hover:bg-opacity-10 rounded-full transition-colors"
                  style={{ color: brandColor, backgroundColor: `${brandColor}1A` }} // 1A is ~10% opacity
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {isFetchingItem ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-blue-100 rounded-full animate-spin mb-4" style={{ borderTopColor: brandColor }}></div>
                    <p className="text-gray-500 font-medium">Consulting Source Material...</p>
                  </div>
                ) : (
                  <div className="text-gray-800 space-y-4 leading-relaxed">
                    <ReactMarkdown
                      components={{
                        strong: ({ children }) => <strong style={{ color: brandColor, fontWeight: '700' }}>{children}</strong>,
                        a: ({ node, ...props }) => {
                          const href = props.href || '';
                          if (href.startsWith('#lookup:')) {
                            const query = decodeURIComponent(href.replace('#lookup:', ''));
                            return (
                              <span
                                className="deep-dive-link"
                                style={{ color: brandColor, fontWeight: 'bold', cursor: 'pointer', display: 'inline' }}
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleItemLookup(query);
                                }}
                              >
                                {props.children}
                              </span>
                            );
                          }
                          return <a {...props} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} />;
                        }
                      }}
                    >
                      {itemDetails.replace(/]\(#lookup:([^)]+)\)/g, (match, query) => {
                        const cleanQuery = query.replace(/%20/g, ' ');
                        return `](#lookup:${encodeURIComponent(cleanQuery)})`;
                      })}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t flex justify-end">
                <button
                  onClick={() => setShowItemModal(false)}
                  className="px-6 py-2 text-white rounded-lg font-bold hover:opacity-90 transition-colors shadow-md"
                  style={{
                    backgroundColor: brandColor,
                    color: getContrastColor(brandColor)
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DynamicGradient>
  );
}
