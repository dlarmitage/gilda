# Gilda Document Assistant - Project Recreation Prompt

Use this prompt to recreate the Gilda Document Assistant project from scratch with minimal issues.

---

## **Project Overview**

I need you to create **Gilda**, a virtual document assistant web application with the following characteristics:

### **Core Functionality**
- **AI-powered chat interface** that answers questions based on any uploaded PDF document
- **PDF upload capability** allowing users to upload their own documents
- **Default sample PDF** that's included with the application so users can try it immediately
- **Context-restricted responses** - Gilda only answers based on the PDF content, nothing else
- **Conversation history** - maintains context throughout the chat session
- **Markdown rendering** - properly formats AI responses with bold text, lists, headers, etc.
- **Beautiful, modern UI** with excellent UX

### **Technical Requirements**

**Framework & Architecture:**
- Use **Next.js 14 with App Router** (NOT Pages Router)
- Deploy to **Vercel** (serverless architecture)
- All API routes must be serverless functions using Next.js App Router API routes
- No separate Express.js backend server

**AI Integration:**
- Use **OpenAI API** with the **gpt-4-turbo** model (NOT gpt-4o or gpt-5)
- Use **max_completion_tokens** parameter (NOT max_tokens)
- Do NOT use the temperature parameter (not supported with this model)
- Set max_completion_tokens to 1000

**PDF Processing:**
- Use **pdf-parse** library for extracting text from PDFs
- Use **dynamic imports** for pdf-parse to avoid build-time issues: `const pdfParse = (await import('pdf-parse')).default;`
- NEVER import pdf-parse statically at the top of files (causes Vercel build errors)

**File Structure:**
```
project-root/
├── app/
│   ├── api/
│   │   ├── health/
│   │   │   └── route.js          # Health check endpoint
│   │   ├── pdf-status/
│   │   │   └── route.js          # Check if PDF is loaded
│   │   ├── upload-pdf/
│   │   │   └── route.js          # Handle PDF uploads
│   │   └── chat/
│   │       └── route.js          # Chat with OpenAI
│   ├── landing/
│   │   └── page.js               # Landing page (must be client component)
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Main chat application (imports from src/)
│   └── globals.css               # Global styles
├── src/
│   ├── components/
│   │   ├── ChatInterface.js      # Chat UI component with markdown rendering
│   │   ├── ChatInterface.css     # Includes markdown styling
│   │   ├── PDFUpload.js          # PDF upload UI
│   │   └── PDFUpload.css
│   ├── App.js                    # Main app component
│   └── App.css
├── uploads/
│   ├── sample_employee_handbook.pdf  # Default PDF (included in git)
│   └── sample_handbook_content.txt   # Template content (reference only)
├── public/
│   └── pdf.worker.min.js         # PDF.js worker for client-side PDF processing
├── .env                          # Environment variables (gitignored)
├── .gitignore
├── package.json
├── next.config.js
├── next-env.d.ts
├── tsconfig.json
└── README.md
```

---

## **Critical Implementation Details**

### **1. API Routes (app/api/*/route.js)**

**Health Check (app/api/health/route.js):**
```javascript
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    message: 'Gilda Document Assistant API is running',
    timestamp: new Date().toISOString()
  });
}
```

**PDF Status (app/api/pdf-status/route.js):**
- Check if `uploads/sample_employee_handbook.pdf` exists using `fs.existsSync()`
- Return metadata including `isDefault: true` flag
- Use `path.join(process.cwd(), 'uploads', 'sample_employee_handbook.pdf')`

**Upload PDF (app/api/upload-pdf/route.js):**
- Accept PDF content via `request.json()` (client-side processed)
- Client uses PDF.js to extract text before sending to server
- Server validates and returns metadata (filename, pages, uploadedAt, isDefault: false)
- Return the extracted text content to the client

**Chat (app/api/chat/route.js):**
- Accept: `message`, `conversationHistory`, and `pdfContent` from request body
- If pdfContent is not provided, load the default PDF using dynamic import
- Build OpenAI messages array with system prompt that includes PDF content
- System prompt should instruct GPT to ONLY answer from the document (not HR-specific)
- Use `model: 'gpt-4-turbo'`, `max_completion_tokens: 1000`, NO temperature parameter
- Return the response (AI responses will be in markdown format)
- **CRITICAL**: Include fallback content if PDF parsing fails (see example below)

**Fallback Content Example:**
```javascript
// Fallback content if PDF parsing fails
handbookContent = `SAMPLE DOCUMENT CONTENT

SECTION 1: INTRODUCTION
This is a sample document for testing purposes.

SECTION 2: POLICIES
- Policy A: Description of policy A
- Policy B: Description of policy B
- Policy C: Description of policy C

SECTION 3: PROCEDURES
1. Step one: Description
2. Step two: Description
3. Step three: Description

