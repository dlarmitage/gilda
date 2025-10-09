# Quick Setup Guide for Gilda HR Assistant

Follow these steps to get Gilda up and running:

## 1. Install Dependencies

```bash
npm install
```

## 2. Create Environment Variables

Create a `.env` file in the root directory:

```bash
OPENAI_API_KEY=your_actual_openai_api_key_here
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

## 3. Generate Sample PDF

Run the PDF generation script:

```bash
node scripts/generate-sample-pdf.js
```

This will create `uploads/sample_employee_handbook.pdf`.

**Alternative**: If you prefer, you can manually create a PDF:
1. Open `uploads/sample_handbook_content.txt`
2. Copy the content to Microsoft Word or Google Docs
3. Format and save as PDF: `uploads/sample_employee_handbook.pdf`

Or use your own employee handbook PDF.

## 4. Start Development Server

```bash
npm run dev
```

## 5. Open in Browser

Navigate to: http://localhost:3000

## 6. Test the Application

- The app should load with the sample PDF
- Try asking: "What is the vacation policy?"
- Test uploading a custom PDF
- Visit the landing page at: http://localhost:3000/landing

## 7. Deploy to Vercel (Optional)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and import your repository

3. Add environment variable in Vercel dashboard:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key

4. Deploy!

## Troubleshooting

### PDF Generation Fails
If the PDF generation script doesn't work, you can:
- Manually create a PDF using the content in `uploads/sample_handbook_content.txt`
- Use any PDF you have available (employee handbook, manual, etc.)

### API Errors
- Verify your OpenAI API key is correct in the `.env` file
- Make sure you have credits available in your OpenAI account
- Check that you're using the correct model (`gpt-4-turbo`)

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`

## Next Steps

- Customize the UI colors and styling
- Replace the sample PDF with your actual employee handbook
- Customize the system prompt in `app/api/chat/route.js`
- Add additional features like conversation export
- Implement user authentication if needed

For more detailed information, see the main [README.md](README.md).

