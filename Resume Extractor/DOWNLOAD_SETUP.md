# Word Document Download Feature - Installation Guide

## Quick Setup (4 Steps)

### Step 1: Install Python Package
Open PowerShell and run:
```powershell
pip install python-docx
```

### Step 2: Verify Installation
```powershell
python -c "from docx import Document; print('✓ python-docx installed!')"
```

### Step 3: Start Backend Server
Open a **NEW PowerShell window** and run:
```powershell
cd "C:\Users\Mann\Resume Extractor"
python backend_server.py
```

You should see:
```
INFO:root:Backend server running at http://127.0.0.1:8444
```

**Keep this window open while using the application.**

### Step 4: Use the Download Feature
1. Open vetting report on `https://127.0.0.1:8443/vetting-report.html`
2. Click the **"Download"** button
3. The report will be automatically inserted into the Word template and downloaded as `vetting-report-[DATE].docx`

---

## How to Run Both Servers

You need **TWO servers running** simultaneously:

**Terminal 1 - HTTPS Server:**
```powershell
cd "C:\Users\Mann\Resume Extractor"
python https_server.py
```

**Terminal 2 - Backend Server:**
```powershell
cd "C:\Users\Mann\Resume Extractor"
python backend_server.py
```

---

## Alternative: Use start-servers.bat

Double-click `start-servers.bat` in the project folder to start both servers automatically.

---

## What It Does

✅ **Fetches** the vetting report HTML displayed on the page
✅ **Preserves** the original Word template (creates a copy)
✅ **Inserts** the report data into the template document
✅ **Downloads** the modified file automatically
✅ **Names** the file with the current date: `vetting-report-2025-11-13.docx`

---

## Template Information

- **Location**: `C:\Users\Mann\Resume Extractor\WORD FORMAT 2\Sample 2.docx`
- **Status**: Never modified - a new copy is made for each download
- **Compatibility**: Works with .docx format (Microsoft Word 2007+)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Backend server may not be running" | Run `python backend_server.py` in a new terminal |
| "ModuleNotFoundError: No module named 'docx'" | Run `pip install python-docx` |
| Port 8444 already in use | Edit `backend_server.py` line 173, change port number |
| Download doesn't start | Check browser console (F12) for error messages |

---

## File Structure

```
c:\Users\Mann\Resume Extractor\
├── https_server.py                    # HTTPS web server
├── backend_server.py                  # Backend API for Word generation
├── vetting-report.js                  # Updated with download functionality
├── vetting-report.html               # Vetting report page
├── start-servers.bat                 # Batch file to start both servers
├── SETUP_BACKEND.md                  # Detailed backend documentation
├── WORD FORMAT 2/
│   └── Sample 2.docx                # Word template (never modified)
└── ...
```

---

## For More Details

See `SETUP_BACKEND.md` for comprehensive documentation including:
- Architecture overview
- Data flow diagram
- Port configuration
- Security notes
