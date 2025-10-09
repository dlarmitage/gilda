# Gilda - Virtual HR Assistant 🤖

An AI-powered virtual HR assistant that answers questions based on your employee handbook PDF. Built with Next.js 14, OpenAI GPT-4 Turbo, and deployed on Vercel.

![Gilda HR Assistant](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4--Turbo-412991?style=for-the-badge&logo=openai)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=for-the-badge&logo=vercel)

## ✨ Features

- 💬 **AI-Powered Chat Interface** - Natural conversation with context awareness
- 📄 **PDF Upload** - Upload your own employee handbook or use the sample
- 🎯 **Context-Restricted** - Answers only based on handbook content
- 🔄 **Conversation History** - Maintains context throughout the session
- 🎨 **Beautiful UI** - Modern, responsive design with excellent UX
- ⚡ **Serverless** - Built for Vercel with Next.js App Router
- 🔒 **Privacy-First** - PDFs processed in-memory only, no persistent storage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- A sample employee handbook PDF (or use the provided template)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gilda
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_actual_openai_api_key_here
   ```

4. **Create a sample PDF handbook**
   
   Use the content in `uploads/sample_handbook_content.txt` to create a PDF:
   - Open the text file
   - Copy the content into a word processor (Word, Google Docs, etc.)
   - Format it nicely with headings and sections
   - Export/Save as PDF: `uploads/sample_employee_handbook.pdf`
   
   Alternatively, you can use any PDF of your choice.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
gilda/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (serverless functions)
│   │   ├── health/              
│   │   │   └── route.js         # Health check endpoint
│   │   ├── pdf-status/          
│   │   │   └── route.js         # Check if PDF is loaded
│   │   ├── upload-pdf/          
│   │   │   └── route.js         # Handle PDF uploads
│   │   └── chat/                
│   │       └── route.js         # Chat with OpenAI
│   ├── landing/                 
│   │   └── page.js              # Landing/marketing page
│   ├── layout.js                # Root layout
│   ├── page.js                  # Main app page
│   └── globals.css              # Global styles
├── src/
│   ├── components/
│   │   ├── ChatInterface.js     # Chat UI component
│   │   ├── ChatInterface.css
│   │   ├── PDFUpload.js         # PDF upload UI
│   │   └── PDFUpload.css
│   ├── App.js                   # Main app logic
│   └── App.css
├── uploads/
│   ├── sample_employee_handbook.pdf    # Your sample PDF (create this)
│   └── sample_handbook_content.txt     # Template content
├── .env                         # Environment variables (create this)
├── .gitignore
├── package.json
├── next.config.js
└── README.md
```

## 🔧 Configuration

### OpenAI Settings

The application uses the following OpenAI configuration (see `app/api/chat/route.js`):

```javascript
{
  model: 'gpt-4-turbo',
  max_completion_tokens: 1000,
  // Note: temperature parameter is not used (not supported with this model)
}
```

### PDF Processing

PDFs are processed using the `pdf-parse` library with dynamic imports to avoid Vercel build issues:

```javascript
const pdfParse = (await import('pdf-parse')).default;
```

## 🌐 Deployment to Vercel

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure the project (Next.js will be auto-detected)

3. **Add environment variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add: `OPENAI_API_KEY` with your OpenAI API key

4. **Deploy**
   - Vercel will automatically build and deploy
   - Subsequent pushes to `main` branch will trigger automatic deployments

5. **Verify deployment**
   - Visit your deployed URL
   - Test the health endpoint: `https://your-app.vercel.app/api/health`
   - Upload a PDF and start chatting!

## 📝 Usage

### Main Application

1. **Initial Load**: The app checks if a default PDF exists
2. **With Default PDF**: Shows chat interface with "Upload New PDF" option
3. **Without PDF**: Shows upload interface
4. **Chatting**: Ask questions about the employee handbook
5. **Upload Custom PDF**: Click "Upload New PDF" to use your own handbook

### Landing Page

Visit `/landing` to see the marketing/information page about Gilda.

### Example Questions

Try asking Gilda:
- "What is the vacation policy?"
- "How do I request time off?"
- "What are the company holidays?"
- "What benefits are available?"
- "What is the dress code?"
- "How do performance reviews work?"

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Key Implementation Details

1. **Dynamic Imports**: pdf-parse is imported dynamically to avoid build errors
2. **In-Memory Processing**: PDFs are not stored persistently (serverless-friendly)
3. **Context Management**: Conversation history is maintained in client state
4. **System Prompt**: Restricts AI responses to handbook content only

## 🔍 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check - returns API status |
| `/api/pdf-status` | GET | Check if default PDF exists |
| `/api/upload-pdf` | POST | Upload and process a PDF file |
| `/api/chat` | POST | Send message and get AI response |

## 🐛 Troubleshooting

### Build Errors

**Problem**: `pdf-parse` causes Vercel build failures

**Solution**: Ensure you're using dynamic imports:
```javascript
const pdfParse = (await import('pdf-parse')).default;
```

### OpenAI API Errors

**Problem**: "Invalid model" or "max_tokens not supported"

**Solution**: Use `gpt-4-turbo` with `max_completion_tokens` (not `max_tokens`)

### PDF Not Loading

**Problem**: Default PDF not found

**Solution**: Ensure `uploads/sample_employee_handbook.pdf` exists and is committed to git

### Landing Page Errors

**Problem**: "You're importing a component that needs useState..."

**Solution**: Ensure landing page has `'use client'` directive at the top

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js 14](https://nextjs.org/)
- Powered by [OpenAI GPT-4 Turbo](https://openai.com/)
- PDF processing with [pdf-parse](https://www.npmjs.com/package/pdf-parse)
- Deployed on [Vercel](https://vercel.com/)

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Happy HR assisting! 🤖**

