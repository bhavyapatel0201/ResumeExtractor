# Quick Reference - Resume Extractor with Word Download

## 🚀 Quick Start

### Installation (One-time)
```powershell
pip install python-docx
```

### Start Application
**Option 1: Automatic**
- Double-click `start-servers.bat`

**Option 2: Manual**
- Terminal 1: `python https_server.py`
- Terminal 2: `python backend_server.py`

### Access Application
Open browser to: **`https://127.0.0.1:8443`**

---

## 📋 Usage Steps

1. **Upload Resume**
   - Click "Select File"
   - Choose PDF, DOCX, or TXT
   - Click "Extract Resume"

2. **Enter Job Description**
   - Type job description in textarea
   - Click "Generate Vetting Report"
   - Wait for webhook response

3. **Review Report**
   - Left panel: Extracted resume
   - Right panel: Vetting analysis
   - Heading: "Why is this resume fit for job description?"

4. **Download as Word**
   - Click "Download" button
   - File saves as `vetting-report-[DATE].docx`
   - Opens in Downloads folder

---

## 🔧 Server Details

| Server | URL | Port | Purpose |
|--------|-----|------|---------|
| HTTPS | https://127.0.0.1:8443 | 8443 | Web interface |
| Backend | http://127.0.0.1:8444 | 8444 | Word generation |

**Status Check:**
- HTTPS: `python https_server.py` → "HTTPS Server running..."
- Backend: `python backend_server.py` → "Backend server running..."

---

## 📁 Important Files

- `result.html` - Upload & job description
- `vetting-report.html` - Display & download
- `vetting-report.js` - Download logic
- `backend_server.py` - Word document API
- `WORD FORMAT 2/Sample 2.docx` - Template (never modified)
- `start-servers.bat` - Auto-start both servers

---

## ⚙️ Configuration

### Change Backend Port
Edit `backend_server.py` line 173:
```python
run_server(8444)  # Change 8444 to desired port
```

Then update `vetting-report.js` line ~870:
```javascript
var backendUrl = 'http://127.0.0.1:8444/api/generate-report';
```

### Change HTTPS Port
Edit `https_server.py` and update:
```python
server_address = ('127.0.0.1', 8443)  # Change port here
```

---

## 🆘 Troubleshooting

| Issue | Fix |
|-------|-----|
| "Backend not running" | Run `python backend_server.py` in new terminal |
| "python-docx not found" | Run `pip install python-docx` |
| "Port in use" | Stop other server or change port number |
| "Template not found" | Verify file at `WORD FORMAT 2/Sample 2.docx` |
| "Download fails" | Check browser console (F12) for errors |
| "HTTPS cert warning" | Normal - click "Advanced" → "Proceed" |

---

## 📊 Data Flow

```
Upload Resume → Extract Data → Enter Job Desc
     ↓              ↓                ↓
   [result.html]   [webhook]    [vetting-report.html]
                      ↓
                  n8n Cloud
                      ↓
              Vetting Analysis Back
                      ↓
                  Display Report
                      ↓
              Click Download Button
                      ↓
          Send to Backend Server
                      ↓
        Insert into Word Template
                      ↓
          Download .docx File
                      ↓
              Open in Word
```

---

## 📝 File Outputs

**Downloaded File:**
- Name: `vetting-report-2025-11-13.docx`
- Format: Microsoft Word (.docx)
- Contents: Vetting analysis from right panel
- Location: Your Downloads folder

**Original Template:**
- Path: `C:\Users\Mann\Resume Extractor\WORD FORMAT 2\Sample 2.docx`
- Status: ✅ Never modified (copy is made for each download)
- Changes: Safe to re-use template

---

## 🔐 Security Notes

✅ Local connections only (127.0.0.1)
✅ Temporary files auto-deleted
✅ Original template never modified
✅ Self-signed HTTPS cert (for development)

---

## 📱 Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Edge
- ✅ Safari
- ✅ Opera

**Minimum**: Any modern browser with ES5+ JavaScript support

---

## 💾 Ports Reference

- **8443** = HTTPS Server (secure web interface)
- **8444** = Backend Server (document generation API)

Both must be available and not blocked by firewall.

---

## 📞 Need Help?

1. Check browser console: **F12 → Console**
2. Check backend logs: Look at terminal running `backend_server.py`
3. Check network: **F12 → Network** (see API calls)
4. Read detailed docs: See `SETUP_BACKEND.md` or `IMPLEMENTATION_SUMMARY.md`

---

## ✅ Verification Checklist

Before reporting issues, verify:

- [ ] `python backend_server.py` shows "running at http://127.0.0.1:8444"
- [ ] `python https_server.py` shows "HTTPS Server running at..."
- [ ] Browser can access `https://127.0.0.1:8443` (ignore cert warning)
- [ ] File `WORD FORMAT 2/Sample 2.docx` exists
- [ ] `python-docx` installed (`pip install python-docx`)
- [ ] Firewall allows ports 8443 and 8444

---

## 🎯 Common Tasks

### Test Download Feature
1. Upload any resume
2. Enter "Senior Software Engineer" as job description
3. Click "Generate Vetting Report"
4. Wait for response
5. Click "Download"
6. File should download and open in Word

### Troubleshoot Backend
1. Terminal: `python backend_server.py`
2. When error appears, read error message
3. Check that `WORD FORMAT 2/Sample 2.docx` exists
4. Verify `python-docx` is installed

### View Network Requests
1. Press F12 in browser
2. Go to "Network" tab
3. Click "Download" button
4. Look for POST to `127.0.0.1:8444/api/generate-report`
5. Check response status (200 = success)

---

**Version**: 1.0
**Last Updated**: November 13, 2025
**Status**: ✅ Ready for Production
