# 📋 Complete Resume Extraction & Vetting Flow

## System Overview

This application implements a **3-stage webhook processing system** where data flows through multiple steps, with each stage processing the previous stage's output.

---

## **STAGE 1: Initial Resume Extraction & Job Description Collection**

### Location: `result.html` + `result.js`

### What Happens:

1. **User uploads resume** (PDF, Word, or Text)
2. **System extracts resume data** (shown on RIGHT side)
3. **User enters job description** in text box (on LEFT side)
4. **User clicks "Vetting Report" button**

### Data Collected:

```javascript
{
  "data": {
    // Resume extraction (right side of result.html)
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "summary": "...",
    "experience": [...],
    "skills": ["JavaScript", "React", "Node.js"],
    "education": [...]
  },
  "meta": {
    // File metadata
    "fileName": "resume.pdf",
    "fileType": "application/pdf",
    "uploadTime": "2025-11-13T15:00:00Z"
  },
  "jobDescription": "Senior Software Engineer with 5+ years experience..."  // Text from left box
}
```

### Validation:
- ✅ Job description cannot be empty (RED alert popup appears if empty)
- ✅ Resume data must be extracted successfully

### Webhook Call:
```
URL: https://n8n.srv922914.hstgr.cloud/webhook/Vetting%20Report
METHOD: POST
CONTENT-TYPE: application/json
```

---

## **STAGE 2: N8N Webhook Processing & Vetting Report Generation**

### Location: N8N External Service

### What N8N Does:

1. Receives the payload from Stage 1
2. **Compares resume against job description**
3. **Generates vetting report** with findings
4. **Returns formatted report**

### Returns:

```javascript
{
  // Vetting report (analysis of resume vs job description)
  "sections": [
    {
      "name": "Experience Match",
      "status": "PASS",
      "details": "..."
    },
    {
      "name": "Skills Match",
      "status": "PARTIAL",
      "details": "..."
    }
    // ... more sections
  ]
}
```

---

## **STAGE 3: Final Report Processing & Re-submission to Webhook**

### Location: `vetting-report.html` + `vetting-report.js`

### What Happens:

1. **Vetting report displayed** (right side of vetting-report.html)
2. **Original resume shown** (left side)
3. **User reviews the report**
4. **User clicks "📤 Send to Webhook" button** ⭐ NEW FEATURE

### Data Sent Back to Webhook:

```javascript
{
  "jobDescription": "Senior Software Engineer with 5+ years...",  // From Stage 1
  
  "resumeData": {                                                // From Stage 1
    "name": "John Doe",
    "email": "john@example.com",
    "skills": ["JavaScript", "React", "Node.js"]
    // ... full resume data
  },
  
  "vettingReport": "<h2>Skills Match</h2><p>✅ PASS...</p>",    // From Stage 2
  
  "vettingReportJson": {                                         // Original Stage 2 response
    "sections": [...]
  },
  
  "metadata": {                                                  // From Stage 1
    "fileName": "resume.pdf"
  },
  
  "timestamp": "2025-11-13T15:05:00Z"
}
```

### Final Webhook Call:
```
URL: https://n8n.srv922914.hstgr.cloud/webhook/Vetting%20Report
METHOD: POST
CONTENT-TYPE: application/json
BODY: { jobDescription, resumeData, vettingReport, vettingReportJson, metadata, timestamp }
```

---

