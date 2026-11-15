# 🎨 Visual Guide - Complete System Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                    https://127.0.0.1:8443                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐          ┌──────────────────────────┐   │
│  │  result.html     │          │  vetting-report.html     │   │
│  ├──────────────────┤          ├──────────────────────────┤   │
│  │ • Upload File    │    →     │ • Display Report        │   │
│  │ • Extract Data   │          │ • Two Panels            │   │
│  │ • Input Job Desc │    →     │ • Download Button  ✨   │   │
│  └──────────────────┘          └──────────────────────────┘   │
│         │                                    │                 │
│         │ (Resume + Job Desc)               │ (Vetting HTML) │
│         ▼                                    ▼                 │
│      ┌──────────────────────────────────────────────┐          │
│      │         SessionStorage                       │          │
│      │  • resume_extractor_result                  │          │
│      │  • job_description                          │          │
│      │  • uploadedFileMeta                         │          │
│      │  • vetting_report_webhook_result           │          │
│      └──────────────────────────────────────────────┘          │
│         │                                    │                 │
└─────────┼────────────────────────────────────┼─────────────────┘
          │                                    │
          │ POST JSON                         │ POST JSON + HTML
          │                                   │
          ▼                                   ▼
    ┌────────────────┐              ┌──────────────────────┐
    │   n8n Webhook  │              │ Backend Server       │
    │  (Cloud)       │              │ (HTTP 8444) ✨      │
    │                │              │                      │
    │ • Receive JSON │              │ • Receive vetting   │
    │ • Analyze      │              │ • Load template     │
    │ • Return HTML  │              │ • Insert content    │
    │                │              │ • Create .docx      │
    └────────────────┘              │ • Return blob       │
          │                         └──────────────────────┘
          │ (Vetting HTML)                    │
          │                                   │ (.docx blob)
          └──────────────┬────────────────────┘
                         │
                         ▼
                    Browser Download
                    vetting-report-
                    2025-11-13.docx
```

---

## User Workflow Diagram

```
START
  │
  ▼
┌─────────────────────────────────────────┐
│ User Goes to:                           │
│ https://127.0.0.1:8443                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 📄 Upload Resume                        │
│                                         │
│ Select File: resume.pdf                │
│ Format: PDF, DOCX, or TXT             │
│                                         │
│ [Select File] [Extract Resume]        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ ✓ Resume Extracted                      │
│                                         │
│ Left Panel Shows:                      │
│ • Name                                 │
│ • Contact Info                        │
│ • Experience                          │
│ • Skills                              │
│ • Education                           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 📋 Enter Job Description                │
│                                         │
│ [Textarea with job description]       │
│                                         │
│ Example:                               │
│ "Senior Python Developer with 5+ yrs" │
│                                         │
│ [Generate Vetting Report]             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 🔄 Processing (5-15 seconds)            │
│                                         │
│ • Sending to webhook...                │
│ • n8n processing...                   │
│ • Generating report...                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 📊 Vetting Report Generated             │
│                                         │
│ Left Panel         │ Right Panel       │
│ ─────────────────  │ ─────────────────  │
│ Resume Data       │ Vetting Analysis  │
│ • Extracted Info  │                   │
│                   │ Why is this       │
│                   │ resume fit for    │
│                   │ job description?  │
│                   │ ─────────────────  │
│                   │                   │
│                   │ [Analysis content]│
│                   │                   │
│                   │ [Download Button] │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 💾 Download Report (NEW FEATURE!) ✨    │
│                                         │
│ User clicks [Download]                │
│                                         │
│ Backend server:                        │
│ 1. Loads Word template                │
│ 2. Inserts vetting content            │
│ 3. Creates .docx file                │
│ 4. Returns to browser                │
│                                         │
│ Browser downloads:                    │
│ vetting-report-2025-11-13.docx       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 📝 Open in Microsoft Word               │
│                                         │
│ File Location:                         │
│ C:\Users\[User]\Downloads\            │
│ vetting-report-2025-11-13.docx       │
│                                         │
│ Ready to:                              │
│ • Review                              │
│ • Edit                                │
│ • Share                               │
│ • Print                               │
└──────────────┬──────────────────────────┘
               │
               ▼
             DONE! ✅
