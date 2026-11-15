# 🎯 START HERE - Installation & Setup Guide

## 3-Minute Quick Start

### Step 1: Install Package (2 minutes)
Open PowerShell and run:
```powershell
pip install python-docx
```

Wait for: `Successfully installed python-docx`

### Step 2: Start Servers (1 minute)

**Easiest way:** Double-click this file in your project folder:
```
start-servers.bat
```

Two new windows will open. Both should show "running" messages.

**Alternative (manual):**

Open Terminal 1:
```powershell
cd "C:\Users\Mann\Resume Extractor"
python https_server.py
```

Open Terminal 2:
```powershell
cd "C:\Users\Mann\Resume Extractor"
python backend_server.py
```

### Step 3: Use the Application
Open your browser and go to:
```
https://127.0.0.1:8443
```

Click "Advanced" → "Proceed to 127.0.0.1" (ignore certificate warning)

---

## ✅ Verify Everything Works

### Check HTTPS Server
Terminal 1 should show:
```
HTTPS Server running at https://127.0.0.1:8443
127.0.0.1 - - [13/Nov/2025] "GET / HTTP/1.1" 200 -
```

### Check Backend Server
Terminal 2 should show:
```
INFO:root:Backend server running at http://127.0.0.1:8444
```

### Test in Browser
1. Go to `https://127.0.0.1:8443`
2. Upload a resume file
3. Click "Extract Resume"
4. Enter "Software Engineer" in job description field
5. Click "Generate Vetting Report"
6. Wait for report to appear (5-15 seconds)
7. Click "Download" button
8. File should download: `vetting-report-[DATE].docx`

---

## 🆘 If Something Goes Wrong

### Error: "ModuleNotFoundError: No module named 'docx'"
**Solution:**
```powershell
pip install python-docx
```

### Error: "Address already in use"
**Solution:** Port is taken by another program
1. Close the error terminal
2. Run: `Get-Process -Name python | Stop-Process`
3. Try again

### Error: "Backend server may not be running"
**Solution:**
1. Open new terminal
2. Run: `python backend_server.py`
3. Wait for: "Backend server running..."
4. Try download again

### Error: "Template file not found"
**Solution:** Check file exists at:
```
C:\Users\Mann\Resume Extractor\WORD FORMAT 2\Sample 2.docx
```

If not found, you may need to create the file or restore from backup.

### Download doesn't start
**Solution:** Check browser console (Press F12)
1. Go to Console tab
2. Look for red error messages
3. Screenshot and review error

---

## 📋 Features & Workflow

### What to Do:

1. **Upload Resume**
   - Click "Select File"
   - Choose PDF, DOCX, or TXT file
   - Click "Extract Resume"

2. **Enter Job Description**
   - Type the job description in the textarea
   - Example: "Senior Python Developer with 5+ years experience"
   - Click "Generate Vetting Report"

3. **Review Report**
   - Left side: Your extracted resume data
   - Right side: AI vetting analysis
   - Heading: "Why is this resume fit for job description?"

4. **Download to Word**
   - Click the "Download" button
   - File saves as: `vetting-report-2025-11-13.docx`
   - Opens in Microsoft Word
   - Ready to share or edit

---

## 🔄 Complete Example

```
START:
  https://127.0.0.1:8443
  
UPLOAD:
  Click "Select File"
  Choose: resume.pdf
  
EXTRACT:
  Click "Extract Resume"
  → Shows extracted data
  
DESCRIBE:
  Textarea: "Senior Software Engineer"
  
GENERATE:
  Click "Generate Vetting Report"
  → Shows vetting analysis (5-15 seconds)
  
DOWNLOAD:
  Click "Download"
  → File: vetting-report-2025-11-13.docx
  
OPEN:
  Double-click downloaded file
  → Opens in Microsoft Word
  
DONE! ✅
```

---

## 📁 Important Files Location

### Web Application
```
C:\Users\Mann\Resume Extractor\
├── index.html
├── result.html
├── vetting-report.html
└── *.js / *.css files
```

### Backend Server
```
C:\Users\Mann\Resume Extractor\
└── backend_server.py
```

### Word Template
```
C:\Users\Mann\Resume Extractor\WORD FORMAT 2\
└── Sample 2.docx
```

### Documentation
```
C:\Users\Mann\Resume Extractor\
├── QUICK_REFERENCE.md (this file)
├── SETUP_BACKEND.md
├── DOWNLOAD_SETUP.md
├── IMPLEMENTATION_SUMMARY.md
├── FEATURE_SUMMARY.md
└── COMPLETION_CHECKLIST.md
```

---

## ⚙️ System Ports

| Service | Port | URL |
|---------|------|-----|
| HTTPS Web Server | 8443 | https://127.0.0.1:8443 |
| Backend API | 8444 | http://127.0.0.1:8444 |

**Both ports must be available.** If you get "address already in use" error:
- Check if another application is using that port
- Try restarting your computer
- Or change the port (see SETUP_BACKEND.md)

---

## 🎓 Tips & Tricks

### Faster Startup
1. Copy `start-servers.bat` to Desktop
2. Double-click from Desktop instead of navigating to folder

### Keep Browser Open
Keep browser tab open while you work. Data persists in session storage.

### Test Different Resumes
Try multiple resume files to test different scenarios.

### Check Backend Logs
Watch the backend server terminal to see what's happening:
- Requests logged with timestamps
- Errors displayed in real-time

### Clear Session
If something seems stuck:
1. Press F12 in browser
2. Go to Application tab
3. Clear "Session Storage"
4. Reload the page

---

## 🆘 Support Resources

### Quick Help
- `QUICK_REFERENCE.md` - Common tasks & troubleshooting
- `FEATURE_SUMMARY.md` - What features exist

### Detailed Help
- `SETUP_BACKEND.md` - Backend server details
- `IMPLEMENTATION_SUMMARY.md` - Complete technical overview

### For Developers
- `COMPLETION_CHECKLIST.md` - Implementation details
- Code comments in `.py` and `.js` files

---

## ✨ What's Included

✅ Resume upload and extraction
✅ Job description input with validation
✅ Vetting report generation (via n8n webhook)
✅ Beautiful report display
✅ **Word document download** ⭐ NEW
✅ Automatic file naming with dates
✅ Error handling and validation
✅ Complete documentation

---

## 🚀 You're All Set!

1. ✅ Run `pip install python-docx`
2. ✅ Double-click `start-servers.bat`
3. ✅ Go to `https://127.0.0.1:8443`
4. ✅ Upload, analyze, download!

**Questions?** Check the documentation files in the project folder.

---

## 📊 One-Minute Diagram

```
┌─────────────┐
│   Resume    │
│   Upload    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ https://127.0.0.1:8443              │
│ • Extract data                      │
│ • View on left panel                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Job Description Input               │
│ • Type job description              │
│ • Click Generate Vetting Report     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ n8n Webhook (Cloud)                 │
│ • Processes resume vs job desc      │
│ • Returns vetting analysis          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Vetting Report Display              │
│ • Left: Resume                      │
│ • Right: Analysis                   │
│ • Click Download → Word file        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Backend Server (8444)               │
│ • Loads template                    │
│ • Inserts vetting data              │
│ • Returns .docx file                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Download Folder                     │
│ vetting-report-2025-11-13.docx     │
└─────────────────────────────────────┘
```

---

**Ready? Let's go!** 🎉

`pip install python-docx` → Double-click `start-servers.bat` → Open `https://127.0.0.1:8443`