## **Complete Data Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 1: RESULT PAGE (result.html)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LEFT SIDE                      RIGHT SIDE                      │
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │ Job Description  │           │ Extracted Resume │            │
│  │ Text Box         │  ─────→   │ Data             │            │
│  │ "Enter job desc" │           │ (Name, Email,    │            │
│  └──────────────────┘           │  Skills, Exp)    │            │
│          ↓                       └──────────────────┘            │
│      [Filled?]                          ↓                       │
│   (Red alert if empty)             [Extracted]                  │
│                                        ↓                        │
│                    ┌─────────────────────────────┐              │
│                    │ User clicks "Vetting Report"│              │
│                    └──────────┬──────────────────┘              │
│                               ↓                                 │
│                    COLLECT BOTH DATA PIECES                    │
│                               ↓                                 │
│              ┌────────────────────────────────┐                │
│              │ WEBHOOK CALL - STAGE 1         │                │
│              │ data + meta + jobDescription   │                │
│              └────────────┬───────────────────┘                │
└─────────────────────────────┼──────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 2: N8N WEBHOOK PROCESSING                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: resume + job description                              │
│           ↓                                                    │
│  Process: Compare & Analyze                                   │
│           ↓                                                    │
│  Output: Vetting Report (Pass/Fail per section)              │
│           ↓                                                    │
│  Return formatted HTML/JSON report                            │
│                                                                 │
└─────────────────────────────────────────┬──────────────────────┘
                                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 3: VETTING REPORT PAGE (vetting-report.html)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LEFT SIDE                      RIGHT SIDE                      │
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │ Original Resume  │           │ Vetting Report   │            │
│  │ (from Stage 1)   │           │ (from Stage 2)   │            │
│  │ - Name           │           │ - Skills Match   │            │
│  │ - Email          │           │ - Experience     │            │
│  │ - Skills         │           │ - Education      │            │
│  └──────────────────┘           └──────────────────┘            │
│                                        ↓                        │
│                    ┌─────────────────────────────┐              │
│                    │ 📤 Send to Webhook (NEW)    │              │
│                    └──────────┬──────────────────┘              │
│                               ↓                                 │
│              ┌────────────────────────────────┐                │
│              │ WEBHOOK CALL - STAGE 3 (NEW!)  │                │
│              │ jobDesc + resumeData +         │                │
│              │ vettingReport + metadata       │                │
│              └────────────┬───────────────────┘                │
│                           ↓                                    │
│                    N8N Final Processing                        │
│                           ↓                                    │
│                    Final Output Generated                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## **Key Features**

### ✅ Three-Stage Processing:
1. **Stage 1**: Collect resume + job description → Send to webhook
2. **Stage 2**: N8N processes and generates vetting report
3. **Stage 3**: Review report and send back with ALL data for final processing

### ✅ Data Persistence:
- All data stored in `sessionStorage` for consistency
- Can be retrieved at any stage

### ✅ User Feedback:
- Red alert popup if job description is empty
- Loading state ("⏳ Sending...") while sending to webhook
- Success message ("✅ Sent Successfully!") after completion

### ✅ Complete Data Package:
Each webhook call includes:
- Original resume extraction data
- Job description
- File metadata
- Vetting report results
- Timestamp

---

## **How to Use**

### Step 1: Extract Resume
1. Go to `https://127.0.0.1:8443/result.html`
2. Upload a resume file
3. See extraction results on RIGHT side

### Step 2: Fill Job Description
1. Fill the text box on LEFT side with job description
2. Click "Vetting Report" button

### Step 3: First Webhook Call
- System sends: resume + job description → N8N
- N8N processes and returns vetting report

### Step 4: Review Vetting Report
1. See original resume on LEFT (vetting-report.html)
2. See vetting report on RIGHT

### Step 5: Send for Final Processing (NEW!)
1. Click "📤 Send to Webhook" button
2. System sends: job description + resume + vetting report → N8N
3. N8N can now do final processing with complete context

---

## **Testing the System**

### Test Files Available:
- `TEST_JOB_DESC.html` - Test job description storage
- `WEBHOOK_TEST.html` - Test webhook payload structure
- `COMPLETE_FLOW_GUIDE.md` - This documentation

### Console Logging:
All webhook calls log to browser console:
```javascript
console.log('📤 SENDING TO WEBHOOK:');
console.log('Job Description:', jobDesc);
console.log('Resume Data:', currentData);
console.log('Full Payload:', payload);
```

Open browser Developer Tools (F12) → Console tab to see the logs.

---

## **Webhook Configuration**

### Primary Webhook (Stage 1 & 3):
```
URL: https://n8n.srv922914.hstgr.cloud/webhook/Vetting%20Report
Method: POST
Content-Type: application/json
```

### Request/Response Flow:
```
Frontend → Webhook (POST with data)
             ↓
            N8N (Processes)
             ↓
Frontend ← Webhook (Returns processed result)
```

---

## **Summary**

This system implements a complete three-stage processing pipeline:

1. **Stage 1**: User submits resume + job description
2. **Stage 2**: N8N generates vetting report
3. **Stage 3**: User reviews and re-submits for final processing

**Both pieces of data (job description + resume extraction)** are sent to the webhook at **both Stage 1 and Stage 3**, allowing N8N to:
- Perform initial analysis (Stage 1)
- Allow user review (Stage 2)
- Perform final processing with complete context (Stage 3)

✅ **System is fully integrated and ready to use!**
