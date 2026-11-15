# Backend Server Setup for Word Document Generation

## Overview
The vetting report download feature requires a backend server to merge data into Word templates. This guide explains how to set it up.

## Prerequisites
- Python 3.7 or higher
- pip package manager

## Installation Steps

### Step 1: Install Required Package
Run this command in PowerShell:

```powershell
pip install python-docx
```

### Step 2: Verify Installation
Check that it installed correctly:

```powershell
python -c "from docx import Document; print('python-docx is installed!')"
```

## Running the Backend Server

### Option 1: Run in a New Terminal
1. Open a **new PowerShell terminal**
2. Navigate to the project directory:
   ```powershell
   cd "c:\Users\Mann\Resume Extractor"
   ```
3. Start the backend server:
   ```powershell
   python backend_server.py
   ```
4. You should see:
   ```
   INFO:root:Backend server running at http://127.0.0.1:8444
   ```

### Option 2: Run in the Background (Recommended)
Use this PowerShell script to run the server in the background:

```powershell
$pythonExe = "python"
$scriptPath = "C:\Users\Mann\Resume Extractor\backend_server.py"
Start-Process -NoNewWindow -FilePath $pythonExe -ArgumentList $scriptPath
```

## How It Works

1. **User clicks Download** on the Vetting Report page
2. **Frontend (vetting-report.js)** collects:
   - The vetting report HTML displayed on screen
   - Job description from session storage
   - Resume data from session storage
3. **Frontend sends** this data to the backend server at `http://127.0.0.1:8444/api/generate-report`
4. **Backend server**:
   - Creates a copy of the template file (`Sample 2.docx`)
   - Inserts the vetting report data into the document
   - Preserves the original template file
5. **Backend returns** the modified document as a downloadable .docx file
6. **Browser automatically downloads** the file as `vetting-report-[DATE].docx`

## Template File Location
- **Original Template**: `C:\Users\Mann\Resume Extractor\WORD FORMAT 2\Sample 2.docx`
- **Status**: Never modified (a copy is made for each download)

## Troubleshooting

### Error: "Backend server may not be running"
**Solution**: Start the backend server using one of the methods above

### Error: "python-docx is not installed"
**Solution**: Run `pip install python-docx` in PowerShell

### Error: "Template file not found"
**Possible Causes**:
- The path `C:\Users\Mann\Resume Extractor\WORD FORMAT 2\Sample 2.docx` doesn't exist
- Check that the file exists in Windows Explorer
- Verify the file is named exactly `Sample 2.docx`

### Port Already in Use
If port 8444 is already in use:
1. Stop the backend server
2. Edit `backend_server.py` line 173: change `run_server(8444)` to `run_server(8445)`
3. Edit `vetting-report.js` line 870: change `http://127.0.0.1:8444/api/generate-report` to match

## Running Both Servers

You need to run **TWO** servers simultaneously:

1. **HTTPS Server** (for the web interface):
   ```powershell
   python https_server.py
   ```
   Runs on: `https://127.0.0.1:8443`

2. **Backend Server** (for document generation):
   ```powershell
   python backend_server.py
   ```
   Runs on: `http://127.0.0.1:8444`

Use separate terminal windows for each.

## Quick Start Script

Create a file named `start-servers.bat`:

```batch
@echo off
start "HTTPS Server" cmd /k "cd C:\Users\Mann\Resume Extractor && python https_server.py"
start "Backend Server" cmd /k "cd C:\Users\Mann\Resume Extractor && python backend_server.py"
echo Both servers started. Open https://127.0.0.1:8443 in your browser.
```

Then just double-click `start-servers.bat` to start both servers at once.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ User Views Vetting Report on https://127.0.0.1:8443            │
│ (vetting-report.html + vetting-report.js)                      │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ User clicks "Download"
                   ▼
        ┌──────────────────────────┐
        │ Frontend Collects Data:  │
        │ - Vetting HTML           │
        │ - Job Description        │
        │ - Resume Data            │
        └──────────┬───────────────┘
                   │
                   │ POST to http://127.0.0.1:8444/api/generate-report
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend Server (backend_server.py on port 8444)                 │
│                                                                  │
│ 1. Receives vetting data JSON                                   │
│ 2. Copies Sample 2.docx template                               │
│ 3. Inserts vetting content into copy                           │
│ 4. Returns modified .docx file                                 │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ Returns .docx blob
                   ▼
        ┌──────────────────────────┐
        │ Browser receives file    │
        │ Triggers download        │
        │ Saves as:               │
        │ vetting-report-[DATE].docx
        └──────────────────────────┘
```

## Security Notes

- The backend server only accepts POST requests with JSON payloads
- It creates temporary files that are automatically deleted after download
- The original template file is never modified
- Connections are local (127.0.0.1) only
