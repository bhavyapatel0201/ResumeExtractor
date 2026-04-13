    // Remove duplicate lowercase question line from right-panel
    function removeDuplicateQuestionLine() {
      if (!vettingReportEl) return;
      try {
        var walker = vettingReportEl.querySelectorAll('p,div,li');
        var needle = "why is this resume fit for job description:";
        walker.forEach(function(node){
          try {
            var txt = (node.textContent || '').trim().toLowerCase();
            if (!txt) return;
            if (txt === needle) {
              if (node.parentNode) node.parentNode.removeChild(node);
            }
          } catch(e){}
        });
      } catch(e){}
    }
// Vetting Report JavaScript
(function(){
  'use strict';
  
  // Get data from session storage
  var data = null;
  var uploadedMeta = null;
  
  try {
    var storedData = sessionStorage.getItem('resume_extractor_result');
    var storedMeta = sessionStorage.getItem('uploadedFileMeta');
    if (storedData) data = JSON.parse(storedData);
    if (storedMeta) uploadedMeta = JSON.parse(storedMeta);
  } catch(e) {
    console.error('Error loading data from session storage:', e);
  }

  // Client-side DOCX generation (mirrors Download OUTPUT on result page)
  function downloadFinalAsOutput(){
    // show overlay
    showDownloadOverlay();
    try{
      // Get OUTPUT data from sessionStorage
      var stored = null;
      try { stored = sessionStorage.getItem('resume_extractor_result'); stored = stored ? JSON.parse(stored) : null; } catch(e){ stored = null; }
      var outputMd = '';
      if (stored && stored.json) {
        outputMd = convertJsonToStructuredMarkdown(stored.json);
      } else if (stored) {
        outputMd = jsonToMarkdown(stored);
      }
      var outputHtml = mdToHtml(String(outputMd || ''));

      // Get VETTING REPORT HTML from the DOM
      var vettingReportEl = document.getElementById('vettingReport');
      var vettingHtml = '';
      if (vettingReportEl && vettingReportEl.innerHTML && vettingReportEl.innerHTML.trim()){
        vettingHtml = vettingReportEl.innerHTML;
        // Perform light cleanup
        try{
          var vetContainer = document.createElement('div');
          vetContainer.innerHTML = vettingHtml;
          var walker = vetContainer.querySelectorAll('p,div,li');
          var analyzeRegex = /analyze.*job description.*(resume|provide fit analysis|against)?/i;
          walker.forEach(function(node){
            try{
              var txt = (node.textContent || '').trim();
              if (!txt) return;
              if (analyzeRegex.test(txt) || txt.toLowerCase().indexOf('analyze the provided job description') !== -1){
                if (node.parentNode) node.parentNode.removeChild(node);
                return;
              }
              if (txt.replace(/\s+/g,' ').trim().toLowerCase() === 'why is this resume fit for job description?' ){
                if (node.parentNode) node.parentNode.removeChild(node);
                return;
              }
            }catch(e){}
          });
          vettingHtml = vetContainer.innerHTML;
        }catch(e){}
      }

      if (!outputHtml || !vettingHtml) {
        hideDownloadOverlay();
        alert('Output or vetting report data not available.');
        return;
      }

      // Prepare payload for backend
      var payload = {
        outputHtml: outputHtml,
        vettingHtml: vettingHtml
      };

      // Send to backend server
      var backendUrl = 'http://127.0.0.1:8444/api/generate-final-docx';
      fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(function(response) {
        if (!response.ok) {
          hideDownloadOverlay();
          throw new Error('Failed to generate document: ' + response.statusText);
        }
        return response.blob();
      }).then(function(blob) {
        // Create download link
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'final-output-' + new Date().toISOString().split('T')[0] + '.docx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // keep overlay visible briefly so user sees the animation
        setTimeout(function(){ hideDownloadOverlay(); }, 700);
        console.log('Final DOCX downloaded successfully');
      }).catch(function(error) {
        console.error('Error downloading final DOCX:', error);
        hideDownloadOverlay();
        alert('Error generating document. Backend server may not be running.\n\nPlease run: python backend_server.py\n\nError: ' + error.message);
      });
    } catch (e) {
      console.error('Error preparing download:', e);
      hideDownloadOverlay();
      alert('Error preparing document: ' + e.message);
    }
  }
  
  // Utility functions
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function mdToHtml(md) {
    if (!md) return '';
    var lines = md.split('\n');
    var out = '';
    var inList = false;
    function closeList(){ if(inList){ out += '</ul>'; inList = false; } }
    function applyInline(text){
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
    }
    for (var i = 0; i < lines.length; i++){
      var line = lines[i];
      if (!line.trim()){ closeList(); out += '<br>'; continue; }
      var h3 = line.match(/^###\s?(.*)$/);
      var h2 = !h3 && line.match(/^##\s?(.*)$/);
      var h1 = !h3 && !h2 && line.match(/^#\s?(.*)$/);
      if (h3 || h2 || h1){
        closeList();
        var text = applyInline((h3||h2||h1)[1]);
        if (h3) out += '<h3>' + text + '</h3>';
        else if (h2) out += '<h2>' + text + '</h2>';
        else out += '<h1>' + text + '</h1>';
        continue;
      }
      var li = line.match(/^\s*(?:[-\*\u2022])\s+(.+)$/);
      if (li){
        if (!inList){ out += '<ul>'; inList = true; }
        out += '<li>' + applyInline(li[1]) + '</li>';
        continue;
      }
      closeList();
      out += '<p>' + applyInline(line) + '</p>';
    }
    closeList();
    return out || '<p></p>';
  }
  
  function valueToMarkdown(value, indent, depth){
    indent = indent || '';
    depth = depth || 0;
    if (value === null || value === undefined) return indent + '- null';
    var t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean'){
      if (depth === 0) return String(value);
      return indent + '- ' + String(value);
    }
    if (Array.isArray(value)){
      if (value.length === 0) return indent + '- []';
      var out = '';
      for (var i = 0; i < value.length; i++){
        var v = value[i];
        if (typeof v === 'object' && v !== null){
          out += indent + '-\n' + valueToMarkdown(v, indent + '  ', depth + 1) + '\n';
        } else {
          out += indent + '- ' + String(v) + '\n';
        }
      }
      var res = out.replace(/\n$/, '');
      if (depth === 0){
        res = res.replace(/^\s*-\s?/gm, '');
      }
      return res;
    }
    var lines = '';
    for (var key in value){
      if(!Object.prototype.hasOwnProperty.call(value, key)) continue;
      var val = value[key];
      var isTopLevel = depth === 0; 
      if (isTopLevel){
        lines += '# ' + String(key) + '\n';
        if (val && typeof val === 'object'){
          lines += valueToMarkdown(val, indent, depth + 1) + '\n';
        } else {
          lines += String(val) + '\n';
        }
        continue;
      }
      if (val && typeof val === 'object'){
        lines += indent + '- **' + key + '**:\n' + valueToMarkdown(val, indent + '  ', depth + 1) + '\n';
      } else {
        lines += indent + '- **' + key + '**: ' + String(val) + '\n';
      }
    }
    return lines.replace(/\n$/, '');
  }
  
  function jsonToMarkdown(json){
    try{
      if (json === null || json === undefined) return 'No JSON available.';
      if (typeof json !== 'object') return String(json);
      var root = json.result || json.data || json.output || json;
      if (root && typeof root === 'object'){
        var keys = Object.keys(root);
        if (keys.length === 1){
          var k = keys[0];
          var lower = k.toLowerCase();
          if (lower === 'output' || lower === 'text' || lower === 'content' || lower === 'markdown' || lower === 'md'){
            var v = root[k];
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'){
              return String(v);
            }
          }
        }
      }
      return valueToMarkdown(root, '', 0);
    }catch(e){ return 'Failed to convert JSON to markdown.'; }
  }

  // Format Work Experience section with specific numbering and format
  function formatWorkExperienceSection(value) {
    var content = '';
    var experienceCount = 1;
    
    if (typeof value === 'string') {
      // If it's a string, try to parse it or use as is
      content = value + '\n\n';
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Array of experiences
        value.forEach(function(exp) {
          if (typeof exp === 'string') {
            content += 'Work Experience ' + experienceCount + '\n';
            content += '"Position : ' + exp + '"\n';
            content += '\t\t\n\n';
            experienceCount++;
          } else if (typeof exp === 'object') {
            content += 'Work Experience ' + experienceCount + '\n';
            var position = exp.Position || exp.position || exp.title || exp.job || 'Position';
            var company = exp.Company || exp.company || exp.organization || '';
            var positionText = position;
            if (company) {
              positionText += ' in ' + company;
            }
            content += '"Position : ' + positionText + '"\n';
            
            // Add body content
            var bodyContent = '';
            for (var key in exp) {
              if (exp.hasOwnProperty(key) && key.toLowerCase() !== 'position' && key.toLowerCase() !== 'company' && key.toLowerCase() !== 'title' && key.toLowerCase() !== 'job') {
                bodyContent += exp[key] + ' ';
              }
            }
            if (bodyContent.trim()) {
              content += '\t\t' + bodyContent.trim() + '\n\n';
            } else {
              content += '\t\t\n\n';
            }
            experienceCount++;
          }
        });
      } else {
        // Object with multiple experiences
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            content += 'Work Experience ' + experienceCount + '\n';
            content += '"Position : ' + key + '"\n';
            content += '\t\t' + value[key] + '\n\n';
            experienceCount++;
          }
        }
      }
    }
    
    return content;
  }

  // Format Projects section with specific numbering and format
  function formatProjectsSection(value) {
    var content = '';
    var projectCount = 1;
    
    if (typeof value === 'string') {
      // If it's a string, try to parse it or use as is
      content = value + '\n\n';
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Array of projects
        value.forEach(function(project) {
          if (typeof project === 'string') {
            content += 'Project ' + projectCount + '\n';
            content += '"Title : ' + project + '"\n';
            content += '\t\t\n\n';
            projectCount++;
          } else if (typeof project === 'object') {
            content += 'Project ' + projectCount + '\n';
            var title = project.Title || project.title || project.name || project.project || 'Project Title';
            content += '"Title : ' + title + '"\n';
            
            // Add body content
            var bodyContent = '';
            for (var key in project) {
              if (project.hasOwnProperty(key) && key.toLowerCase() !== 'title' && key.toLowerCase() !== 'name' && key.toLowerCase() !== 'project') {
                bodyContent += project[key] + ' ';
              }
            }
            if (bodyContent.trim()) {
              content += '\t\t' + bodyContent.trim() + '\n\n';
            } else {
              content += '\t\t\n\n';
            }
            projectCount++;
          }
        });
      } else {
        // Object with multiple projects
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            content += 'Project ' + projectCount + '\n';
            content += '"Title : ' + key + '"\n';
            content += '\t\t' + value[key] + '\n\n';
            projectCount++;
          }
        }
      }
    }
    
    return content;
  }

  // Format Skills section as a proper section with clean formatting
  function formatSkillsSection(value) {
    var content = '';
    
    if (typeof value === 'string') {
      // If it's a string, format as a clean list
      var skills = value.split(/[,;•\n]/).filter(function(skill) {
        return skill.trim() !== '';
      });
      
      skills.forEach(function(skill) {
        content += '- ' + skill.trim() + '\n';
      });
      content += '\n';
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Array of skills
        value.forEach(function(skill) {
          if (typeof skill === 'string') {
            content += '- ' + skill + '\n';
          } else if (typeof skill === 'object') {
            for (var key in skill) {
              if (skill.hasOwnProperty(key)) {
                content += '- ' + skill[key] + '\n';
              }
            }
          }
        });
        content += '\n';
      } else {
        // Object with skills
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            if (typeof value[key] === 'string') {
              content += '- ' + value[key] + '\n';
            } else {
              content += '- ' + key + '\n';
            }
          }
        }
        content += '\n';
      }
    }
    
    return content;
  }

  // Convert JSON to structured markdown format for resume
  function convertJsonToStructuredMarkdown(jsonData) {
    var markdown = '';
    
    // Get all available keys from the JSON data
    var availableKeys = Object.keys(jsonData);
    console.log('Converting JSON to structured markdown. Available keys:', availableKeys);
    
    // Define preferred order with Profile Summary first, then Certifications, then Skills
    var preferredOrder = [
      'Profile Summary', 'profile summary', 'Profile_Summary', 'profile_summary',
      'Candidate Info', 'candidate_info', 'candidateInfo', 'Candidate_Info',
      'Certifications', 'certifications', 'Certification', 'certification', 'CERTIFICATIONS', 'CERTIFICATION',
      'Skills', 'skills', 'Skill', 'skill', 'SKILLS', 'SKILL'
    ];
    
    console.log('Processing sections in order:', preferredOrder);
    
    // Process sections in preferred order first
    var processedKeys = [];
    preferredOrder.forEach(function(preferredKey) {
      if (availableKeys.includes(preferredKey)) {
        processedKeys.push(preferredKey);
      }
    });
    
    // Add remaining keys that weren't in preferred order
    availableKeys.forEach(function(key) {
      if (!processedKeys.includes(key)) {
        processedKeys.push(key);
      }
    });
    
    // Process each key to create structured markdown
    processedKeys.forEach(function(key) {
      var value = jsonData[key];
      var sectionTitle = key;
      var sectionContent = '';
      
      // Special formatting for Work Experience and Projects
      if (key.toLowerCase().includes('work experience') || key.toLowerCase().includes('work_experience')) {
        sectionContent = formatWorkExperienceSection(value);
      } else if (key.toLowerCase().includes('project') && !key.toLowerCase().includes('experience')) {
        sectionContent = formatProjectsSection(value);
      } else if (key.toLowerCase().includes('skills')) {
        // Format Skills as a proper section with heading
        sectionContent = formatSkillsSection(value);
      } else {
        // Handle different data types and convert to markdown
        if (typeof value === 'string') {
          // String data - format as paragraph
          sectionContent = value + '\n\n';
        } else if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            // Array data - format as bullet list
            sectionContent = '';
            value.forEach(function(item) {
              if (typeof item === 'string') {
                sectionContent += '- ' + item + '\n';
              } else if (typeof item === 'object') {
                sectionContent += '- ';
                var itemParts = [];
                for (var subKey in item) {
                  if (item.hasOwnProperty(subKey)) {
                    itemParts.push('**' + subKey + ':** ' + item[subKey]);
                  }
                }
                sectionContent += itemParts.join(', ') + '\n';
              }
            });
            sectionContent += '\n';
          } else {
            // Object data - format as key-value pairs
            sectionContent = '';
            for (var subKey in value) {
              if (value.hasOwnProperty(subKey)) {
                var subValue = value[subKey];
                if (typeof subValue === 'string') {
                  sectionContent += '**' + subKey + ':** ' + subValue + '\n\n';
                } else if (typeof subValue === 'object' && subValue !== null) {
                  sectionContent += '### ' + subKey + '\n';
                  for (var subSubKey in subValue) {
                    if (subValue.hasOwnProperty(subSubKey)) {
                      sectionContent += '**' + subSubKey + ':** ' + subValue[subSubKey] + '\n\n';
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      // Add section to markdown if it has content
      if (sectionContent.trim() !== '') {
        markdown += '# ' + sectionTitle + '\n\n';
        markdown += sectionContent + '\n';
        markdown += '---\n\n';
      }
    });
    
    return markdown;
  }
  
  function convertToVettingReport(json) {
    if (!json) return '';
    
    var report = '# VETTING REPORT\n\n';
    report += '**Generated on:** ' + new Date().toLocaleDateString() + '\n\n';
    report += '---\n\n';
    
    // Candidate Information
    if (json['Candidate Info'] || json['candidate_info'] || json['candidateInfo']) {
      var candidateInfo = json['Candidate Info'] || json['candidate_info'] || json['candidateInfo'];
      report += '## CANDIDATE INFORMATION\n\n';
      
      if (candidateInfo.Name) {
        report += '**Name:** ' + candidateInfo.Name + '\n\n';
      }
      if (candidateInfo.Email) {
        report += '**Email:** ' + candidateInfo.Email + '\n\n';
      }
      if (candidateInfo.Phone) {
        report += '**Phone:** ' + candidateInfo.Phone + '\n\n';
      }
      if (candidateInfo.summary || candidateInfo.Summary) {
        report += '**Summary:**\n' + (candidateInfo.summary || candidateInfo.Summary) + '\n\n';
      }
    }
    
    // Work Experience Analysis
    if (json['Work Experience'] || json['work_experience']) {
      var workExp = json['Work Experience'] || json['work_experience'];
      report += '## WORK EXPERIENCE ANALYSIS\n\n';
      
      if (typeof workExp === 'string') {
        report += workExp + '\n\n';
      } else if (typeof workExp === 'object') {
        for (var key in workExp) {
          if (workExp.hasOwnProperty(key)) {
            report += '### ' + key + '\n' + workExp[key] + '\n\n';
          }
        }
      }
    }
    
    // Skills Assessment
    if (json['Skills'] || json['skills']) {
      var skills = json['Skills'] || json['skills'];
      report += '## SKILLS ASSESSMENT\n\n';
      if (typeof skills === 'string') {
        report += skills + '\n\n';
      } else if (typeof skills === 'object') {
        for (var key in skills) {
          if (skills.hasOwnProperty(key)) {
            report += '### ' + key + '\n' + skills[key] + '\n\n';
          }
        }
      }
    }

    // Soft Skills Section (right panel)
    // Find any key matching 'soft skills' (case/space insensitive)
    var softSkillsKey = Object.keys(json).find(function(k){ return k.replace(/\s+/g,'').toLowerCase() === 'softskills'; });
    if (softSkillsKey) {
      var softSkills = json[softSkillsKey];
      // Display heading 'Soft Skills' above bullet points
      report += '## Soft Skills\n\n';
      if (typeof softSkills === 'string') {
        var skillsArr = softSkills.split(/[,;•\n]/).filter(function(skill){ return skill.trim() !== ''; });
        skillsArr.forEach(function(skill){ report += '- ' + skill.trim() + '\n'; });
        report += '\n';
      } else if (Array.isArray(softSkills)) {
        softSkills.forEach(function(skill){ report += '- ' + skill.trim() + '\n'; });
        report += '\n';
      }
    }
    
    // Education Verification
    if (json['Education'] || json['education']) {
      var education = json['Education'] || json['education'];
      report += '## EDUCATION VERIFICATION\n\n';
      
      if (typeof education === 'string') {
        report += education + '\n\n';
      } else if (typeof education === 'object') {
        for (var key in education) {
          if (education.hasOwnProperty(key)) {
            report += '### ' + key + '\n' + education[key] + '\n\n';
          }
        }
      }
    }
    
    // Certifications Review
    if (json['Certifications'] || json['certifications']) {
      var certifications = json['Certifications'] || json['certifications'];
      report += '## CERTIFICATIONS REVIEW\n\n';
      
      if (typeof certifications === 'string') {
        report += certifications + '\n\n';
      } else if (typeof certifications === 'object') {
        for (var key in certifications) {
          if (certifications.hasOwnProperty(key)) {
            report += '### ' + key + '\n' + certifications[key] + '\n\n';
          }
        }
      }
    }
    
    // Projects Evaluation
    if (json['Projects'] || json['projects']) {
      var projects = json['Projects'] || json['projects'];
      report += '## PROJECTS EVALUATION\n\n';
      
      if (typeof projects === 'string') {
        report += projects + '\n\n';
      } else if (typeof projects === 'object') {
        for (var key in projects) {
          if (projects.hasOwnProperty(key)) {
            report += '### ' + key + '\n' + projects[key] + '\n\n';
          }
        }
      }
    }
    
    // Vetting Summary
    report += '## VETTING SUMMARY\n\n';
    report += '### Key Findings:\n';
    report += '- Resume structure and formatting reviewed\n';
    report += '- Skills and experience validated\n';
    report += '- Education and certifications verified\n';
    report += '- Overall candidate profile assessed\n\n';
    
    report += '### Recommendations:\n';
    report += '- Further verification may be required for specific claims\n';
    report += '- Reference checks recommended\n';
    report += '- Additional technical assessments may be beneficial\n\n';
    
    report += '### Risk Assessment:\n';
    report += '- **Low Risk:** Standard resume format with clear information\n';
    report += '- **Medium Risk:** Some areas may require additional verification\n';
    report += '- **High Risk:** Significant discrepancies or missing information\n\n';
    
    report += '---\n\n';
    report += '**Report prepared by:** Resume Extractor Vetting System\n';
    report += '**Report version:** 1.0\n';
    
    return report;
  }
  
  // Initialize the page
  function initializePage() {
    var originalDataEl = document.getElementById('originalData');
    var vettingReportEl = document.getElementById('vettingReport');
    
    // Get job description from session storage
    var jobDescription = '';
    try {
      jobDescription = sessionStorage.getItem('job_description') || '';
    } catch(e) {
      jobDescription = '';
    }
    
    // Display original data (left panel) - convert to structured markdown format
    if (data && data.json) {
      // Convert JSON to structured markdown format
      var markdownContent = convertJsonToStructuredMarkdown(data.json);
      
      // Convert markdown to HTML for display
      var htmlContent = mdToHtml(markdownContent);
      
      originalDataEl.innerHTML = htmlContent;
      
      // Add golden color class to Skills heading
      setTimeout(function() {
        var headings = originalDataEl.querySelectorAll('h1');
        headings.forEach(function(heading) {
          if (heading.textContent && heading.textContent.toLowerCase().includes('skills')) {
            heading.classList.add('skills-heading');
          }
        });
      }, 100);
    } else if (data && data.text) {
      originalDataEl.innerHTML = mdToHtml(String(data.text));
    } else {
      originalDataEl.innerHTML = '<p>No original data available.</p>';
    }
    
    // Display vetting report (right panel)
    // If a webhook result exists in sessionStorage, render it; otherwise POST to the webhook and wait for response.
    var webhookResultRaw = null;
    try { webhookResultRaw = sessionStorage.getItem('vetting_report_webhook_result'); } catch(e) { webhookResultRaw = null; }

    // Helper: render webhook raw output (string) into markdown/html using existing rules
    function renderWebhookResult(rawInput) {
      if (!rawInput) return;
      function renderFromArray(arr) {
        var out = '';
        arr.forEach(function(item){
          if (item === null || item === undefined) return;
          if (typeof item === 'string') {
            out += item.trim() + '\n\n';
          } else if (typeof item === 'object') {
            if (item.markdown || item.md || item.text || item.result) {
              out += (item.markdown || item.md || item.text || item.result) + '\n\n';
            } else {
              out += jsonToMarkdown(item) + '\n\n';
            }
          } else {
            out += String(item) + '\n\n';
          }
        });
        return out.replace(/\n{3,}/g, '\n\n').trim();
      }

      var raw = String(rawInput || '');
      var lines = raw.split(/\r?\n/).filter(function(l){ return l.trim() !== ''; });
      var parsedAny = false;
      if (lines.length > 1) {
        var parsedLines = [];
        for (var i=0;i<lines.length;i++){
          var ln = lines[i].trim();
          try { parsedLines.push(JSON.parse(ln)); parsedAny = true; } catch(e) { parsedLines.push(ln); }
        }
        if (parsedAny) {
          var md = renderFromArray(parsedLines);
          vettingReportEl.innerHTML = mdToHtml(md);
          removeVettingReportHeadings();
          return;
        }
      }

      try {
        var parsed = JSON.parse(raw);
        var md = '';
        if (Array.isArray(parsed)) {
          md = renderFromArray(parsed);
        } else if (parsed && typeof parsed === 'object') {
          var arrFieldNames = ['outputs','results','items','steps','data','result','output'];
          var found = false;
          for (var fi=0; fi<arrFieldNames.length; fi++){
            var fn = arrFieldNames[fi];
            if (parsed[fn] && Array.isArray(parsed[fn])){ md = renderFromArray(parsed[fn]); found = true; break; }
          }
          if (!found) {
            var keys = Object.keys(parsed);
            var numericKeys = keys.filter(function(k){ return /^\d+$/.test(k); }).sort(function(a,b){ return Number(a)-Number(b); });
            if (numericKeys.length > 0) {
              var arr = numericKeys.map(function(k){ return parsed[k]; });
              md = renderFromArray(arr);
            } else if (parsed.markdown || parsed.md || parsed.text || parsed.result) {
              md = parsed.markdown || parsed.md || parsed.text || parsed.result;
            } else {
              md = jsonToMarkdown(parsed);
            }
          }
        } else {
          md = String(parsed);
        }
        md = String(md || '').replace(/^\s+|\s+$/g, '').replace(/\n{3,}/g, '\n\n');
        vettingReportEl.innerHTML = mdToHtml(md);
        removeVettingReportHeadings();
      } catch(e) {
        // Fallback: render raw text
        vettingReportEl.innerHTML = mdToHtml(raw);
        removeVettingReportHeadings();
      }
    }

    // Remove all headings that state 'Vetting Report' from the right side
    function removeVettingReportHeadings() {
      if (!vettingReportEl) return;
      var heads = vettingReportEl.querySelectorAll('h1, h2, h3');
      heads.forEach(function(h) {
        var txt = (h.textContent || '').trim().toLowerCase();
        if (txt === 'vetting report') {
          h.parentNode.removeChild(h);
        }
      });
    }

    if (webhookResultRaw) {
      // Already have result stored - render it
      renderWebhookResult(webhookResultRaw);
    } else if (data && data.json) {
      // No stored result - POST to webhook and wait for response
      vettingReportEl.innerHTML = '<p>Waiting for vetting webhook response...</p>';
      var webhookUrl = 'https://n8n.srv922914.hstgr.cloud/webhook/' + encodeURIComponent('Vetting Report');
        // Put the right-side resume data under a single heading string 'Resume:\n' for webhook
      var payload = {
        Resume: 'Resume:\n' + JSON.stringify(data.json, null, 2),
        meta: uploadedMeta || null,
        jobDescription: jobDescription
      };
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(res){
        var ctype = (res.headers.get('content-type') || '').toLowerCase();
        if (ctype.indexOf('application/json') !== -1) return res.json();
        return res.text();
      }).then(function(result){
        try { var toStore = (typeof result === 'string') ? result : JSON.stringify(result); sessionStorage.setItem('vetting_report_webhook_result', toStore); } catch(e){}
        renderWebhookResult(typeof result === 'string' ? result : JSON.stringify(result));
      }).catch(function(err){
        console.error('Error contacting vetting webhook:', err);
        // Fallback to local generation
        try { var vettingMarkdown = convertToVettingReport(data.json); vettingReportEl.innerHTML = mdToHtml(vettingMarkdown); } catch(e){ vettingReportEl.innerHTML = '<p>No data available for vetting report.</p>'; }
      });
    } else {
      vettingReportEl.innerHTML = '<p>No data available for vetting report.</p>';
    }

    // Apply styling for "live_d365_seal_of_approval" sections:
    // - Append a green tick to the end of each bullet under that heading
    function applySealStyling() {
      if (!vettingReportEl) return;
      var heads = vettingReportEl.querySelectorAll('h1, h2, h3');
      Array.prototype.forEach.call(heads, function(h) {
        var raw = (h.textContent || '').toLowerCase().trim();
        // Normalize underscores/spaces
        var norm = raw.replace(/[_\s]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (norm === 'live d365 seal of approval' || raw.indexOf('live_d365_seal_of_approval') !== -1 || raw.indexOf('lived365sealofapproval') !== -1) {
          // (No tick on heading per user request)

          // Walk nodes after heading until next heading and append tick to list items
          var node = h.nextSibling;
          while (node && !(node.tagName && /^(H1|H2|H3)$/.test(node.tagName))) {
            if (node.nodeType === 1 && node.tagName === 'UL') {
              var lis = node.querySelectorAll('li');
              Array.prototype.forEach.call(lis, function(li) {
                if (!li.querySelector('.li-tick')) {
                  var lt = document.createElement('span');
                  lt.className = 'li-tick';
                  lt.textContent = ' ✅';
                  lt.style.color = 'green';
                  li.appendChild(lt);
                }
              });
            }
            // Also handle plain paragraphs containing bullets separated by line breaks
            if (node.nodeType === 1 && node.tagName === 'P') {
              // Split by line breaks and wrap into spans if necessary
              var text = node.innerHTML || '';
              if (text.indexOf('<br') !== -1 || text.indexOf('\n') !== -1) {
                var parts = text.split(/<br\s*\/?>|\n/).filter(function(p){ return p.trim(); });
                if (parts.length > 1) {
                  var ul = document.createElement('ul');
                  parts.forEach(function(part){
                    var li = document.createElement('li');
                    li.innerHTML = part + ' <span class="li-tick"> ✅</span>';
                    ul.appendChild(li);
                  });
                  node.parentNode.replaceChild(ul, node);
                }
              }
            }
            node = node.nextSibling;
          }
        }
      });
    }

    // Normalize headings (replace underscores with spaces) and run styling after a short delay
    function replaceUnderscoresInNode(node){
      if (!node) return;
      if (node.nodeType === Node.TEXT_NODE){
        node.nodeValue = String(node.nodeValue).replace(/_/g,' ').replace(/\s+/g,' ');
        return;
      }
      // Recurse into element children
      var children = node.childNodes || [];
      for (var ci=0; ci<children.length; ci++) replaceUnderscoresInNode(children[ci]);
    }
    function normalizeHeadings(){
      if (!vettingReportEl) return;
      var heads2 = vettingReportEl.querySelectorAll('h1,h2,h3');
      for (var i=0;i<heads2.length;i++){
        var h = heads2[i];
        replaceUnderscoresInNode(h);
        // Trim leading/trailing spaces on text nodes directly under heading
        // No change to element structure - only text content normalized
        try {
          // Special-case: format the heading "why is this resume fit for job description"
          var plain = (h.textContent || '').replace(/_/g,' ').replace(/\s+/g,' ').trim();
          if (plain.toLowerCase() === 'why is this resume fit for job description' || plain.toLowerCase().startsWith('why is this resume fit for job description')) {
            var formatted = plain.charAt(0).toUpperCase() + plain.slice(1);
            // Ensure single question mark at end
            formatted = formatted.replace(/\?+$/,'');
            formatted = formatted + '?';
            // Replace heading contents with plain text (no extra HTML)
            h.textContent = formatted;
          }
        } catch(e) {}
      }
    }
    
    // Arrange Technical Skills and Soft Skills side-by-side if both sections exist
    function arrangeSkillsSideBySide() {
      if (!vettingReportEl) return;
      try {
        var heads = vettingReportEl.querySelectorAll('h1,h2,h3');
        var soft = null, tech = null;
        // Find soft skills heading first
        Array.prototype.forEach.call(heads, function(h){
          var txt = (h.textContent||'').toLowerCase().trim();
          if (txt.indexOf('soft skills') !== -1 || txt.replace(/\s+/g,'') === 'softskills') soft = h;
        });
        // Find technical/skills heading (prefer 'technical' or 'skills assessment' or plain 'skills')
        Array.prototype.forEach.call(heads, function(h){
          if (tech) return;
          var txt = (h.textContent||'').toLowerCase().trim();
          if (txt.indexOf('technical') !== -1 || txt.indexOf('skills assessment') !== -1) tech = h;
        });
        if (!tech) {
          Array.prototype.forEach.call(heads, function(h){
            if (tech) return;
            var txt = (h.textContent||'').toLowerCase().trim();
            if (txt.indexOf('skills') !== -1 && txt.indexOf('soft') === -1) tech = h;
          });
        }
        if (!tech || !soft) return;

        function collectSectionNodes(startHeading) {
          var nodes = [];
          var node = startHeading.nextSibling;
          while (node && !(node.tagName && /^(H1|H2|H3)$/.test(node.tagName))) {
            nodes.push(node);
            node = node.nextSibling;
          }
          return nodes;
        }

        var techNodes = collectSectionNodes(tech);
        var softNodes = collectSectionNodes(soft);

        // Build wrapper
        var wrapper = document.createElement('div'); wrapper.className = 'skills-flex';
        var colTech = document.createElement('div'); colTech.className = 'col tech-col';
        var colSoft = document.createElement('div'); colSoft.className = 'col soft-col';

        colTech.appendChild(tech.cloneNode(true));
        techNodes.forEach(function(n){ colTech.appendChild(n.cloneNode(true)); });

        colSoft.appendChild(soft.cloneNode(true));
        softNodes.forEach(function(n){ colSoft.appendChild(n.cloneNode(true)); });

        wrapper.appendChild(colTech); wrapper.appendChild(colSoft);

        // Determine region to replace: from earlier heading to end of later heading's section
        var start = (tech.compareDocumentPosition(soft) & Node.DOCUMENT_POSITION_FOLLOWING) ? tech : soft;
        var end = (start === tech) ? soft : tech;

        // Find node after end's section
        var last = end;
        while (last.nextSibling && !(last.nextSibling.tagName && /^(H1|H2|H3)$/.test(last.nextSibling.tagName))) {
          last = last.nextSibling;
        }
        var insertBeforeNode = last.nextSibling;

        // Remove original nodes from start through last
        var rm = start;
        while (rm !== insertBeforeNode) {
          var toRemove = rm;
          rm = rm.nextSibling;
          if (toRemove && toRemove.parentNode) toRemove.parentNode.removeChild(toRemove);
        }

        // Insert wrapper at the position where the removed block was
        if (insertBeforeNode) vettingReportEl.insertBefore(wrapper, insertBeforeNode);
        else vettingReportEl.appendChild(wrapper);
      } catch(e) { /* non-fatal */ }
    }

    // Remove question/answer headings and clean up their labels
    function adjustQAHeadings() {
      if (!vettingReportEl) return;
      try {
        var heads = vettingReportEl.querySelectorAll('h1,h2,h3');
        var headingsToRemove = [];
        
        // Find all headings that are exactly "question" or "answer" (case-insensitive)
        Array.prototype.forEach.call(heads, function(h) {
          var txt = (h.textContent || '').trim().toLowerCase();
          if (txt === 'question' || txt === 'questions' || txt === 'q' || 
              txt === 'answer' || txt === 'answers' || txt === 'a') {
            headingsToRemove.push(h);
          }
          // Also remove duplicate instances of "Why is this resume fit for job description?" 
          // (keep only the one with class "question-heading")
          if (txt === 'why is this resume fit for job description?' && !h.classList.contains('question-heading')) {
            headingsToRemove.push(h);
          }
        });
        
        // Remove those headings from DOM
        headingsToRemove.forEach(function(h) {
          if (h.parentNode) {
            h.parentNode.removeChild(h);
          }
        });
        
        // Also clean up inline labels like "**Question:**" or "Answer:" in paragraphs/list items
        var allElements = vettingReportEl.querySelectorAll('p,li');
        Array.prototype.forEach.call(allElements, function(el) {
          try {
            var html = el.innerHTML || '';
            // Remove **Question:** or Question: labels
            html = html.replace(/\*\*Question:\*\*\s*/gi, '');
            html = html.replace(/^Question:\s*/gi, '');
            // Remove **Answer:** or Answer: labels
            html = html.replace(/\*\*Answer:\*\*\s*/gi, '');
            html = html.replace(/^Answer:\s*/gi, '');
            el.innerHTML = html;
          } catch(e){}
        });
        
        // Remove duplicate paragraphs that contain only "Why is this resume fit for job description?"
        var allParagraphs = vettingReportEl.querySelectorAll('p');
        Array.prototype.forEach.call(allParagraphs, function(p) {
          var txt = (p.textContent || '').trim();
          if (txt === 'Why is this resume fit for job description?') {
            if (p.parentNode) {
              p.parentNode.removeChild(p);
            }
          }
        });
        
        // Insert the main question heading at the top if not already present
        var existingQuestionHeading = false;
        var firstHeading = null;
        var allHeadings = vettingReportEl.querySelectorAll('h1.question-heading');
        if (allHeadings.length > 0) {
          existingQuestionHeading = true;
        }
        
        if (!existingQuestionHeading) {
          // Create the question heading
          var questionHeading = document.createElement('h1');
          questionHeading.className = 'question-heading';
          questionHeading.textContent = 'Why is this resume fit for job description?';
          
          // Insert at the beginning of vettingReportEl
          if (vettingReportEl.firstChild) {
            vettingReportEl.insertBefore(questionHeading, vettingReportEl.firstChild);
          } else {
            vettingReportEl.appendChild(questionHeading);
          }
        }
      } catch(e){}
    }

    // Remove the Analyze instruction lines from the rendered right-panel
    function removeAnalyzeInstruction() {
      if (!vettingReportEl) return;
      try {
        var walker = vettingReportEl.querySelectorAll('p,div,li');
        // match variants like:
        // "Analyze the provided job description 'software engineer' against the resume and provide fit analysis."
        // "Analyze the job description for Sales Engineer against the provided resume."
        var analyzeRegex = /analyze.*job description.*(resume|provide fit analysis|against)?/i;
        walker.forEach(function(node){
          try {
            var txt = (node.textContent || '').trim();
            if (!txt) return;
            if (analyzeRegex.test(txt) || txt.toLowerCase().indexOf('analyze the provided job description') !== -1) {
              if (node.parentNode) node.parentNode.removeChild(node);
            }
          } catch(e){}
        });
      } catch(e){}
    }
    
    try { setTimeout(function(){ normalizeHeadings(); adjustQAHeadings(); applySealStyling(); arrangeSkillsSideBySide(); removeAnalyzeInstruction(); removeDuplicateQuestionLine(); }, 30); } catch(e){}
  }
  
  // Download vetting report as DOCX
  // Download overlay helpers
  function createDownloadOverlayIfNeeded() {
    if (document.getElementById('dlOverlay')) return;
    var overlay = document.createElement('div');
    overlay.id = 'dlOverlay';
    overlay.className = 'dl-overlay';
    overlay.style.display = 'none';
    overlay.style.pointerEvents = 'auto';
    overlay.innerHTML = '<div class="dl-backdrop"></div><div class="dl-icon" id="dlIcon" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.67v4h6V9h3.67L12 2z"/></svg>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  function showDownloadOverlay() {
    createDownloadOverlayIfNeeded();
    var overlay = document.getElementById('dlOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    // Force reflow to ensure animation triggers
    void overlay.offsetWidth;
    var icon = overlay.querySelector('.dl-icon');
    if (icon) icon.style.animation = 'dl-pop .9s cubic-bezier(.22,.61,.36,1) forwards';
  }

  function hideDownloadOverlay() {
    var overlay = document.getElementById('dlOverlay');
    if (!overlay) return;
    overlay.style.display = 'none';
  }
  function downloadVettingReport() {
    // Show full-screen animated download overlay
    showDownloadOverlay();
    
    try {
      // Get the vetting report HTML from the DOM
      var vettingReportEl = document.getElementById('vettingReport');
      if (!vettingReportEl || !vettingReportEl.innerHTML.trim()) {
        alert('No vetting report data available. Please generate a report first.');
        return;
      }

      var vettingHtml = vettingReportEl.innerHTML;
      
      // Get job description from sessionStorage
      var jobDescription = '';
      try {
        jobDescription = sessionStorage.getItem('job_description') || '';
      } catch(e) {}

      // Get resume data from sessionStorage
      var resumeData = {};
      try {
        var storedData = sessionStorage.getItem('resume_extractor_result');
        if (storedData) resumeData = JSON.parse(storedData);
      } catch(e) {}

      // Prepare payload for backend
      var payload = {
        vettingHtml: vettingHtml,
        jobDescription: jobDescription,
        resumeData: resumeData
      };

      // Send to backend server
      var backendUrl = 'http://127.0.0.1:8444/api/generate-report';
      fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(function(response) {
        if (!response.ok) {
          hideDownloadOverlay();
          throw new Error('Failed to generate document: ' + response.statusText);
        }
        return response.blob();
      }).then(function(blob) {
        // Create download link
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'vetting-report-' + new Date().toISOString().split('T')[0] + '.docx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // keep overlay visible briefly so user sees the animation
        setTimeout(function(){ hideDownloadOverlay(); }, 700);
        console.log('Vetting report downloaded successfully');
      }).catch(function(error) {
        console.error('Error downloading report:', error);
        hideDownloadOverlay();
        alert('Error generating document. Backend server may not be running.\n\nPlease run: python backend_server.py\n\nError: ' + error.message);
      });
    } catch (e) {
      console.error('Error preparing download:', e);
      alert('Error preparing document: ' + e.message);
    }
  }
    // sendVettingReportToWebhook: removed per user request (no client-side resubmit)
  
  // Event listeners
  document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    // (Header button listener removed to avoid collision with FINAL download)
    
    // Download vetting button (in panel)
    var downloadVettingBtn = document.getElementById('downloadVettingBtn');
    if (downloadVettingBtn) {
      downloadVettingBtn.addEventListener('click', downloadVettingReport);
    }
    // Top-right Download FINAL button: generate DOCX client-side (same as Download OUTPUT on result page)
    var downloadFinalBtn = document.getElementById('downloadFinal');
    if (downloadFinalBtn) {
      downloadFinalBtn.addEventListener('click', function(e){ e.preventDefault(); downloadFinalAsOutput(); });
    }
    
    // Edit button (placeholder for future functionality)
    var editBtn = document.getElementById('editVettingBtn');
    if (editBtn) {
      editBtn.addEventListener('click', function() {
        alert('Edit functionality will be implemented in future updates.');
      });
    }
    
      // sendToWebhookBtn removed from DOM; no client-side resubmit handler
  });
})();