SECTION 4: CONTACT INFORMATION
For questions, contact support@company.com`;
```

**System Prompt Template:**
```javascript
const systemPrompt = `You are Gilda, a helpful virtual assistant. Your role is to answer questions ONLY based on the document provided below. 

IMPORTANT RULES:
- Only answer questions using information from the document
- If the document doesn't contain the answer, politely say so
- Never make up information or answer from general knowledge
- Be professional, friendly, and helpful
- Keep responses concise and relevant

DOCUMENT:
${handbookContent}

Remember: Only use the information from the document above to answer questions.`;
```

### **2. Frontend Components**

**App.js (Main Application Logic):**
- **MUST include `'use client';` at the top** (uses React hooks and client-side features)
- Check PDF status on mount using `/api/pdf-status`
- Show loading state while checking
- If PDF exists, show ChatInterface with "Upload New PDF" button
- If no PDF, show PDFUpload component
- When PDF is uploaded, extract content and pass to ChatInterface
- Display PDF metadata with "(Sample)" badge if `isDefault: true`

**ChatInterface.js:**
- Accept `pdfContent` and `pdfMetadata` as props
- Maintain conversation history in state
- Display messages with user/assistant avatars
- **Import ReactMarkdown**: `import ReactMarkdown from 'react-markdown';`
- Use ReactMarkdown to render assistant responses with proper formatting
- Send messages to `/api/chat` with history and pdfContent
- Show typing indicator while loading
- Clean welcome screen without HR-specific example questions
- Header shows "Gilda" (not "Gilda HR Assistant")

**PDFUpload.js:**
- Drag-and-drop or click-to-upload interface
- Use PDF.js for client-side text extraction
- Validate file is PDF
- Show upload progress/loading state
- Extract text using PDF.js worker from `/pdf.worker.min.js`
- Call onPdfUpload callback with extracted content when selected

### **3. Landing Page (app/landing/page.js)**

**CRITICAL:** Must include `'use client'` directive at the top (styled-jsx requires client component)
- Create a beautiful marketing page explaining Gilda's purpose as a document assistant
- Include hero section, features, and call-to-action
- Link to main chat app
- Do NOT export metadata from client components

### **4. Main App Page (app/page.js)**

- Simple component that imports and renders the main App from `src/App.js`
- Uses Next.js App Router structure

### **5. Configuration Files**

**package.json dependencies:**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pdf-parse": "^1.1.1",
    "openai": "^4.20.1",
    "react-markdown": "^9.0.0",
    "pdfjs-dist": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 13+
  experimental: {},
}

module.exports = nextConfig
```

**DO NOT create vercel.json** - Next.js 14 handles Vercel configuration automatically

**PDF.js Worker Setup:**
- Download `pdf.worker.min.js` from PDF.js releases and place in `public/` directory
- Required for client-side PDF text extraction in PDFUpload component
- Configure PDF.js to use local worker: `pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';`

**PDF.js Implementation Details:**
```javascript
// Client-side PDF text extraction using PDF.js
const extractTextFromPDF = async (file) => {
  try {
    // Load PDF.js dynamically following the official documentation
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure the worker to use a local copy to avoid CORS issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    
    // Convert file to ArrayBuffer as required by PDF.js
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document with system fonts to avoid font loading issues
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true
    }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items from the page
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .trim();
      
      if (pageText) {
        fullText += pageText + '\n\n';
      }
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF.js extraction error:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
};
```

**Key PDF.js Implementation Points:**
- **Dynamic Import**: Use `await import('pdfjs-dist')` to avoid build-time issues
- **Worker Configuration**: Set `GlobalWorkerOptions.workerSrc` to local worker file
- **ArrayBuffer Conversion**: Convert File object to ArrayBuffer for PDF.js
- **System Fonts**: Use `useSystemFonts: true` to avoid font loading issues
- **Page Iteration**: Loop through all pages and extract text content
- **Text Combination**: Join text items with spaces and add page breaks
- **Error Handling**: Comprehensive error handling with descriptive messages

**Why Client-Side PDF Processing:**
- **Better Performance**: No need to upload large PDF files to server
- **Reduced Server Load**: PDF parsing happens in the browser
- **Immediate Feedback**: Users see processing progress in real-time
- **Bandwidth Efficiency**: Only extracted text is sent to server
- **Scalability**: Serverless functions don't need to handle large file processing
- **User Experience**: Faster upload and processing for users

**.gitignore:**
```
node_modules/
.env
uploads/*
!uploads/sample_employee_handbook.pdf
.next/
.DS_Store
```

**Note:** The `!uploads/sample_employee_handbook.pdf` line ensures the sample PDF is tracked in git

**.env (user must create):**
```
OPENAI_API_KEY=your_actual_openai_api_key_here
```

---

## **Markdown Rendering Implementation**

