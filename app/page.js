'use client';

import { useState } from 'react';
import { useUser } from "@stackframe/stack";
import { SignIn, SignUp } from "@stackframe/stack";
import App from '../src/App';
import DynamicGradient from '../src/components/DynamicGradient';

export default function Home() {
  const user = useUser();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  // If user is logged in, show the main app
  if (user) {
    return <App />;
  }

  return (
      <DynamicGradient brandColor="#4880db">
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/15 backdrop-blur-md border-b border-white border-opacity-20 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="text-3xl">🤖</div>
              <h1 className="text-2xl font-bold text-gray-900">Gilda</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSignIn(true)}
                className="text-gray-800 hover:text-gray-900 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowSignUp(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="pt-20 px-6 py-20">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <div className="text-8xl mb-6">🤖</div>
              <h1 className="text-6xl font-bold text-gray-900 mb-6 drop-shadow-sm">
                Meet <span className="text-gray-900 font-extrabold">Gilda</span>
              </h1>
              <p className="text-xl text-gray-800 mb-6 max-w-3xl mx-auto">
                Your intelligent AI document assistant. Upload any PDF document and get instant, 
                context-aware answers to your questions. Perfect for employee handbooks, 
                manuals, guides, and more.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-90 rounded-full text-sm font-medium text-gray-700 mb-8 shadow-lg">
                🌍 <span className="ml-2">Multilingual Support - Ask questions in virtually any language!</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={() => setShowSignUp(true)}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
              >
                Start Chatting Now
              </button>
              <button
                onClick={() => setShowSignIn(true)}
                className="border-2 border-gray-800 text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-100 transition-all font-semibold text-lg backdrop-blur-sm"
              >
                Sign In
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
              <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl hover:shadow-3xl transition-all backdrop-blur-sm transform hover:-translate-y-1">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-xl font-semibold mb-3">Smart PDF Processing</h3>
                <p className="text-gray-600">
                  Upload multiple PDFs at once and Gilda instantly understands their content, 
                  making everything searchable and queryable with advanced text extraction.
                </p>
              </div>

              <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl hover:shadow-3xl transition-all backdrop-blur-sm transform hover:-translate-y-1">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold mb-3">Multilingual Magic</h3>
                <p className="text-gray-600">
                  Ask questions in English, Spanish, French, German, or virtually any language. 
                  Gilda understands and responds naturally in your preferred language.
                </p>
              </div>

              <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl hover:shadow-3xl transition-all backdrop-blur-sm transform hover:-translate-y-1">
                <div className="text-4xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold mb-3">Shareable Links</h3>
                <p className="text-gray-600">
                  Generate unique shareable links to let others interact with your documents 
                  without needing accounts. Perfect for team collaboration and client access.
                </p>
              </div>

              <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl hover:shadow-3xl transition-all backdrop-blur-sm transform hover:-translate-y-1">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-3">Natural Conversations</h3>
                <p className="text-gray-600">
                  Ask questions in plain English (over 80 other languages!) and get accurate, contextual answers 
                  based on your document content with full conversation history.
                </p>
              </div>

              <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl hover:shadow-3xl transition-all backdrop-blur-sm transform hover:-translate-y-1">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
                <p className="text-gray-600">
                  Get instant responses to your questions. No waiting, no delays. 
                  Gilda processes your queries and documents in real-time.
                </p>
              </div>

              <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl hover:shadow-3xl transition-all backdrop-blur-sm transform hover:-translate-y-1">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
                <p className="text-gray-600">
                  Your documents are encrypted and private. Each user's data is 
                  completely isolated and secure with enterprise-grade protection.
                </p>
              </div>
            </div>

            {/* Use Cases Section */}
            <div className="bg-white bg-opacity-95 rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto backdrop-blur-sm">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Perfect for Every Industry</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🏢</div>
                    <span className="text-gray-700">HR & Employee Handbooks</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📚</div>
                    <span className="text-gray-700">Training Manuals & Guides</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">⚖️</div>
                    <span className="text-gray-700">Legal Documents & Contracts</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🔬</div>
                    <span className="text-gray-700">Research Papers & Reports</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🏥</div>
                    <span className="text-gray-700">Medical Records & Procedures</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🎓</div>
                    <span className="text-gray-700">Educational Materials</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-gray-300 bg-white bg-opacity-30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto text-center text-gray-800">
            <p>&copy; 2024 Gilda. Your intelligent document assistant.</p>
          </div>
        </footer>

        {/* Sign In Modal */}
        {showSignIn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Sign In</h2>
                <button
                  onClick={() => setShowSignIn(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <SignIn />
            </div>
          </div>
        )}

        {/* Sign Up Modal */}
        {showSignUp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Sign Up</h2>
                <button
                  onClick={() => setShowSignUp(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <SignUp />
            </div>
          </div>
        )}
      </div>
    </DynamicGradient>
  );
}