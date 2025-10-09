# Gilda HR Assistant - Project Recreation Prompt

Use this prompt to recreate the Gilda HR Assistant project from scratch with minimal issues.

---

## **Project Overview**

I need you to create **Gilda**, a virtual HR assistant web application with the following characteristics:

### **Core Functionality**
- **AI-powered chat interface** that answers questions based on an employee handbook PDF
- **PDF upload capability** allowing users to upload their own employee handbook
- **Default sample PDF** that's included with the application so users can try it immediately
- **Context-restricted responses** - Gilda only answers based on the PDF content, nothing else
- **Conversation history** - maintains context throughout the chat session
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
│   ├── page.js                   # Main chat application
│   └── globals.css               # Global styles
├── src/
│   ├── components/
│   │   ├── ChatInterface.js      # Chat UI component
│   │   ├── ChatInterface.css
│   │   ├── PDFUpload.js          # PDF upload UI
│   │   └── PDFUpload.css
│   ├── App.js                    # Main app component
│   └── App.css
├── uploads/
│   └── sample_employee_handbook.pdf  # Default PDF (included in git)
├── .env                          # Environment variables (gitignored)
├── .gitignore
├── package.json
├── next.config.js
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
    message: 'Gilda HR Assistant API is running',
    timestamp: new Date().toISOString()
  });
}
```

**PDF Status (app/api/pdf-status/route.js):**
- Check if `uploads/sample_employee_handbook.pdf` exists using `fs.existsSync()`
- Return metadata including `isDefault: true` flag
- Use `path.join(process.cwd(), 'uploads', 'sample_employee_handbook.pdf')`

**Upload PDF (app/api/upload-pdf/route.js):**
- Accept PDF via `request.formData()`
- Validate it's a PDF file type
- Use dynamic import: `const pdfParse = (await import('pdf-parse')).default;`
- Extract text and return it along with metadata (filename, pages, uploadedAt, isDefault: false)
- Return the extracted text content to the client

**Chat (app/api/chat/route.js):**
- Accept: `message`, `conversationHistory`, and `pdfContent` from request body
- If pdfContent is not provided, load the default PDF using dynamic import
- Build OpenAI messages array with system prompt that includes PDF content
- System prompt should instruct GPT to ONLY answer from the handbook
- Use `model: 'gpt-4-turbo'`, `max_completion_tokens: 1000`, NO temperature parameter
- Return the response

### **2. Frontend Components**

**App.js (Main Application Logic):**
- Check PDF status on mount using `/api/pdf-status`
- Show loading state while checking
- If PDF exists, show ChatInterface with "Upload New PDF" button
- If no PDF, show PDFUpload component
- When PDF is uploaded, extract content and pass to ChatInterface
- Display PDF metadata with "(Sample)" badge if `isDefault: true`

**ChatInterface.js:**
- Accept `apiUrl` and `pdfContent` as props
- Maintain conversation history in state
- Display messages with user/assistant avatars
- Send messages to `/api/chat` with history and pdfContent
- Show typing indicator while loading
- Include example questions when chat is empty

**PDFUpload.js:**
- Drag-and-drop or click-to-upload interface
- Validate file is PDF
- Show upload progress/loading state
- Call onPdfUpload callback with file when selected

### **3. Landing Page (app/landing/page.js)**

**CRITICAL:** Must include `'use client'` directive at the top (styled-jsx requires client component)
- Create a beautiful marketing page explaining Gilda's purpose
- Include hero section, features, and call-to-action
- Link to main chat app
- Do NOT export metadata from client components

### **4. Configuration Files**

**package.json dependencies:**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pdf-parse": "^1.1.1",
    "openai": "^4.20.1"
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

## **Styling Requirements**

- Modern, clean design with a professional HR/business aesthetic
- Use CSS modules or styled-jsx (both work with Next.js)
- Gradient backgrounds and smooth animations
- Responsive design (mobile-friendly)
- Color scheme: Professional blues/purples with white/light backgrounds
- Chat bubbles: User (blue), Assistant (gray/white)
- Loading states: Spinning indicators and typing animations
- Smooth transitions and hover effects

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
- [ ] Can send chat messages and get responses
- [ ] Chat responses are restricted to handbook content
- [ ] Can click "Upload New PDF" button
- [ ] Can upload custom PDF and chat with it
- [ ] Landing page loads at `/landing`
- [ ] All styling looks good on mobile and desktop
- [ ] Vercel build completes successfully
- [ ] Deployed version works on Vercel URL

---

## **Sample Employee Handbook PDF**

The default PDF should be a simple employee handbook with policies like:
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
- Focus on clean, maintainable code
- Prioritize user experience and error handling
- Make it production-ready from the start

---

**Create this project step-by-step, ensuring each part works before moving to the next. Test locally before deploying to Vercel.**