```

---

## Feature Comparison

```
Before Update          │ After Update
─────────────────────  │ ─────────────────────
Upload Resume     ✅   │ Upload Resume     ✅
Extract Data      ✅   │ Extract Data      ✅
Job Description   ✅   │ Job Description   ✅
Vetting Report    ✅   │ Vetting Report    ✅
Display Report    ✅   │ Display Report    ✅
Clean Headings    ✅   │ Clean Headings    ✅
                       │
No Download       ❌   │ Download to Word  ✅ NEW!
No Template       ❌   │ Template Support  ✅ NEW!
No .docx File     ❌   │ .docx Download    ✅ NEW!
                       │
                       │ Auto Date-Stamp   ✅ NEW!
                       │ Template Preserved ✅ NEW!
                       │ Backend Server    ✅ NEW!
```

---

## Data Flow Visualization

```
┌──────────────┐
│ User Uploads │
│    Resume    │
└───────┬──────┘
        │
        ▼
┌──────────────────┐
│ Browser Extracts │
│      Data        │
└───────┬──────────┘
        │
        ├─────────────────────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────────────┐      ┌──────────────────┐
│  sessionStorage[     │      │  Display on      │
│    'resume_...      │      │  result.html     │
│    result']         │      │  (Left Panel)    │
└──────────────────────┘      └──────────────────┘
        │
        │ + Job Description
        │
        ▼
┌──────────────────────┐
│  JSON Payload:       │
│  {                   │
│    data: {...},      │
│    meta: {...},      │
│    jobDescription: ""|
│  }                   │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│   n8n Webhook        │
│   (Cloud Service)    │
└────────┬─────────────┘
         │
         │ Vetting Analysis
         │
         ▼
┌──────────────────────┐
│  sessionStorage[     │
│    'vetting_...      │
│    webhook_result']  │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Display on          │
│  vetting-report.html │
│  (Right Panel)       │
└────────┬─────────────┘
         │
         │ User clicks Download
         │
         ▼
┌──────────────────────────────────┐
│  Frontend Collects:              │
│  • Vetting HTML (from DOM)       │
│  • Job Description (sessionStor.)│
│  • Resume Data (sessionStorage)  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  POST to Backend                 │
│  http://127.0.0.1:8444/api/      │
│  generate-report                 │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Backend Server:                 │
│  1. Load template                │
│  2. Create temp copy             │
│  3. Insert vetting content       │
│  4. Save as .docx                │
│  5. Return blob                  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Browser:                        │
│  • Receives blob                 │
│  • Creates download link         │
│  • Triggers download             │
│  • Saves to Downloads folder     │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  File: vetting-report-2025-      │
│  11-13.docx                      │
│                                  │
│  Ready to open in Word ✅        │
└──────────────────────────────────┘
```

---

## Server Architecture

```
┌─────────────────────────────────┐
│    Local Machine                │
├─────────────────────────────────┤
│                                 │
│ Port 8443:                      │
│ ┌──────────────────────────────┐│
│ │ HTTPS Server                 ││
│ │ (https_server.py)            ││
│ │                              ││
│ │ Serves:                      ││
│ │ • index.html                 ││
│ │ • result.html                ││
│ │ • vetting-report.html        ││
│ │ • *.js / *.css files         ││
│ └──────────────────────────────┘│
│           │                      │
│           ▼                      │
│ ┌──────────────────────────────┐│
│ │   Browser at Port 8443       ││
│ │   https://127.0.0.1:8443    ││
│ │                              ││
│ │ • Loads HTML/CSS/JS         ││
│ │ • Handles user interaction  ││
│ │ • Sends data to servers     ││
│ └──────────────────────────────┘│
│                                 │
│ Port 8444:                      │
│ ┌──────────────────────────────┐│
│ │ Backend Server               ││
│ │ (backend_server.py)          ││
│ │                              ││
│ │ Endpoint:                    ││
│ │ /api/generate-report         ││
│ │                              ││
│ │ Functions:                   ││
│ │ • Receive vetting data       ││
│ │ • Load Word template         ││
│ │ • Insert content             ││
│ │ • Generate .docx file        ││
│ │ • Return blob to browser     ││
│ └──────────────────────────────┘│
│           │                      │
│           ▼                      │
│ ┌──────────────────────────────┐│
│ │   Template File              ││
│ │ WORD FORMAT 2/Sample 2.docx  ││
│ │                              ││
│ │ Status:                      ││
│ │ ✅ Never Modified (Copy Used)││
│ └──────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
         │          │
         │          │ External
         │          │
         ▼          ▼
    ┌────────┐  ┌──────────┐
    │ Browser│  │n8n Cloud │
    │Download│  │ Webhook  │
    └────────┘  └──────────┘
```

---

## Installation Steps Diagram

```
Step 1: Install Package
─────────────────────────────
$ pip install python-docx
         │
         ▼
  Waiting... (30 seconds)
         │
         ▼
  ✅ Successfully installed
         │
         ▼
Step 2: Start Servers
─────────────────────────────
         │
    ┌────┴────┐
    │          │
    ▼          ▼
 Option A   Option B
Double-   Manual:
click     Terminal1
.bat    Terminal2

Option A Route:
 │
 ├──→ start-servers.bat
 │
 ├──→ Opens Terminal 1
 │   └─→ python https_server.py
 │
 └──→ Opens Terminal 2
     └─→ python backend_server.py

Step 3: Open Browser
─────────────────────────────
 │
 ▼
https://127.0.0.1:8443
 │
 ├─→ Ignore cert warning
 │   └─→ Click "Advanced"
 │       └─→ "Proceed to 127.0.0.1"
 │
 ▼
✅ Application Ready!
```

---

## Troubleshooting Flowchart

```
         Error Occurs?
              │
              ▼
    ┌──────────────────────┐
    │ What's the error?    │
    └──────────────────────┘
         │    │    │    │
    ┌────┘    │    │    └────┐
    │         │    │         │
    ▼         ▼    ▼         ▼
Backend  Port  No   Template
Not      In    Data Not
Running  Use       Found

│         │    │    │
▼         ▼    ▼    ▼
Start   Change Reload Check
Server  Port    Page  Path
│       │      │     │
▼       ▼      ▼     ▼
✅      ✅     ✅    ✅

Still not working?
    │
    ▼
Check docs:
• README_SETUP.md
• QUICK_REFERENCE.md
• SETUP_BACKEND.md
    │
    ▼
  ✅ Fixed!
```

---

## Feature Matrix

```
Feature              │ Status │ Location
─────────────────────┼────────┼──────────────────────
Upload Resume        │  ✅    │ result.html
Extract Data         │  ✅    │ result.js
Job Description      │  ✅    │ result.html
Input Validation     │  ✅    │ result.js
Alert Popup          │  ✅    │ result.html/js
Session Storage      │  ✅    │ result.js
Webhook Integration  │  ✅    │ result.js
Vetting Report       │  ✅    │ vetting-report.html
Two-Panel Display    │  ✅    │ vetting-report.html
Clean Headings       │  ✅    │ vetting-report.js
Remove Duplicates    │  ✅    │ vetting-report.js
Download Button      │  ✅    │ vetting-report.html
Backend Server       │  ✅    │ backend_server.py
Template Loading     │  ✅    │ backend_server.py
Content Insertion    │  ✅    │ backend_server.py
File Generation      │  ✅    │ backend_server.py
Blob Download        │  ✅    │ vetting-report.js
Date Stamping        │  ✅    │ vetting-report.js
Error Handling       │  ✅    │ All files
Logging              │  ✅    │ backend_server.py
```

---

**All systems operational! 🚀**

---

*Last Updated: November 13, 2025*
*Status: ✅ Production Ready*