### **ReactMarkdown Integration**
- Install `react-markdown` package for rendering AI responses
- Import ReactMarkdown in ChatInterface.js: `import ReactMarkdown from 'react-markdown';`
- Render assistant messages with: `<ReactMarkdown>{msg.content}</ReactMarkdown>`
- User messages remain as plain text (no markdown needed)

### **Markdown Styling**
Add CSS rules for proper markdown formatting in ChatInterface.css:
```css
/* Markdown styling within assistant messages */
.message.assistant .message-content h1,
.message.assistant .message-content h2,
.message.assistant .message-content h3 {
  margin: 10px 0 5px 0;
  color: #333;
}

.message.assistant .message-content p {
  margin: 8px 0;
}

.message.assistant .message-content ul,
.message.assistant .message-content ol {
  margin: 10px 0;
  padding-left: 20px;
}

.message.assistant .message-content li {
  margin: 5px 0;
}

.message.assistant .message-content strong {
  font-weight: 600;
  color: #667eea;  /* Brand color for bold text */
}

.message.assistant .message-content code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.message.assistant .message-content pre {
  background: #f0f0f0;
  padding: 10px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 10px 0;
}

.message.assistant .message-content blockquote {
  border-left: 4px solid #667eea;
  padding-left: 15px;
  margin: 10px 0;
  color: #666;
  font-style: italic;
}
```

---

## **Styling Requirements**

- Modern, clean design with a professional document assistant aesthetic
- Use CSS modules or styled-jsx (both work with Next.js)
- Gradient backgrounds and smooth animations
- Responsive design (mobile-friendly)
- Color scheme: Professional blues/purples with white/light backgrounds
- Chat bubbles: User (blue), Assistant (gray/white)
- Loading states: Spinning indicators and typing animations
- Smooth transitions and hover effects
- **Markdown styling**: Bold text in brand color (#667eea), proper spacing for lists and headers
- Clean welcome screen without HR-specific sample questions

---

## **Key Lessons & Common Pitfalls to Avoid**

### **✅ DO:**
- Use dynamic imports for pdf-parse: `(await import('pdf-parse')).default`
- Use Next.js 14 App Router (not Pages Router)
- Mark landing page as client component with `'use client'`
- Use `gpt-4-turbo` model with `max_completion_tokens`
- Include sample PDF in git repo for immediate functionality
- Use `process.cwd()` to get project root directory
- Return PDF content from upload endpoint to client
- Pass PDF content from client to chat endpoint

### **❌ DON'T:**
- Don't import pdf-parse statically at top of files (causes build errors)
- Don't use Express.js backend (use Next.js API routes)
- Don't create vercel.json (Next.js handles it)
- Don't use gpt-4o or gpt-5 models (use gpt-4-turbo)
- Don't use max_tokens parameter (use max_completion_tokens)
- Don't use temperature parameter (not supported)
- Don't forget `'use client'` directive on landing page
- Don't try to store uploaded PDFs persistently in serverless (use in-memory)

---

## **Deployment to Vercel**

1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Add `OPENAI_API_KEY` environment variable in Vercel dashboard
4. Deploy (automatic on push)
5. Ensure `uploads/` folder with sample PDF is included in deployment

---

## **Testing Checklist**

After building, verify:
- [ ] Health check endpoint works: `/api/health`
- [ ] PDF status endpoint returns default PDF: `/api/pdf-status`
- [ ] Main page loads with default PDF
- [ ] Header shows "Gilda" (not "Gilda HR Assistant")
- [ ] Welcome screen shows general message (no HR-specific sample questions)
- [ ] Can send chat messages and get responses
- [ ] Chat responses are restricted to document content (not HR-specific)
- [ ] **Markdown rendering works**: Bold text, lists, headers display properly
- [ ] Can click "Upload New PDF" button
- [ ] Can upload custom PDF and chat with it
- [ ] PDF upload uses client-side processing (PDF.js)
- [ ] Landing page loads at `/landing`
- [ ] All styling looks good on mobile and desktop
- [ ] Vercel build completes successfully
- [ ] Deployed version works on Vercel URL

---

## **Sample Document PDF**

The default PDF should be a simple document (can be employee handbook or any other content) with policies like:
- Vacation/PTO policy
- Company holidays
- Benefits information
- Code of conduct
- Time-off request procedures

(User will provide their own PDF, but create a simple 2-4 page sample if needed)

---

## **Final Notes**

- This is a single-user, session-based application (no database required)
- Uploaded PDFs are processed in-memory only (not persisted)
- Client-side PDF processing using PDF.js for better performance
- Markdown rendering for rich AI responses
- General-purpose document assistant (not HR-specific)
- Focus on clean, maintainable code
- Prioritize user experience and error handling
- Make it production-ready from the start

---

**Create this project step-by-step, ensuring each part works before moving to the next. Test locally before deploying to Vercel.**

