'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .nav {
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 28px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cta-button {
          background: white;
          color: #667eea;
          padding: 12px 30px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.2s ease;
          display: inline-block;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .hero {
          text-align: center;
          padding: 100px 20px 80px;
          max-width: 900px;
          margin: 0 auto;
        }

        .hero-icon {
          font-size: 100px;
          margin-bottom: 30px;
        }

        .hero h1 {
          font-size: 56px;
          margin: 0 0 20px 0;
          line-height: 1.2;
        }

        .hero p {
          font-size: 22px;
          opacity: 0.95;
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .hero .cta-button {
          font-size: 18px;
          padding: 16px 40px;
        }

        .features {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 80px 20px;
        }

        .features-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .features h2 {
          text-align: center;
          font-size: 40px;
          margin-bottom: 60px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 40px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.15);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
        }

        .feature-icon {
          font-size: 50px;
          margin-bottom: 20px;
        }

        .feature-card h3 {
          font-size: 24px;
          margin: 0 0 15px 0;
        }

        .feature-card p {
          opacity: 0.9;
          line-height: 1.6;
          margin: 0;
        }

        .cta-section {
          text-align: center;
          padding: 80px 20px;
        }

        .cta-section h2 {
          font-size: 40px;
          margin-bottom: 20px;
        }

        .cta-section p {
          font-size: 20px;
          opacity: 0.95;
          margin-bottom: 40px;
        }

        .footer {
          text-align: center;
          padding: 40px 20px;
          opacity: 0.8;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 768px) {
          .hero h1 {
            font-size: 40px;
          }

          .hero p {
            font-size: 18px;
          }

          .features h2,
          .cta-section h2 {
            font-size: 32px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .nav {
            padding: 15px 20px;
          }

          .logo {
            font-size: 24px;
          }
        }
      `}</style>

      <nav className="nav">
        <div className="logo">
          <span>🤖</span>
          <span>Gilda</span>
        </div>
        <Link href="/" className="cta-button">
          Get Started
        </Link>
      </nav>

      <section className="hero">
        <div className="hero-icon">🤖</div>
        <h1>Meet Gilda, Your Virtual HR Assistant</h1>
        <p>
          Get instant answers to your HR questions based on your employee handbook.
          Upload your PDF and start chatting with an AI that knows your company policies inside out.
        </p>
        <Link href="/" className="cta-button">
          Try Gilda Now →
        </Link>
      </section>

      <section className="features">
        <div className="features-container">
          <h2>Why Choose Gilda?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>PDF Upload</h3>
              <p>
                Upload your employee handbook PDF and Gilda will understand your company's
                specific policies and procedures.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Natural Conversation</h3>
              <p>
                Ask questions in plain English and get clear, accurate answers based
                exclusively on your handbook content.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Context-Aware</h3>
              <p>
                Gilda maintains conversation history and provides contextually relevant
                responses throughout your chat session.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Answers</h3>
              <p>
                No more searching through long PDF documents. Get answers to your HR
                questions in seconds, not minutes.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>
                Your handbook is processed in-memory only. No data is stored permanently,
                ensuring your company's privacy.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Beautiful Interface</h3>
              <p>
                Enjoy a modern, intuitive chat interface that works seamlessly on both
                desktop and mobile devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>
          Try Gilda with our sample employee handbook, or upload your own to get started.
        </p>
        <Link href="/" className="cta-button">
          Launch Gilda →
        </Link>
      </section>

      <footer className="footer">
        <p>© 2024 Gilda HR Assistant. Powered by OpenAI GPT-4 Turbo.</p>
      </footer>
    </div>
  );
}

