'use strict';
(function(){
  var fileInput = document.getElementById('fileInput');
  var fileBox = document.getElementById('fileBox');
  var uploadBtn = document.getElementById('uploadBtn');
  var statusEl = document.getElementById('status');
  var demoBtn = document.getElementById('demoBtn');
  var modal = document.getElementById('demoModal');
  var closeModal = document.getElementById('closeModal');
  var demoTextEl = document.getElementById('demoText');
  var dropzone = document.querySelector('.dropzone');
  var dropFilename = document.getElementById('dropFilename');
  function runFilenameCelebration(){
    try{
      var dzRect = (dropzone || fileInput).getBoundingClientRect();
      var anchor = document.getElementById('dropFilename') || (dropzone ? dropzone.querySelector('.choose') : null);
      var aRect = anchor ? anchor.getBoundingClientRect() : dzRect;
      var cx = aRect.left + aRect.width/2; var cy = aRect.top + aRect.height/2;
      var ringCount = 3;
      var petalsPerRing = 16;
      var maxRadius = Math.max(dzRect.width, dzRect.height) * 0.55;
      var colors = ['#ef4444','#f97316','#f59e0b','#22c55e','#06b6d4','#8b5cf6','#ec4899'];
      var core = document.createElement('div'); core.className='flower-core'; core.style.left=cx+'px'; core.style.top=cy+'px'; core.style.transform='translate(-50%,-50%)'; animLayer.appendChild(core);
      for (var r=1; r<=ringCount; r++){
        (function(r){
          for (var i=0;i<petalsPerRing;i++){
            (function(i){
              var petal = document.createElement('div'); petal.className='petal';
              petal.style.background = colors[(i+r) % colors.length];
              animLayer.appendChild(petal);
              var ang = (Math.PI*2) * (i/petalsPerRing) + (r*0.2);
              var targetR = (maxRadius * (r/(ringCount+0.4)));
              var duration = 900 + r*250;
              var start = null;
              function step(ts){
                if(!start) start = ts;
                var p = Math.min(1, (ts - start)/duration);
                var ease = p<.5 ? 2*p*p : -1+(4-2*p)*p;
                var x = cx + Math.cos(ang) * targetR * ease;
                var y = cy + Math.sin(ang) * targetR * ease;
                petal.style.left = x + 'px'; petal.style.top = y + 'px';
                petal.style.transform = 'translate(-50%,-50%) rotate(' + (ang*180/Math.PI+90) + 'deg)';
                petal.style.opacity = String(1 - p*0.2);
                if (p < 1) requestAnimationFrame(step); else setTimeout(function(){ try{ animLayer.removeChild(petal); }catch(e){} }, 600);
              }
              requestAnimationFrame(step);
            })(i);
          }
        })(r);
      }
      setTimeout(function(){ try{ animLayer.removeChild(core); }catch(e){} }, 2000);
    }catch(e){}
  }
  var progressWrap = document.getElementById('progressWrap');
  var progressBar = document.getElementById('progressBar');
  var progressTimer = null;
  var progressValue = 0;
  var animLayer = document.getElementById('animLayer');

  var WEBHOOK_URL = 'https://n8n.srv922914.hstgr.cloud/webhook/Resume';
  var DEMO_TEXT_URL = 'demo/demo_resume.txt';
  var DEMO_INLINE_TEXT = `Candidate Info
Name: Jane Doe
Email: jane.doe@example.com
Phone: +1 555-123-4567
Location: San Francisco, CA
LinkedIn: linkedin.com/in/janedoe
GitHub: github.com/janedoe

Professional Summary
Full-stack software engineer with 7+ years of experience building scalable web applications, APIs, and rich user interfaces. Passionate about clean architecture, developer experience, and measurable outcomes. Adept at translating ambiguous requirements into robust, well-tested solutions.

Skills
- Languages: TypeScript, JavaScript, Python, Go, SQL
- Frameworks: React, Next.js, Node.js, Express, FastAPI
- Cloud: AWS (EC2, S3, Lambda, API Gateway), Vercel, Netlify
- Databases: PostgreSQL, MySQL, MongoDB, Redis
- Tooling: GitHub Actions, Docker, Terraform, Nx, Turborepo
- Testing: Jest, React Testing Library, Cypress, Playwright, PyTest

Work Experience
Company: Acme Corp
Role: Senior Software Engineer
Dates: Jan 2022 - Present
- Led migration of a legacy monolith to a modular Next.js platform, improving Time To First Byte by 48% and Core Web Vitals across LCP/CLS.
- Designed and implemented a typed contract between frontend and backend via tRPC, eliminating 70% of API schema mismatch bugs.
- Introduced server-driven UI configuration, enabling A/B tests to be shipped without frontend redeploys.
- Implemented CI pipelines (GitHub Actions) with full test matrix and preview URL deploys on PRs.

Company: Bright Labs
Role: Software Engineer
Dates: Aug 2019 - Dec 2021
- Built a real-time collaboration editor using CRDTs and WebSockets, scaling to >10k concurrent users with under 200ms latency.
- Optimized API queries and added indexes, reducing P99 API latency by 65%.
- Partnered with data team to launch an analytics funnel, informing product decisions that increased activation by 12%.

Company: Startly
Role: Junior Software Engineer
Dates: Jul 2017 - Jul 2019
- Implemented customer onboarding flows and role-based access controls.
- Wrote integration tests covering payments and email flows; reduced regressions by 40%.

Education
University of Example
Bachelor of Science in Computer Science
Graduated: 2017
GPA: 3.8/4.0

Certifications
- AWS Certified Developer – Associate
- Google Professional Cloud Developer

Projects
Project: TaskPilot
- A cross-platform task manager with offline-first syncing, built with React Native and SQLite.
- Implemented end-to-end encryption for user data using libsodium.

Project: MovieScope
- A movie search and discovery app powered by TMDB, featuring server-side rendering and image optimization.
- Reached 15k monthly active users and open-sourced the codebase.

Publications
- "Designing Typed Contracts for Distributed Systems" — TechConf 2023
- "Optimizing React Rendering at Scale" — WebPerf Summit 2022

Speaking Engagements
- JSConf: "State Machines for UI — Reliable Frontends"
- DevOps Days: "From CI to Continuous Confidence"

Work Preferences
- Hybrid or Remote-first teams
- Product-minded engineering culture
- Emphasis on mentorship and pair programming

Emergency Contact
Name: John Doe
Relationship: Sibling
Phone: +1 555-987-6543

Social Presence
Twitter: twitter.com/janedoe
Blog: blog.janedoe.dev`;

  function setStatus(message, type){
    statusEl.textContent = message;
    statusEl.className = 'status' + (type ? (' ' + type) : '');
  }

  function getExtension(fileName){
    var idx = fileName.lastIndexOf('.');
    if (idx > 0 && idx < fileName.length - 1){
      return '.' + fileName.slice(idx + 1).toLowerCase();
    }
    return 'unknown';
  }

  function escapeHtml(s){
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function formatResumeText(text){
    var t = String(text).replace(/\r\n?/g,'\n');
    var lines = t.split('\n');
    var html = '';
    var openList = false;
    function closeList(){ if(openList){ html += '</ul>'; openList = false; }}
    var headingRe = /^(Candidate Info|Contact|Professional Summary|Employment History|Experience|Work Experience|Education|Skills|Technical Skills|Tools Used|Functional Skills|Certifications|Emergency Contact|Social Presence|Publications|Work Preferences|Speaking Engagements)\b/i;
    for (var i = 0; i < lines.length; i++){
      var line = lines[i];
      if (!line) continue;
      line = line.replace(/\u000b/g,' ').trim();
      if (!line) continue;
      var head = line.replace(/:$/,'');
      if (headingRe.test(head)){
        closeList();
        html += "<section class='demo-section'><h3>" + escapeHtml(head) + "</h3>";
        continue;
      }
      if (/^(\-||\*)\s/.test(line)){
        if (!openList){ html += '<ul>'; openList = true; }
        html += '<li>' + escapeHtml(line.replace(/^(\-||\*)\s*/, '')) + '</li>';
        continue;
      }
      var kv = line.match(/^([A-Za-z][A-Za-z ]{1,30}):\s*(.+)$/);
      if (kv){
        closeList();
        html += "<div class='kv'><div class='k'>" + escapeHtml(kv[1]) + "</div><div class='v'>" + escapeHtml(kv[2]) + "</div></div>";
        continue;
      }
      closeList();
      html += '<p>' + escapeHtml(line) + '</p>';
    }
    closeList();
    return html;
  }

  function setProgress(pct){
    progressValue = Math.max(0, Math.min(100, pct|0));
    if (progressBar){ progressBar.style.width = progressValue + '%'; }
  }
  function showProgress(){
    if (progressWrap){ progressWrap.classList.remove('hidden'); progressWrap.removeAttribute('aria-hidden'); }
    setProgress(0);
  }
  function hideProgress(){
    if (progressWrap){ progressWrap.classList.add('hidden'); progressWrap.setAttribute('aria-hidden','true'); }
    setProgress(0);
  }
  function startContinuousProgress(){
    stopContinuousProgress();
    // Slowly advance toward 90-95% while waiting
    var ceiling = 95;
    var step = 1.5; // percent per tick
    var intervalMs = 600; // slower cadence
    progressTimer = setInterval(function(){
      if (progressValue < ceiling){
        setProgress(Math.min(ceiling, progressValue + step));
      }
    }, intervalMs);
  }
  function stopContinuousProgress(){
    if (progressTimer){ clearInterval(progressTimer); progressTimer = null; }
  }

  if (dropzone){
    dropzone.addEventListener('click', function(e){
      e.preventDefault();
      if (fileInput) fileInput.click();
    });
    dropzone.addEventListener('dragover', function(e){ e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', function(){ dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', function(e){
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
      var f = e.dataTransfer.files[0];
      fileInput.files = e.dataTransfer.files;
      var ext = getExtension(f.name);
      fileBox.textContent = '';
      if (dropFilename){ dropFilename.textContent = f.name; dropzone.classList.add('has-file'); }
      if (uploadBtn) uploadBtn.disabled = false;
      hideProgress();
    });
  }

  if (fileInput){
    fileInput.addEventListener('change', function(){
      var file = fileInput.files && fileInput.files[0];
      if (file){
        var ext = getExtension(file.name);
        fileBox.textContent = '';
        if (dropFilename){ dropFilename.textContent = file.name; dropzone.classList.add('has-file'); }
        if (uploadBtn) uploadBtn.disabled = false;
        hideProgress();
        // Defer to next frame so filename layout is updated, then run celebration
        requestAnimationFrame(runFilenameCelebration);
      } else {
        fileBox.textContent = 'No file selected';
        if (dropFilename){ dropFilename.textContent = ''; dropzone.classList.remove('has-file'); }
        if (uploadBtn) uploadBtn.disabled = true;
        hideProgress();
      }
    });
  }
  // Using constant WEBHOOK_URL; no dynamic input

  if (uploadBtn){
    uploadBtn.addEventListener('click', function(){
      var file = fileInput.files && fileInput.files[0];
      var webhookUrl = WEBHOOK_URL;
      if (!file){ setStatus('Please select a PDF or DOCX first.', 'error'); return; }
      var ext = getExtension(file.name);
      if (ext !== '.pdf' && ext !== '.docx'){ setStatus('Only PDF or DOCX allowed.', 'error'); return; }
      uploadBtn.disabled = true;
      setStatus('Uploading...');
      showProgress();
      startContinuousProgress();
      // Plane animation: start at button -> 3.5 loops around viewport -> end at progress bar (8s total)
      try{
        var btnRect = uploadBtn.getBoundingClientRect();
        var barRect = (progressWrap || document.body).getBoundingClientRect();
        var startX = btnRect.left + btnRect.width/2; var startY = btnRect.top + btnRect.height/2;
        var endX = barRect.left + 20; var endY = barRect.top + 6;
        // Orbit around the dotted dropzone box, not the whole screen
        var dzRect = (dropzone || uploadBtn).getBoundingClientRect();
        var cx = dzRect.left + dzRect.width/2;
        var cy = dzRect.top + dzRect.height/2;
        // Path offset to move orbit up and right
        var pathOffsetX = 40; // pixels to the right
        var pathOffsetY = -30; // pixels upward
        cx += pathOffsetX; 
        cy += pathOffsetY;
        // Slightly outside the box edges
        var rx = dzRect.width/2 + 40;
        var ry = dzRect.height/2 + 30;
        // Determine starting angle based on start point relative to center
        var startAng = Math.atan2(startY - cy, startX - cx);
        var laps = 2; // two full rotations
        var endAng = startAng + Math.PI * 2 * laps;
        var joinDuration = 800; // slower join
        var orbitDuration = 7000; // slower orbit over 2 laps
        var finishDuration = 200; // quick finish
        var totalDuration = joinDuration + orbitDuration + finishDuration; // 8000
        // Target point on ellipse to join
        var joinX = cx + rx * Math.cos(startAng);
        var joinY = cy + ry * Math.sin(startAng);
        var plane = document.createElement('div');
        plane.className = 'plane';
        plane.innerHTML = "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M2.5 19l19.5-7-19.5-7 5 7-5 7zm7.5-7h6l-6 3v-3z'/></svg>";
        animLayer.appendChild(plane);
        var startTs = null;
        function angleFrom(x1,y1,x2,y2){ return Math.atan2(y2-y1, x2-x1) * 180/Math.PI; }
        function step(ts){
          if (!startTs) startTs = ts;
          var elapsed = ts - startTs;
          if (elapsed <= joinDuration){
            var t = elapsed / joinDuration;
            var xj = startX + (joinX - startX)*t;
            var yj = startY + (joinY - startY)*t;
            plane.style.left = xj + 'px'; plane.style.top = yj + 'px';
            plane.style.transform = 'translate(-50%,-50%) rotate(' + angleFrom(startX,startY,joinX,joinY) + 'deg)';
            requestAnimationFrame(step);
          } else if (elapsed <= joinDuration + orbitDuration){
            var t2 = (elapsed - joinDuration) / orbitDuration; // 0..1 over laps
            var ang = startAng + (endAng - startAng) * t2;
            var x = cx + rx * Math.cos(ang);
            var y = cy + ry * Math.sin(ang);
            // tangent direction
            var dx = -rx * Math.sin(ang);
            var dy =  ry * Math.cos(ang);
            plane.style.left = x + 'px'; plane.style.top = y + 'px';
            plane.style.transform = 'translate(-50%,-50%) rotate(' + (Math.atan2(dy,dx)*180/Math.PI) + 'deg)';
            requestAnimationFrame(step);
          } else if (elapsed <= totalDuration){
            var t3 = (elapsed - joinDuration - orbitDuration) / finishDuration;
            // from last ellipse point to end
            var lastAng = endAng;
            var sx = cx + rx * Math.cos(lastAng);
            var sy = cy + ry * Math.sin(lastAng);
            var xf = sx + (endX - sx)*t3;
            var yf = sy + (endY - sy)*t3;
            plane.style.left = xf + 'px'; plane.style.top = yf + 'px';
            plane.style.transform = 'translate(-50%,-50%) rotate(' + angleFrom(sx,sy,endX,endY) + 'deg)';
            requestAnimationFrame(step);
          } else {
            setTimeout(function(){ try{ animLayer.removeChild(plane); }catch(e){} }, 200);
          }
        }
        requestAnimationFrame(step);
      }catch(e){}
      // Capture uploaded file for left-pane preview on results page
      function readAsDataURL(f){ return new Promise(function(resolve,reject){ var r = new FileReader(); r.onload=function(){ resolve(String(r.result||'')); }; r.onerror=reject; r.readAsDataURL(f); }); }
      function readAsTextIfPossible(f){
        return new Promise(function(resolve){
          if ((f.type && f.type.indexOf('text/') === 0) || /\.(txt|md|markdown)$/i.test(f.name)){
            var r = new FileReader(); r.onload=function(){ resolve(String(r.result||'')); }; r.onerror=function(){ resolve(''); }; r.readAsText(f);
          } else { resolve(''); }
        });
      }
      Promise.all([ readAsDataURL(file), readAsTextIfPossible(file) ])
        .then(function(results){
          var dataUrl = results[0] || '';
          var textPreview = results[1] || '';
          try{
            var base64 = dataUrl.split(',')[1] || '';
            var meta = { name:file.name, type:file.type||'', size:file.size||0, base64: base64 };
            if (textPreview) meta.textPreview = textPreview;
            sessionStorage.setItem('resume_extractor_input_file', JSON.stringify(meta));
          }catch(e){}
        })
        .catch(function(){ /* ignore preview capture errors */ })
        .finally(function(){
          var fd = new FormData();
          // Send the uploaded document under field name 'Resume' and include file extension
          fd.append('Resume', file, file.name);
          fd.append('extension', ext);
          var controller = new AbortController();
          var timeoutId = setTimeout(function(){ controller.abort(); }, 600000);
          function parseResponse(res){
            var ct = (res.headers && res.headers.get && res.headers.get('content-type')) || '';
            if(ct.indexOf('application/json') !== -1){
              return res.json().then(function(j){ return { kind:'json', data:j }; });
            }
            return res.text().then(function(t){ return { kind:'text', data:t }; });
          }
          fetch(webhookUrl, { method: 'POST', body: fd, signal: controller.signal })
            .then(function(res){
              if(!res.ok) throw new Error('Status ' + res.status);
              return parseResponse(res);
            })
            .then(function(payload){
              clearTimeout(timeoutId);
              var result = {};
              if(payload.kind === 'json'){
                var j = payload.data || {};
                var plain = j.text || j.raw || j.content || j.output || j.extractedText || '';
                result.text = String(plain || '');
                result.markdown = String(j.markdown || j.md || plain || '');
                result.json = j;
              } else {
                result.text = String(payload.data || '');
                result.markdown = String(payload.data || '');
              }
              try { sessionStorage.setItem('resume_extractor_result', JSON.stringify(result)); } catch(e){}
              setStatus('Opening results...', '');
              stopContinuousProgress();
              setProgress(100);
              location.href = 'result.html';
            })
            .catch(function(err){
              clearTimeout(timeoutId);
              if(err && err.name === 'AbortError'){
                setStatus('Timed out after 10 minutes. Please try again.', 'error');
              } else {
                var msg = String(err && err.message || 'Request failed');
                if (msg.indexOf('404') !== -1){
                  setStatus('Webhook 404. Ensure your n8n workflow URL ends with /webhook/Resume and the workflow is active.', 'error');
                } else if (msg.toLowerCase().indexOf('failed to fetch') !== -1){
                  console.log(msg);
                  setStatus('Network/CORS error. Make sure you opened this page via http://localhost and that your firewall allows outbound HTTPS.', 'error');
                } else {
                  setStatus('Upload failed: ' + msg, 'error');
                }
              }
              stopContinuousProgress();
              hideProgress();
            })
            .catch(function(err){ setStatus('Upload failed: ' + err.message, 'error'); })
            .finally(function(){ var has = fileInput.files && fileInput.files[0]; if (has) uploadBtn.disabled = false; });
        });
    });
  }

  if (demoBtn){
    demoBtn.addEventListener('click', function(){
      if (demoTextEl){ demoTextEl.textContent = 'Loading demo...'; }
      // Pixel burst animation before opening modal
      try{
        var bRect = demoBtn.getBoundingClientRect();
        var cx = bRect.left + bRect.width/2, cy = bRect.top + bRect.height/2;
        var blocks = 140;
        for (var i=0;i<blocks;i++){
          (function(i){
            var px = document.createElement('div'); px.className='pixel';
            var size = (6 + Math.random()*10) * 6; px.style.width=size+'px'; px.style.height=size+'px';
            px.style.left=cx+'px'; px.style.top=cy+'px';
            document.body.appendChild(px);
            var ang = Math.random()*Math.PI*2; var dist = Math.hypot(window.innerWidth, window.innerHeight) * (0.6 + Math.random()*0.6); var dx=Math.cos(ang)*dist; var dy=Math.sin(ang)*dist; setTimeout(function(){ px.style.transform='translate('+(dx)+'px,'+(dy)+'px) scale(.8)'; px.style.opacity='0'; }, 10);
            setTimeout(function(){ try{ document.body.removeChild(px); }catch(e){} }, 1800);
          })(i);
        }
      }catch(e){}
      // Open the modal right as the pixel animation completes (matches 1.8s duration)
      setTimeout(function(){ if (modal){ modal.classList.remove('hidden'); modal.removeAttribute('aria-hidden'); } if (closeModal){ try { closeModal.focus(); } catch(e){} } }, 1800);
      var isHttp = location.protocol === 'http:' || location.protocol === 'https:';
      if (isHttp){
        fetch(DEMO_TEXT_URL + '?v=' + Date.now(), { cache: 'no-store' })
          .then(function(res){ if(!res.ok) throw new Error('Failed to load demo'); return res.text(); })
          .then(function(text){ if (demoTextEl){ demoTextEl.textContent = text; } })
          .catch(function(){ if (demoTextEl){ demoTextEl.textContent = DEMO_INLINE_TEXT; } });
      } else {
        // Avoid CORS errors on file:// by not fetching; use embedded text instead
        if (demoTextEl){ demoTextEl.textContent = DEMO_INLINE_TEXT; }
      }
    });
  }

  function closeDemo(){
    try { if (closeModal) closeModal.blur(); } catch(e){}
    try { if (demoBtn) demoBtn.focus(); } catch(e){}
    if (modal){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }
  }
  if (closeModal){ closeModal.addEventListener('click', closeDemo); }
  if (modal){ modal.addEventListener('click', function(e){ if(e.target === modal){ closeDemo(); } }); }
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && modal && !modal.classList.contains('hidden')){ closeDemo(); } });
})();