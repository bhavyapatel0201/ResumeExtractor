# Resume Extractor

## How to use
1. Open index.html in your browser
2. Paste your n8n Webhook URL
3. Click Select File and pick a resume
4. Click Upload

## Notes
- File field name sent: file (multipart/form-data)
- Allowed types: .pdf, .doc, .docx, .txt
- Shows selected filename and upload status

## n8n tips
- Use a Webhook node (method: POST)
- Access binary under binary.file
- From file:// pages, enable Webhook Response and allow CORS