(function(){
  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function mdToHtml(md){
    var safe = escapeHtml(md);
    var lines = String(safe).replace(/\r\n?/g,'\n').split('\n');
    var out = '';
    var inList = false;
    function closeList(){ if(inList){ out += '</ul>'; inList = false; } }
    function applyInline(text){
      return text
        .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
        .replace(/\*(.*?)\*/g,'<em>$1</em>');
    }
    for (var i = 0; i < lines.length; i++){
      var line = lines[i];
      if (!line){ closeList(); continue; }
      // Table detection: header row starting and ending with | and the next line is separators
      var isRow = /^\s*\|.*\|\s*$/.test(line);
      var next = lines[i+1] || '';
      var isSep = /^\s*\|\s*[-:]+(?:\s*\|\s*[-:]+)*\s*\|\s*$/.test(next);
      if (isRow && isSep){
        closeList();
        function splitCells(s){
          return s.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split(/\|/).map(function(c){ return applyInline(c.trim()); });
        }
        var headers = splitCells(line);
        // Special case: single-column table (e.g., Certifications | Name) -> bullets
        if (headers.length === 1 && /^name$/i.test(headers[0].replace(/<[^>]*>/g,''))){
          var items = [];
          i += 2; // skip header and separator
          while (i < lines.length){
            var rowLine = lines[i];
            if (!/^\s*\|.*\|\s*$/.test(rowLine)) { i--; break; }
            var cells = splitCells(rowLine);
            if (cells[0]) items.push('<li>' + cells[0] + '</li>');
            i++;
          }
          out += '<ul class="compact-list">' + items.join('') + '</ul>';
        } else {
          out += '<table><thead><tr>' + headers.map(function(h){ return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>';
          i += 2; // skip header and separator
          while (i < lines.length){
            var rowLine = lines[i];
            if (!/^\s*\|.*\|\s*$/.test(rowLine)) { i--; break; }
            var cells = splitCells(rowLine);
            out += '<tr>' + cells.map(function(td){ return '<td>' + td + '</td>'; }).join('') + '</tr>';
            i++;
          }
          out += '</tbody></table>';
        }
        continue;
      }
      // Pipe-delimited single row -> render as compact bullet line
      if (isRow && !isSep){
        closeList();
        var parts = line.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split(/\|/).map(function(p){ return applyInline(p.trim()); });
        out += '<ul class="compact-list">' + parts.map(function(p){ return '<li>' + p + '</li>'; }).join('') + '</ul>';
        continue;
      }
      // Handle list lines that actually contain headings like "- # Heading"
      var liHead = line.match(/^\s*(?:[-\*\u2022])\s+(#{1,3})\s?(.*)$/);
      if (liHead){
        closeList();
        var marks = liHead[1];
        var htxt = applyInline(liHead[2]);
        if (marks.length === 3) out += '<h3>' + htxt + '</h3>';
        else if (marks.length === 2) out += '<h2>' + htxt + '</h2>';
        else out += '<h1>' + htxt + '</h1>';
        continue;
      }
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
      var li = line.match(/^\s*(?:[-\*\u2022])\s+(.+)$/); // -, *, •
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
      // At top-level, return the content directly without bullet prefix
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
      // At top-level, drop the leading '-' markers and return as paragraphs
      if (depth === 0){
        res = res.replace(/^\s*-\s?/gm, '');
      }
      return res;
    }
    // object
    var lines = '';
    for (var key in value){
      if(!Object.prototype.hasOwnProperty.call(value, key)) continue;
      var val = value[key];
      var isTopLevel = depth === 0; 
      if (isTopLevel){
        // Render top-level keys as H1 sections to match "Skills" style
        lines += '# ' + String(key) + '\n';
        if (val && typeof val === 'object'){
          lines += valueToMarkdown(val, indent, depth + 1) + '\n';
        } else {
          lines += String(val) + '\n';
        }
        continue;
      }
      // Nested keys: keep bullet formatting
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
      // Prefer common fields if present
      var root = json.result || json.data || json.output || json;
      // If object is a single-key wrapper like { output: "..." }, unwrap it
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
  function formatWorkExperienceSection(value, shouldAnonymize) {
    var content = '';
    var experienceCount = 1;
    
    if (typeof value === 'string') {
      // If it's a string, anonymize company names only if shouldAnonymize is true
      var processedValue = shouldAnonymize ? anonymizeCompanyNames(value) : value;
      content = processedValue + '\n\n';
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Array of experiences
        value.forEach(function(exp) {
          if (typeof exp === 'string') {
            content += 'Work Experience ' + experienceCount + '\n';
            var anonymizedExp = anonymizeCompanyNames(exp);
            content += '"Position : ' + anonymizedExp + '"\n';
            content += '\t\t\n\n';
            experienceCount++;
          } else if (typeof exp === 'object') {
            content += 'Work Experience ' + experienceCount + '\n';
            var position = exp.Position || exp.position || exp.title || exp.job || 'Position';
            var company = exp.Company || exp.company || exp.organization || '';
            
            // Anonymize company name if present
            if (company) {
              company = anonymizeCompanyNames(company);
            }
            
            var positionText = position;
            if (company) {
              positionText += ' in ' + company;
            }
            content += '"Position : ' + positionText + '"\n';
            
            // Add body content (anonymize company names in descriptions too)
            var bodyContent = '';
            for (var key in exp) {
              if (exp.hasOwnProperty(key) && key.toLowerCase() !== 'position' && key.toLowerCase() !== 'company' && key.toLowerCase() !== 'title' && key.toLowerCase() !== 'job') {
                var anonymizedContent = anonymizeCompanyNames(exp[key]);
                bodyContent += anonymizedContent + ' ';
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
            var anonymizedKey = anonymizeCompanyNames(key);
            content += '"Position : ' + anonymizedKey + '"\n';
            var anonymizedValue = anonymizeCompanyNames(value[key]);
            content += '\t\t' + anonymizedValue + '\n\n';
            experienceCount++;
          }
        }
      }
    }
    
    return content;
  }

  // Function to anonymize company names in text
  function anonymizeCompanyNames(text) {
    if (!text || typeof text !== 'string') return text;
    
    // Function to convert number to alphabetical letter (A, B, C, ..., Z, AA, BB, etc.)
    function numberToLetter(num) {
      if (num <= 26) {
        return String.fromCharCode(64 + num); // A-Z
      } else {
        // After Z, use AA, BB, CC, etc.
        var letter = String.fromCharCode(64 + ((num - 1) % 26) + 1);
        var repeat = Math.floor((num - 1) / 26) + 1;
        return letter.repeat(repeat);
      }
    }
    
    // Common company name patterns to anonymize
    var companyPatterns = [
      // Company suffixes
      /\b[\w\s]+(?:\s+(?:Inc|LLC|Ltd|Corporation|Corp|Company|Co|Limited|Pvt|Private|Technologies|Tech|Systems|Solutions|Services|Consulting|Group|Holdings|International|Intl|Global|Worldwide|Industries|Enterprises|Associates|Partners)\.?)\b/gi,
      // Specific patterns
      /\b[A-Z][a-zA-Z\s&]+(?:\s+(?:Bank|Insurance|Financial|Healthcare|Pharmaceuticals|Software|Hardware|Manufacturing|Retail|Telecommunications|Media|Entertainment|Energy|Oil|Gas|Mining|Construction|Real Estate|Hospitality|Education|Research|Institute|University|College|Hospital|Clinic|Foundation|Trust|Authority|Agency|Department|Ministry|Government|Municipal|Federal|State|Public|National|Regional|Local))\b/gi,
      // Technology companies pattern
      /\b[A-Z][a-zA-Z]+(?:\s+(?:Technologies|Software|Systems|Solutions|Digital|Cloud|Data|Analytics|AI|Machine Learning|Blockchain|Fintech|Healthtech|Edtech))\b/gi,
      // Generic business names
      /\b[A-Z][a-zA-Z\s]{2,30}(?:\s+(?:Business|Ventures|Capital|Investments|Holdings|Management|Consulting|Advisory|Strategic|Professional|Commercial|Industrial|Logistics|Supply Chain|Marketing|Advertising|Creative|Design|Development|Engineering|Architecture|Legal|Law|Accounting|Finance))\b/gi
    ];
    
    var anonymizedText = text;
    var placeholderCount = 1;
    
    companyPatterns.forEach(function(pattern) {
      anonymizedText = anonymizedText.replace(pattern, function(match) {
        // Don't anonymize if it's already a placeholder
        if (match.toLowerCase().includes('company') && /company [a-z]+/i.test(match)) {
          return match;
        }
        return 'Company ' + numberToLetter(placeholderCount++);
      });
    });
    
    // Also anonymize specific well-known company names
    var knownCompanies = [
      'Microsoft', 'Google', 'Amazon', 'Apple', 'Facebook', 'Meta', 'Tesla', 'Netflix', 'Salesforce', 
      'Oracle', 'IBM', 'Intel', 'Cisco', 'Adobe', 'VMware', 'ServiceNow', 'Workday', 'Zoom', 
      'Slack', 'Atlassian', 'Shopify', 'Square', 'PayPal', 'Stripe', 'Uber', 'Lyft', 'Airbnb',
      'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 'Instagram', 'WhatsApp', 'Snapchat'
    ];
    
    knownCompanies.forEach(function(company) {
      var regex = new RegExp('\\b' + company + '\\b', 'gi');
      anonymizedText = anonymizedText.replace(regex, 'Company ' + numberToLetter(placeholderCount++));
    });
    
    return anonymizedText;
  }

  // Format Projects section with specific numbering and format
  function formatProjectsSection(value, shouldAnonymize) {
    var content = '';
    var projectCount = 1;
    
    if (typeof value === 'string') {
      // If it's a string, do NOT anonymize company names in Projects section
      content = value + '\n\n';
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Array of projects
        value.forEach(function(project) {
          if (typeof project === 'string') {
            content += 'Project ' + projectCount + '\n';
            var anonymizedTitle = anonymizeCompanyNames(project);
            content += 'Title: ' + anonymizedTitle + '\n';
            content += '\n\n';
            projectCount++;
          } else if (typeof project === 'object') {
            content += 'Project ' + projectCount + '\n';
            var title = project.Title || project.title || project.name || project.project || 'Project Title';
            var anonymizedTitle = anonymizeCompanyNames(title);
            content += 'Title: ' + anonymizedTitle + '\n';
            
            // Add body content (also anonymize company names in descriptions)
            var bodyContent = '';
            for (var key in project) {
              if (project.hasOwnProperty(key) && key.toLowerCase() !== 'title' && key.toLowerCase() !== 'name' && key.toLowerCase() !== 'project') {
                var anonymizedContent = anonymizeCompanyNames(project[key]);
                bodyContent += anonymizedContent + ' ';
              }
            }
            if (bodyContent.trim()) {
              content += bodyContent.trim() + '\n\n';
            } else {
              content += '\n\n';
            }
            projectCount++;
          }
        });
      } else {
        // Object with multiple projects
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            content += 'Project ' + projectCount + '\n';
            var anonymizedKey = anonymizeCompanyNames(key);
            content += 'Title: ' + anonymizedKey + '\n';
            var anonymizedValue = anonymizeCompanyNames(value[key]);
            content += anonymizedValue + '\n\n';
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

  // Convert JSON to structured markdown format for resume (same as vetting report)
  function convertJsonToStructuredMarkdown(jsonData) {
    var markdown = '';
    
    // Extract certifications and courses data to be merged into a single Certifications section
    var certificationsData = '';
    var coursesData = '';
    var processedData = {};
    
    // First pass: collect certifications, certificates, and courses data, keep other data
    for (var key in jsonData) {
      if (jsonData.hasOwnProperty(key)) {
        var lowerKey = key.toLowerCase();
        // Check for certifications, certificates, and courses
        if (lowerKey.includes('certification') || lowerKey.includes('certificate')) {
          var certValue = jsonData[key];
          if (typeof certValue === 'string') {
            certificationsData += certValue + '\n';
          } else if (Array.isArray(certValue)) {
            certificationsData += certValue.join('\n') + '\n';
          } else if (typeof certValue === 'object') {
            for (var subKey in certValue) {
              if (certValue.hasOwnProperty(subKey)) {
                certificationsData += certValue[subKey] + '\n';
              }
            }
          }
        } else if (lowerKey.includes('course')) {
          var courseValue = jsonData[key];
          if (typeof courseValue === 'string') {
            coursesData += courseValue + '\n';
          } else if (Array.isArray(courseValue)) {
            coursesData += courseValue.join('\n') + '\n';
          } else if (typeof courseValue === 'object') {
            for (var subKey in courseValue) {
              if (courseValue.hasOwnProperty(subKey)) {
                coursesData += courseValue[subKey] + '\n';
              }
            }
          }
        } else {
          processedData[key] = jsonData[key];
        }
      }
    }
    
    // Extract summary data from candidate_info and make it the FIRST section
    var summaryText = '';
    var candidateInfo = jsonData['Candidate Info'] || 
                       jsonData['candidate_info'] || 
                       jsonData['candidateInfo'] ||
                       jsonData['Candidate_Info'] ||
                       null;
    
    if (candidateInfo) {
      var possibleSummaryFields = [
        'summary', 'Summary', 'SUMMARY',
        'professional summary', 'Professional Summary',
        'profile summary', 'Profile Summary', 
        'objective', 'Objective', 'OBJECTIVE',
        'about', 'About', 'ABOUT'
      ];
      
      for (var i = 0; i < possibleSummaryFields.length; i++) {
        var fieldName = possibleSummaryFields[i];
        if (candidateInfo[fieldName] && typeof candidateInfo[fieldName] === 'string' && candidateInfo[fieldName].trim()) {
          summaryText = candidateInfo[fieldName].trim();
          console.log('Found summary in candidate_info field:', fieldName);
          break;
        }
      }
    }
    
    // Add Summary as the FIRST section if we have summary data
    if (summaryText && summaryText.length > 10) {
      processedData['Summary'] = summaryText;
      console.log('Added Summary as first section from candidate_info');
    }
    
    // Create a unified Certifications section combining both certifications and courses
    var combinedCertData = '';
    
    // Add certifications data first
    if (certificationsData.trim()) {
      combinedCertData += certificationsData.trim();
    }
    
    // Add courses data (with separator if both exist)
    if (coursesData.trim()) {
      if (combinedCertData) {
        combinedCertData += '\n'; // Add separator line
      }
      combinedCertData += coursesData.trim();
    }
    
    // Only create the Certifications section if we have data
    if (combinedCertData.trim()) {
      processedData['Certifications'] = combinedCertData.trim();
      console.log('Created unified Certifications section with combined data:', combinedCertData.trim());
    }
    
    // Get all available keys from the processed JSON data
    var availableKeys = Object.keys(processedData);
    console.log('Converting JSON to structured markdown. Available keys:', availableKeys);
    
    // Define preferred order with Summary FIRST at the top, then other sections
    var preferredOrder = [
      'Summary', 'summary', 'SUMMARY',
      'Professional Summary', 'professional summary', 'Professional_Summary', 'professional_summary',
      'Profile Summary', 'profile summary', 'Profile_Summary', 'profile_summary',
      'Experience Summary', 'experience summary', 'Experience_Summary', 'experience_summary',
      'Candidate Info', 'candidate_info', 'candidateInfo', 'Candidate_Info',
      'Certifications', 'certifications', 'Certification', 'certification', 'CERTIFICATIONS', 'CERTIFICATION',
      'Certificate', 'certificate', 'Certificates', 'certificates', 'CERTIFICATE', 'CERTIFICATES',
      'Skills', 'skills', 'Skill', 'skill', 'SKILLS', 'SKILL'
    ];
    
    // Log what certification/course data we're processing to debug duplicates
    console.log('Processing certification data - Certifications found:', !!certificationsData);
    console.log('Processing certification data - Courses found:', !!coursesData);
    console.log('Available keys before processing:', Object.keys(jsonData));
    
    console.log('Processing sections in order:', preferredOrder);
    
    // Process sections in preferred order first
    var processedKeys = [];
    preferredOrder.forEach(function(preferredKey) {
      if (availableKeys.includes(preferredKey)) {
        processedKeys.push(preferredKey);
      }
    });
    
    // Add remaining keys that weren't in preferred order
    // But exclude original certification/course keys since we've already merged them
    availableKeys.forEach(function(key) {
      if (!processedKeys.includes(key)) {
        var lowerKey = key.toLowerCase();
        // Skip original certification/course keys since we've merged them
        if (!lowerKey.includes('certification') && !lowerKey.includes('certificate') && !lowerKey.includes('course')) {
          processedKeys.push(key);
        }
      }
    });
    
    console.log('Final processed keys (after excluding merged cert/course data):', processedKeys);
    
    // Process each key to create structured markdown
    processedKeys.forEach(function(key) {
      var value = processedData[key];
      var sectionTitle = key;
      var sectionContent = '';
      var lowerKey = key.toLowerCase();
      
      // Determine if this section should have company anonymization
      var shouldAnonymize = (lowerKey.includes('work experience') || 
                            lowerKey.includes('work_experience') || 
                            lowerKey.includes('summary') ||
                            lowerKey === 'summary');
      
      // Special formatting for Work Experience and Projects
      if (lowerKey.includes('work experience') || lowerKey.includes('work_experience')) {
        sectionContent = formatWorkExperienceSection(value, true); // Anonymize in Work Experience
      } else if (lowerKey.includes('project') && !lowerKey.includes('experience')) {
        sectionContent = formatProjectsSection(value, false); // Don't anonymize in Projects
      } else if (lowerKey.includes('skills')) {
        // Format Skills as a proper section with heading
        sectionContent = formatSkillsSection(value);
      } else {
        // Handle different data types and convert to markdown
        if (typeof value === 'string') {
          // String data - anonymize only if this is Summary section
          var processedValue = shouldAnonymize ? anonymizeCompanyNames(value) : value;
          sectionContent = processedValue + '\n\n';
        } else if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            // Array data - format as bullet list (anonymize only in Summary)
            sectionContent = '';
            value.forEach(function(item) {
              if (typeof item === 'string') {
                var processedItem = shouldAnonymize ? anonymizeCompanyNames(item) : item;
                sectionContent += '- ' + processedItem + '\n';
              } else if (typeof item === 'object') {
                sectionContent += '- ';
                var itemParts = [];
                for (var subKey in item) {
                  if (item.hasOwnProperty(subKey)) {
                    var processedSubValue = shouldAnonymize ? anonymizeCompanyNames(item[subKey]) : item[subKey];
                    itemParts.push('**' + subKey + ':** ' + processedSubValue);
                  }
                }
                sectionContent += itemParts.join(', ') + '\n';
              }
            });
            sectionContent += '\n';
          } else {
            // Object data - format as key-value pairs (anonymize only in Summary)
            sectionContent = '';
            for (var subKey in value) {
              if (value.hasOwnProperty(subKey)) {
                var subValue = value[subKey];
                if (typeof subValue === 'string') {
                  var processedSubValue = shouldAnonymize ? anonymizeCompanyNames(subValue) : subValue;
                  sectionContent += '**' + subKey + ':** ' + processedSubValue + '\n\n';
                } else if (typeof subValue === 'object' && subValue !== null) {
                  sectionContent += '### ' + subKey + '\n';
                  for (var subSubKey in subValue) {
                    if (subValue.hasOwnProperty(subSubKey)) {
                      var processedSubSubValue = shouldAnonymize ? anonymizeCompanyNames(subValue[subSubKey]) : subValue[subSubKey];
                      sectionContent += '**' + subSubKey + ':** ' + processedSubSubValue + '\n\n';
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
  // Convert plain extracted text (e.g., from PDF) into simple markdown
  function plainToMarkdown(text){
    var t = String(text||'').replace(/\r\n?/g,'\n');
    var lines = t.split('\n');
    var out = '';
    var headingSet = {
      'profile summary': true,
      'professional summary': true,
      'summary': true,
      'skills': true,
      'technical skills': true,
      'core competencies': true,
      'specializations': true,
      'compliance standards': true,
      'education': true,
      'certifications': true,
      'certificates': true,
      'certificate': true,
      'projects': true,
      'work experience': true,
      'employment history': true,
      'experience': true,
      'achievements': true,
      'awards': true,
      'responsibilities': true,
      'objective': true
    };
    for (var i = 0; i < lines.length; i++){
      var raw = lines[i];
      var line = raw.trim().replace(/\s+/g,' ');
      if (!line){ out += '\n'; continue; }
      // If line begins with a bullet char, convert to markdown list item
      var leadBullet = line.match(/^(?:[\u2022\-\*]\s+)(.+)$/); // • or - or * at start
      if (leadBullet){ out += '- ' + leadBullet[1].trim() + '\n'; continue; }
      // Headings: exact match against common section titles (with optional trailing colon)
      var noColon = line.replace(/:$/, '');
      if (headingSet[noColon.toLowerCase()]){ out += '# ' + noColon + '\n\n'; continue; }
      // Heuristic: Title Case short lines without punctuation become headings
      if (/^[A-Z][A-Za-z ]{2,60}$/.test(noColon) && /[A-Z][a-z]+\s+[A-Z]/.test(noColon)){
        out += '# ' + noColon + '\n\n';
        continue;
      }
      // Bullet separators on same line
      if (/•/.test(line)){
        var parts = line.split(/\s*•\s*/).filter(function(p){ return p && p.trim(); });
        if (parts.length > 1){
          for (var j = 0; j < parts.length; j++) out += '- ' + parts[j].trim() + '\n';
          out += '\n';
          continue;
        }
      }
      // Key: Value pairs -> bold key
      var kv = line.match(/^([A-Za-z][A-Za-z ]{2,40}):\s+(.+)$/);
      if (kv){ out += '- **' + kv[1].trim() + '**: ' + kv[2].trim() + '\n'; continue; }
      // Default paragraph line
      out += line + '\n';
    }
    return out;
  }
  // Convert basic HTML (from DOCX) to markdown-like text
  function htmlToMarkdown(html){
    try{
      var tmp = document.createElement('div');
      tmp.innerHTML = String(html || '');
      var out = '';
      function walk(node){
        var tag = (node.tagName||'').toLowerCase();
        if (tag === 'h1' || tag === 'h2' || tag === 'h3'){
          var level = tag === 'h1' ? '#' : (tag === 'h2' ? '##' : '###');
          out += level + ' ' + (node.textContent||'') + "\n\n";
          return;
        }
        if (tag === 'p'){
          var t = node.textContent || '';
          if (t.trim()) out += t + "\n\n";
          return;
        }
        if (tag === 'ul'){
          var items = node.querySelectorAll('li');
          for (var i = 0; i < items.length; i++){
            var liText = items[i].textContent || '';
            out += '- ' + liText + "\n";
          }
          out += "\n";
          return;
        }
        for (var c = 0; c < node.childNodes.length; c++) walk(node.childNodes[c]);
      }
      for (var i = 0; i < tmp.childNodes.length; i++) walk(tmp.childNodes[i]);
      return out.trim();
    }catch(e){ return ''; }
  }

  var data = sessionStorage.getItem('resume_extractor_result');
  try{ data = data ? JSON.parse(data) : null; }catch(e){ data=null }
  var extractedEl = document.getElementById('extracted');
  var markdownEl = document.getElementById('markdown');
  var templateArrayBuffer = null;
  var TEMPLATE_PATHS = [
    'Word%20format/Sample%20word.docx',
    'Word format/Sample word.docx'
  ];
  // Optional base for resolving relative template URLs.
  // Defaults to the provided hosted site so templates load from the web by default
  // even when the app runs on another origin.
  function getTemplateBase(){
    try{
      var params = new URLSearchParams(window.location.search || '');
      var qBase = params.get('templateBase');
      if (qBase) return String(qBase).trim();
      var ss = sessionStorage.getItem('resume_extractor_template_base');
      if (ss) return String(ss).trim();
    }catch(e){}
    try{
      var isHttp = location.protocol === 'http:' || location.protocol === 'https:';
      if (isHttp){
        // Default to the current site origin to avoid CORS (works on localhost and hosted)
        var origin = (location.origin || (location.protocol + '//' + location.host));
        // If the site is already on reditor.linkd365.com, this preserves that origin
        return origin.replace(/\/$/, '/') + '';
      }
    }catch(e){}
    // Fallback
    return 'https://reditor.linkd365.com/';
  }

  function getOverrideTemplateUrls(){
    try{
      // Prefer query parameter first
      var params = new URLSearchParams(window.location.search || '');
      var q = params.get('template');
      if (q){
        // support comma-separated list
        var rawList = String(q).split(',').map(function(s){ return s.trim(); }).filter(Boolean);
        return rawList.map(normalizeToAbsoluteUrl);
      }
      // Fallback to sessionStorage key
      var raw = sessionStorage.getItem('resume_extractor_template_urls');
      if (raw){
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr.map(normalizeToAbsoluteUrl);
        if (typeof raw === 'string') return [ normalizeToAbsoluteUrl(String(raw)) ];
      }
    }catch(e){}
    return null;
  }
  function normalizeToAbsoluteUrl(input){
    try{
      var s = String(input || '').trim();
      if (!s) return s;
      if (/^https?:\/\//i.test(s)) return s; // absolute http(s)
      if (s.indexOf('//') === 0) return (location.protocol || 'https:') + s; // protocol-relative
      // Use configured template base for root-relative and relative paths
      var base = getTemplateBase();
      if (s[0] === '/') return new URL(s, base).toString();
      return new URL(s, base).toString();
    }catch(e){ return String(input||''); }
  }

  // Try to pre-load the provided sample template if it exists in the project
  (function tryLoadSampleTemplate(){
    var isHttp = location.protocol === 'http:' || location.protocol === 'https:';
    if (!isHttp) return; // avoid CORS noise on file://
    var override = getOverrideTemplateUrls();
    function attemptIdx(i){
      var sources = override && override.length ? override : TEMPLATE_PATHS;
      if (i >= sources.length) return Promise.reject(new Error('no template'));
      var p = sources[i] + (sources === TEMPLATE_PATHS ? ('?v=' + Date.now()) : '');
      return fetch(p, { cache:'no-store' })
        .then(function(res){ if(!res.ok) throw new Error('missing'); return res.arrayBuffer(); })
        .then(function(buf){ templateArrayBuffer = buf; })
        .catch(function(){ return attemptIdx(i+1); });
    }
    attemptIdx(0).catch(function(){ /* ignore if not found */ });
  })();

  // No manual upload; template is auto-loaded from Word format/Sample word.docx if present

  function flattenObject(obj, prefix, out){
    out = out || {}; prefix = prefix || '';
    if (obj === null || obj === undefined) return out;
    if (Array.isArray(obj)){
      out[prefix || 'list'] = obj;
      for (var i=0;i<obj.length;i++){
        flattenObject(obj[i], prefix ? (prefix + '.' + i) : String(i), out);
      }
      return out;
    }
    if (typeof obj === 'object'){
      for (var k in obj){ if(!Object.prototype.hasOwnProperty.call(obj,k)) continue; flattenObject(obj[k], prefix ? (prefix + '.' + k) : k, out); }
      return out;
    }
    out[prefix] = obj;
    // Also provide a simplified key without dots for convenience
    var simpleKey = String(prefix).replace(/[^A-Za-z0-9]+/g,'_');
    if (!(simpleKey in out)) out[simpleKey] = obj;
    return out;
  }

  // Left: show the original uploaded file when available; otherwise fallback to server-provided text
  var uploadedMeta = null;
  try{ uploadedMeta = JSON.parse(sessionStorage.getItem('resume_extractor_input_file') || 'null'); }catch(e){ uploadedMeta = null; }
  if (uploadedMeta && uploadedMeta.base64){
    function b64ToText(b64){
      try{
        var binary = atob(b64);
        var bytes = new Uint8Array(binary.length);
        for (var i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
        if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
        var s = '';
        for (var j=0;j<bytes.length;j++) s += String.fromCharCode(bytes[j]);
        try { return decodeURIComponent(escape(s)); } catch(e){ return s; }
      }catch(e){ return ''; }
    }
    var textPreview = uploadedMeta.textPreview || '';
    var fileType = (uploadedMeta.type||'').toLowerCase();
    var fileName = (uploadedMeta.name||'').toLowerCase();
    function renderText(t){
      var md = plainToMarkdown(String(t||''));
      extractedEl.innerHTML = mdToHtml(md);
    }
    // Prefer text preview if present
    if (textPreview){ renderText(textPreview); }
    else if (fileType.indexOf('application/pdf') !== -1 || /\.pdf$/.test(fileName)){
      try{
        var raw = atob(uploadedMeta.base64);
        var len = raw.length;
        var bytes = new Uint8Array(len);
        for (var k=0;k<len;k++) bytes[k] = raw.charCodeAt(k);
        var blob = new Blob([bytes], { type:'application/pdf' });
        var url = URL.createObjectURL(blob);
        var pdfjsLib = window['pdfjs-dist/build/pdf'];
        if (pdfjsLib && pdfjsLib.GlobalWorkerOptions){
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        pdfjsLib.getDocument(url).promise.then(function(pdf){
          var out = '';
          var jobs = [];
          for (var p=1;p<=pdf.numPages;p++){
            jobs.push(pdf.getPage(p).then(function(page){ return page.getTextContent(); }).then(function(tc){
              var pageText = tc.items.map(function(it){ return it.str; }).join(' ');
              out += pageText + '\n\n';
            }));
          }
          Promise.all(jobs).then(function(){
            URL.revokeObjectURL(url);
            var md = plainToMarkdown(out);
            extractedEl.innerHTML = mdToHtml(md);
          }).catch(function(){ URL.revokeObjectURL(url); renderText(''); });
        }).catch(function(){ URL.revokeObjectURL(url); renderText(''); });
      }catch(e){ renderText(''); }
    } else if (fileType.indexOf('application/vnd.openxmlformats-officedocument.wordprocessingml.document') !== -1 || /\.(docx)$/.test(fileName)){
      try{
        var binaryDocx = atob(uploadedMeta.base64);
        var len2 = binaryDocx.length;
        var buf = new ArrayBuffer(len2);
        var view = new Uint8Array(buf);
        for (var m=0;m<len2;m++) view[m] = binaryDocx.charCodeAt(m);
        if (window.mammoth && window.mammoth.convertToHtml){
          window.mammoth.convertToHtml({ arrayBuffer: buf }).then(function(r){
            var html = r && r.value ? r.value : '';
            var md = htmlToMarkdown(html);
            extractedEl.innerHTML = mdToHtml(md || '');
          }).catch(function(){ renderText(b64ToText(uploadedMeta.base64)); });
        } else {
          renderText(b64ToText(uploadedMeta.base64));
        }
      }catch(e){ renderText(b64ToText(uploadedMeta.base64)); }
    } else {
      renderText(b64ToText(uploadedMeta.base64));
    }
  } else if(!data){
    extractedEl.innerHTML = '<p>No result payload found. Please upload again.</p>';
  } else if (data.text){
    extractedEl.innerHTML = mdToHtml(String(data.text));
  } else {
    extractedEl.innerHTML = '<p>No input text available.</p>';
  }

  // Right: convert returned JSON to structured markdown format (same as vetting report)
  if (markdownEl){
    var md = '';
    if (data && data.json) {
      // Use the same structured markdown conversion as vetting report
      md = convertJsonToStructuredMarkdown(data.json);
    } else {
      md = jsonToMarkdown(data && data.json ? data.json : null);
    }
    // Normalize: remove bullet marker before markdown headings so they render as real headings
    md = md.replace(/^\s*(?:[-\*\u2022]\s+)?(#{1,3})\s*(.+)$/gm, function(_, marks, title){
      return marks + ' ' + title.trim();
    });
    
    // Convert any "Courses", "Certificate", or "Certificates" headings to "Certifications"
    md = md.replace(/^(#{1,3})\s*(Courses?|Certificates?)\s*$/gmi, '$1 Certifications');
    md = md.replace(/^(#{1,3})\s*(COURSES?|CERTIFICATES?)\s*$/gm, '$1 Certifications');
    
    // Remove duplicate Certifications headings - keep only the first one and merge content
    var lines = md.split('\n');
    var processedLines = [];
    var certificationsSectionFound = false;
    var certificationContent = [];
    
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var isCertHeading = /^#{1,3}\s*Certifications\s*$/i.test(line);
      
      if (isCertHeading) {
        if (!certificationsSectionFound) {
          // First certifications heading - keep it
          processedLines.push(line);
          certificationsSectionFound = true;
        }
        // Skip subsequent certifications headings and collect their content
      } else if (certificationsSectionFound && /^#{1,3}\s*\w/.test(line)) {
        // Hit another heading - add collected certification content first
        if (certificationContent.length > 0) {
          processedLines = processedLines.concat(certificationContent);
          certificationContent = [];
        }
        processedLines.push(line);
        certificationsSectionFound = false;
      } else if (certificationsSectionFound || (line && !line.match(/^#{1,3}\s*\w/))) {
        // Content line under certifications or general content
        if (certificationsSectionFound) {
          certificationContent.push(line);
        } else {
          processedLines.push(line);
        }
      } else {
        processedLines.push(line);
      }
    }
    
    // Add any remaining certification content
    if (certificationContent.length > 0) {
      processedLines = processedLines.concat(certificationContent);
    }
    
    md = processedLines.join('\n');
    

    // Remove "output:" text and number prefixes
    md = md.replace(/^\s*\d+\s*output\s*:\s*/gm, '');
    md = md.replace(/^output\s*:\s*/gm, '');
    // Remove "Profile Summary" heading and standalone numbers
    md = md.replace(/^#\s*Profile\s+Summary\s*$/gm, '');
    md = md.replace(/^\s*\d+\s*$/gm, '');
    // Remove Profile Summary heading but keep the content
    md = md.replace(/^#\s*Profile\s+Summary\s*$/gm, '');
    // Remove any "Profile Summary" text
    md = md.replace(/Profile\s+Summary/gi, '');
    // Remove "Candidate Info" heading and clean up any remaining unwanted text
    md = md.replace(/^#\s*Candidate\s+Info\s*$/gm, '');
    md = md.replace(/^\s*output\s*:\s*$/gm, '');
    md = md.replace(/^\s*\d+\s*$/gm, '');
    // Remove the entire Profile Summary section with "Not available" fields
    md = md.replace(/^#\s*Profile\s+Summary\s*[\s\S]*?(?=^#|\Z)/gm, '');
    md = md.replace(/\*\*Name:\*\*\s*Not available\s*/gm, '');
    md = md.replace(/\*\*Contact no:\*\*\s*Not available\s*/gm, '');
    md = md.replace(/\*\*Email:\*\*\s*Not available\s*/gm, '');
    // Remove all Profile Summary related content - more aggressive patterns
    md = md.replace(/^#\s*Profile\s+Summary\s*$/gm, '');
    md = md.replace(/^Name:\s*Not available\s*$/gm, '');
    md = md.replace(/^Contact no:\s*Not available\s*$/gm, '');
    md = md.replace(/^Email:\s*Not available\s*$/gm, '');
    md = md.replace(/^0\s*$/gm, '');
    md = md.replace(/^output:\s*$/gm, '');
    md = md.replace(/^#\s*Candidate\s+Info\s*$/gm, '');
    // More aggressive removal patterns
    md = md.replace(/Profile\s+Summary/gi, '');
    md = md.replace(/Name:\s*Not available/gi, '');
    md = md.replace(/Contact no:\s*Not available/gi, '');
    md = md.replace(/Email:\s*Not available/gi, '');
    md = md.replace(/^\s*0\s*$/gm, '');
    md = md.replace(/output:/gi, '');
    md = md.replace(/Candidate\s+Info/gi, '');
    // Remove any lines that contain only these patterns
    md = md.replace(/^.*Profile\s+Summary.*$/gm, '');
    md = md.replace(/^.*Name:\s*Not available.*$/gm, '');
    md = md.replace(/^.*Contact no:\s*Not available.*$/gm, '');
    md = md.replace(/^.*Email:\s*Not available.*$/gm, '');
    md = md.replace(/^.*output:.*$/gm, '');
    md = md.replace(/^.*Candidate\s+Info.*$/gm, '');
    // Don't remove Skills section - let it display normally
    // md = md.replace(/^#\s*Skills\s*[\s\S]*?(?=^#|\Z)/gm, '');
    // md = md.replace(/^\*\*Skills:\*\*[\s\S]*?(?=^\*\*|^#|\Z)/gm, '');
    // Keep Summary under golden heading - don't remove it
    // md = md.replace(/^\*\*Summary:\*\*[\s\S]*?(?=^\*\*|^#|\Z)/gm, '');
    // md = md.replace(/^#\s*Summary\s*[\s\S]*?(?=^#|\Z)/gm, '');
    // Remove any empty lines that might be left
    md = md.replace(/^\s*$/gm, '');
    md = md.replace(/\n\s*\n\s*\n/g, '\n\n');
    markdownEl.innerHTML = mdToHtml(md);
    
    // Display job description if available
    var jobDesc = sessionStorage.getItem('job_description');
    if (jobDesc && jobDesc.trim()) {
      var jobDescDisplay = document.getElementById('jobDescriptionDisplay');
      var jobDescText = document.getElementById('jobDescriptionText');
      if (jobDescDisplay && jobDescText) {
        jobDescText.textContent = jobDesc;
        jobDescDisplay.style.display = 'block';
      }
    }
    
    // Find and move Summary content (between Certifications and Skills) to the top
    setTimeout(function() {
      if (!markdownEl) return;
      
      var allHeadings = markdownEl.querySelectorAll('h1, h2, h3');
      var certificationsHeading = null;
      var skillsHeading = null;
      var summaryContent = [];
      
      // Find Certifications and Skills headings
      for (var i = 0; i < allHeadings.length; i++) {
        var headingText = (allHeadings[i].textContent || '').toLowerCase().trim();
        
        if (headingText === 'certifications' || headingText === 'certification') {
          certificationsHeading = allHeadings[i];
        } else if (headingText === 'skills' || headingText === 'skill') {
          skillsHeading = allHeadings[i];
          break; // Stop at first skills heading
        }
      }
      
      // If we found both headings, collect content between them (this is the Summary)
      if (certificationsHeading && skillsHeading) {
        var currentNode = certificationsHeading.nextSibling;
        
        // Skip the Certifications content itself
        while (currentNode && !['H1', 'H2', 'H3'].includes(currentNode.tagName || '')) {
          currentNode = currentNode.nextSibling;
        }
        
        // Now collect content until we reach Skills (this should be Summary content)
        while (currentNode && currentNode !== skillsHeading) {
          if (currentNode.nodeType === Node.ELEMENT_NODE || currentNode.nodeType === Node.TEXT_NODE) {
            summaryContent.push(currentNode);
          }
          currentNode = currentNode.nextSibling;
        }
        
        // If we found content between Certifications and Skills, treat it as Summary
        if (summaryContent.length > 0) {
          // Create Summary heading
          var summaryHeading = document.createElement('h1');
          summaryHeading.textContent = 'Summary';
          summaryHeading.style.color = '#3b82f6';
          summaryHeading.style.fontSize = '1.4rem';
          summaryHeading.style.fontWeight = '800';
          summaryHeading.style.marginTop = '20px';
          summaryHeading.style.marginBottom = '10px';
          
          // Remove summary content from current position
          summaryContent.forEach(function(node) {
            if (node.parentNode) node.remove();
          });
          
          // Insert Summary section at the very beginning (before Certifications)
          if (markdownEl.firstChild) {
            markdownEl.insertBefore(summaryHeading, markdownEl.firstChild);
            var insertAfter = summaryHeading;
            summaryContent.forEach(function(node) {
              markdownEl.insertBefore(node, insertAfter.nextSibling);
              insertAfter = node;
            });
          } else {
            markdownEl.appendChild(summaryHeading);
            summaryContent.forEach(function(node) {
              markdownEl.appendChild(node);
            });
          }
          
          console.log('Created Summary section and moved to top, above Certifications');
        }
      }
      
      // Also check for existing Summary headings and ensure they're at the top
      var existingSummaryHeading = null;
      var existingSummaryContent = [];
      
      var updatedHeadings = markdownEl.querySelectorAll('h1, h2, h3');
      updatedHeadings.forEach(function(heading) {
        var headingText = (heading.textContent || '').toLowerCase().trim();
        if (headingText === 'summary' || headingText === 'professional summary' || headingText === 'profile summary') {
          // Skip if this is the one we just created
          if (heading.textContent === 'Summary' && heading === markdownEl.querySelector('h1')) {
            return;
          }
          
          existingSummaryHeading = heading;
          
          // Collect content after this heading until next heading
          var nextNode = heading.nextSibling;
          while (nextNode && !['H1', 'H2', 'H3'].includes(nextNode.tagName || '')) {
            existingSummaryContent.push(nextNode);
            nextNode = nextNode.nextSibling;
          }
        }
      });
      
      // If we found an existing Summary section that's not at the top, move it
      if (existingSummaryHeading && existingSummaryHeading !== markdownEl.querySelector('h1')) {
        // Style the summary heading properly
        existingSummaryHeading.style.color = '#3b82f6';
        existingSummaryHeading.style.fontSize = '1.4rem';
        existingSummaryHeading.style.fontWeight = '800';
        existingSummaryHeading.style.marginTop = '20px';
        existingSummaryHeading.style.marginBottom = '10px';
        
        // Remove from current position
        existingSummaryContent.forEach(function(node) {
          if (node.parentNode) node.remove();
        });
        if (existingSummaryHeading.parentNode) existingSummaryHeading.remove();
        
        // Insert at the very beginning
        if (markdownEl.firstChild) {
          markdownEl.insertBefore(existingSummaryHeading, markdownEl.firstChild);
          var insertAfter = existingSummaryHeading;
          existingSummaryContent.forEach(function(node) {
            markdownEl.insertBefore(node, insertAfter.nextSibling);
            insertAfter = node;
          });
        } else {
          markdownEl.appendChild(existingSummaryHeading);
          existingSummaryContent.forEach(function(node) {
            markdownEl.appendChild(node);
          });
        }
        
        console.log('Moved existing Summary section to the top');
      }
    }, 30);
    
    // Remove duplicate Certifications sections in the DOM
    setTimeout(function() {
      if (!markdownEl) return;
      var certHeadings = markdownEl.querySelectorAll('h1, h2, h3');
      var certificationHeadings = [];
      
      // Find all certification headings
      certHeadings.forEach(function(heading) {
        if (heading.textContent && heading.textContent.toLowerCase().trim() === 'certifications') {
          certificationHeadings.push(heading);
        }
      });
      
      // If we have multiple certification headings, merge them
      if (certificationHeadings.length > 1) {
        var firstCertSection = certificationHeadings[0];
        var allCertContent = [];
        
        // Collect content from all certification sections
        certificationHeadings.forEach(function(heading, index) {
          var nextNode = heading.nextSibling;
          while (nextNode && !['H1', 'H2', 'H3'].includes(nextNode.tagName || '')) {
            if (index === 0) {
              // Keep content of first section in place
              nextNode = nextNode.nextSibling;
            } else {
              // Collect content from other sections
              var nodeToMove = nextNode;
              nextNode = nextNode.nextSibling;
              allCertContent.push(nodeToMove);
            }
          }
          
          // Remove duplicate headings (keep only the first)
          if (index > 0) {
            heading.remove();
          }
        });
        
        // Insert all collected content after the first certification section
        var insertAfter = firstCertSection;
        var nextNode = insertAfter.nextSibling;
        while (nextNode && !['H1', 'H2', 'H3'].includes(nextNode.tagName || '')) {
          insertAfter = nextNode;
          nextNode = nextNode.nextSibling;
        }
        
        // Insert collected content
        allCertContent.forEach(function(node) {
          insertAfter.parentNode.insertBefore(node, insertAfter.nextSibling);
          insertAfter = node;
        });
      }
    }, 50);
    
    // Add golden color class to Skills heading
    setTimeout(function() {
      var headings = markdownEl.querySelectorAll('h1');
      headings.forEach(function(heading) {
        if (heading.textContent && heading.textContent.toLowerCase().includes('skills')) {
          heading.classList.add('skills-heading');
        }
      });
    }, 100);
    

    
    // Add golden color class to Certifications heading (including variations)
    setTimeout(function() {
      var headings = markdownEl.querySelectorAll('h1');
      headings.forEach(function(heading) {
        if (heading.textContent) {
          var text = heading.textContent.toLowerCase();
          if (text.includes('certifications') || text.includes('certificates') || text.includes('certificate')) {
            heading.classList.add('certifications-heading');
          }
        }
      });
    }, 100);
    
    // Make Summary text appear as a heading with same size as Certifications
    setTimeout(function() {
      var strongElements = markdownEl.querySelectorAll('strong');
      strongElements.forEach(function(element) {
        if (element.textContent && element.textContent.toLowerCase().includes('summary:')) {
          element.classList.add('summary-heading');
        }
      });
    }, 100);
    
    // Hide unwanted elements after content is rendered
    setTimeout(function() {
      // Hide Profile Summary heading
      var headings = markdownEl.querySelectorAll('h1, h2, h3');
      headings.forEach(function(heading) {
        if (heading.textContent && heading.textContent.toLowerCase().includes('profile summary')) {
          heading.style.display = 'none';
        }
      });
      
      // Hide Candidate Info heading
      headings.forEach(function(heading) {
        if (heading.textContent && heading.textContent.toLowerCase().includes('candidate info')) {
          heading.style.display = 'none';
        }
      });
      
      // Hide elements containing "Not available"
      var allElements = markdownEl.querySelectorAll('*');
      allElements.forEach(function(element) {
        if (element.textContent && element.textContent.includes('Not available')) {
          element.style.display = 'none';
        }
      });
      
      // Hide elements containing "output:"
      allElements.forEach(function(element) {
        if (element.textContent && element.textContent.toLowerCase().includes('output:')) {
          element.style.display = 'none';
        }
      });
      
      // Hide standalone "0" elements
      allElements.forEach(function(element) {
        if (element.textContent && element.textContent.trim() === '0') {
          element.style.display = 'none';
        }
      });
      
      // Hide elements containing just "#" or starting with "#"
      allElements.forEach(function(element) {
        if (element.textContent && (element.textContent.trim() === '#' || element.textContent.trim().startsWith('# '))) {
          element.style.display = 'none';
        }
      });
    }, 200);
    
    // Normalize first block: ensure a literal markdown heading like "# Title" becomes a real H tag
    try{
      var firstPara = markdownEl.querySelector('p');
      if (firstPara){
        var t = (firstPara.textContent || '').trim();
        var m3 = t.match(/^(#{1,3})\s+(.*)$/);
        if (m3){
          var level = m3[1].length;
          var tag = level === 1 ? 'h1' : (level === 2 ? 'h2' : 'h3');
          var h = document.createElement(tag);
          h.textContent = m3[2];
          firstPara.replaceWith(h);
        }
      }
      // Insert a line break between the first and second word of the first paragraph (if any)
      var firstBlock = markdownEl.querySelector('p');
      if (firstBlock && !firstBlock.__splitOnce){
        var raw = firstBlock.textContent || '';
        var m = raw.match(/^(\S+)\s+(.*)$/);
        if (m){
          firstBlock.innerHTML = escapeHtml(m[1]) + '<br>' + escapeHtml(m[2]);
          firstBlock.__splitOnce = true;
        }
      }
      // Ensure the very first visible block renders as a heading if it looks like one
      (function ensureFirstHeadingSize(){
        var el = markdownEl.firstElementChild;
        if (!el || (el.tagName||'').toLowerCase() !== 'p') return;
        var txt = (el.textContent||'').trim();
        if (!txt) return;
        function looksLikeHeading(s){
          // Short title-case line with no trailing punctuation
          if (/[.!?]$/.test(s)) return false;
          var words = s.split(/\s+/).filter(Boolean);
          if (words.length === 0 || words.length > 8) return false;
          var capped = 0;
          for (var i=0;i<words.length;i++){
            if (/^[A-Z][A-Za-z0-9()\-]*$/.test(words[i]) || /^[A-Z0-9]{2,}$/.test(words[i])) capped++;
          }
          return capped >= Math.max(2, Math.ceil(words.length*0.6));
        }
        // Remove leading "output:" and optional heading mark if present
        var clean = txt.replace(/^output\s*:\s*(?:#\s*)?/i, '').trim();
        if (!clean) return;
        if (/^output\s*:/i.test(txt) || looksLikeHeading(clean)){
          var h = document.createElement('h1'); h.textContent = clean; el.replaceWith(h);
        }
      })();
      // Transform any bullet like "output: # Title" into a proper H1 heading
      var lis = markdownEl.querySelectorAll('li');
      for (var ii=0; ii<lis.length; ii++){
        var txt = (lis[ii].textContent||'').trim();
        var mOut = txt.match(/^output\s*:\s*(?:#\s*)?(.*)$/i);
        if (mOut && mOut[1]){
          var h = document.createElement('h1'); h.textContent = mOut[1]; lis[ii].replaceWith(h);
        }
      }
      // Convert short standalone lines (<=10 words) into compact bullet lists
      (function convertShortLinesToBullets(){
        var nodes = Array.prototype.slice.call(markdownEl.childNodes || []);
        if (!nodes.length) return;
        var frag = document.createDocumentFragment();
        var currentUl = null;
        function flushUl(){ if(currentUl){ frag.appendChild(currentUl); currentUl = null; } }
        for (var i=0;i<nodes.length;i++){
          var n = nodes[i];
          var tag = (n.tagName||'').toLowerCase();
          if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'ul'){
            flushUl();
            frag.appendChild(n);
            continue;
          }
          if (tag === 'p'){
            var text = (n.textContent||'').trim();
            if (!text){ flushUl(); frag.appendChild(n); continue; }
            var words = text.split(/\s+/).filter(Boolean).length;
            if (words <= 10){
              if (!currentUl){ currentUl = document.createElement('ul'); currentUl.className = 'compact-list'; }
              var li = document.createElement('li');
              li.innerHTML = n.innerHTML; // preserve inline formatting
              currentUl.appendChild(li);
              continue; // do not append original p
            }
          }
          flushUl();
          frag.appendChild(n);
        }
        flushUl();
        markdownEl.innerHTML = '';
        markdownEl.appendChild(frag);
      })();
      // Ensure Summary is always paragraph-only (no bullets)
      (function enforceSummaryParagraphs(){
        if (!markdownEl) return;
        function isSummaryHeading(el){
          if (!el || !el.tagName) return false;
          var t = (el.textContent||'').trim().toLowerCase();
          return t === 'summary' || t === 'professional summary' || t === 'profile summary' || t === 'experience summary';
        }
        var lists = markdownEl.querySelectorAll('ul');
        for (var i=0; i<lists.length; i++){
          var ul = lists[i];
          // Find the nearest previous heading sibling
          var prev = ul.previousElementSibling;
          while (prev && !(prev.tagName && /^(H1|H2|H3)$/.test(prev.tagName))) prev = prev.previousElementSibling;
          if (isSummaryHeading(prev)){
            // Convert list items to a single paragraph sentence
            var items = ul.querySelectorAll('li');
            var parts = [];
            for (var j=0; j<items.length; j++){
              var txt = (items[j].textContent||'').trim(); if (txt) parts.push(txt.replace(/[\s\u2022]+$/,''));
            }
            var p = document.createElement('p');
            p.textContent = parts.join(' ');
            ul.replaceWith(p);
          }
        }
      })();
      // In Certifications, ensure codes like Mb-800 are uppercased (MB-800)
      (function enforceCertificationCodeUppercase(){
        try{
          if (!markdownEl) return;
          function isHeading(node){ var t=(node&&node.tagName||'').toLowerCase(); return t==='h1'||t==='h2'||t==='h3'; }
          function isCertHeading(node){ if(!node||!node.tagName) return false; var t=(node.textContent||'').trim().toLowerCase(); return t==='certifications' || t==='certificates' || t==='certificate'; }
          var heads = markdownEl.querySelectorAll('h1,h2,h3');
          var cert = null; for (var i=0;i<heads.length;i++){ if (isCertHeading(heads[i])) { cert=heads[i]; break; } }
          if (!cert) return;
          var re = /\b([A-Za-z]{2,3})([-\s]?)(\d{2,4})\b/g;
          function walk(node){
            if (!node) return;
            if (node.nodeType === 3){ // text node
              var val = node.nodeValue || '';
              var rep = val.replace(re, function(_m, letters, sep, nums){ return letters.toUpperCase() + sep + nums; });
              if (rep !== val) node.nodeValue = rep;
              return;
            }
            var c = node.firstChild; while (c){ var next = c.nextSibling; walk(c); c = next; }
          }
          var n = cert.nextSibling; while (n && !isHeading(n)){ walk(n); n = n.nextSibling; }
        }catch(e){}
      })();
      // Reorder sections: ensure "Skills" appears immediately after "Certifications"
      (function reorderSkillsAfterCertifications(){
        try {
          if (!markdownEl) return;
          
          // Get all headings
          const headings = markdownEl.querySelectorAll('h1, h2, h3');
          let certIndex = -1;
          let skillsIndex = -1;
          
          // Find indices of Certifications and Skills sections
          for (let i = 0; i < headings.length; i++) {
            const text = (headings[i].textContent || '').trim().toLowerCase();
            if (text === 'certifications' || text === 'certificates' || text === 'certificate') certIndex = i;
            if (text === 'skills') skillsIndex = i;
          }
          
          // Only reorder if both sections exist and Skills is not already after Certifications
          if (certIndex !== -1 && skillsIndex !== -1 && skillsIndex !== certIndex + 1) {
            // Build array of all sections
          const sections = [];
          
          for (let i = 0; i < headings.length; i++) {
            const heading = headings[i];
            const section = {
              heading: heading,
              content: [],
              type: (heading.textContent || '').trim().toLowerCase()
            };
            
            // Collect all nodes until next heading
            let nextNode = heading.nextSibling;
            while (nextNode && !['H1', 'H2', 'H3'].includes(nextNode.tagName || '')) {
              section.content.push(nextNode);
              nextNode = nextNode.nextSibling;
            }
            
            sections.push(section);
          }
          
            // Remove Skills section from current position
            const skillsSection = sections.splice(skillsIndex, 1)[0];
            
            // Find new position (right after Certifications)
            const newCertIndex = sections.findIndex(s => s.type === 'certifications');
            if (newCertIndex !== -1) {
              // Insert Skills section immediately after Certifications
              sections.splice(newCertIndex + 1, 0, skillsSection);
              
              // Rebuild the DOM with reordered sections
              const fragment = document.createDocumentFragment();
              
              sections.forEach(section => {
                fragment.appendChild(section.heading);
                section.content.forEach(node => {
                  if (node.parentNode) { // Check if node is still in the document
                    fragment.appendChild(node);
                  }
                });
              });
              
              // Clear existing content and append reordered content
              while (markdownEl.firstChild) {
                markdownEl.removeChild(markdownEl.firstChild);
              }
              markdownEl.appendChild(fragment);
            }
          }
        } catch (e) {
          console.error('Error reordering Skills section:', e);
        }
      })();
      
      // Reorder sections: ensure "Functional Skills" immediately follows "Technical Skills"
      (function reorderFunctionalAfterTechnical(){
        try{
          if (!markdownEl) return;
          var children = Array.prototype.slice.call(markdownEl.childNodes || []);
          if (!children.length) return;
          // Build blocks grouped by headings (h1/h2/h3 + subsequent content)
          var blocks = [];
          var current = null;
          function startBlockFor(node){
            current = { heading: node, title: (node && node.textContent ? node.textContent.trim() : ''), nodes: [] };
            blocks.push(current);
          }
          for (var i=0;i<children.length;i++){
            var n = children[i];
            var tag = (n.tagName||'').toLowerCase();
            var isHeading = (tag === 'h1' || tag === 'h2' || tag === 'h3');
            if (isHeading){
              startBlockFor(n);
              current.nodes.push(n);
            } else {
              if (!current){
                // Content before the first heading
                startBlockFor({ tagName:'', textContent:'' });
              }
              current.nodes.push(n);
            }
          }
          // Find indices for Technical Skills and Functional Skills
          var techIdx = -1, funcIdx = -1;
          for (var j=0;j<blocks.length;j++){
            var t = String(blocks[j].title||'');
            if (techIdx === -1 && /^(technical\s+skills)$/i.test(t)) techIdx = j;
            if (funcIdx === -1 && /^(functional\s+skills)$/i.test(t)) funcIdx = j;
          }
          if (techIdx !== -1 && funcIdx !== -1 && funcIdx !== techIdx + 1){
            var funcBlock = blocks.splice(funcIdx, 1)[0];
            // Insert Functional Skills right after Technical Skills
            blocks.splice(techIdx + 1, 0, funcBlock);
            // Rebuild DOM in the new order
            var frag2 = document.createDocumentFragment();
            for (var k=0;k<blocks.length;k++){
              var bn = blocks[k].nodes;
              for (var m=0;m<bn.length;m++) frag2.appendChild(bn[m]);
            }
            markdownEl.innerHTML = '';
            markdownEl.appendChild(frag2);
          }
        }catch(e){}
      })();
      // Ensure Certifications appears immediately after Profile Summary (preferred),
      // otherwise after any other Summary variant if Profile Summary is absent
      (function reorderCertificationsAfterSummary(){
        try{
          if (!markdownEl) return;
          var children = Array.prototype.slice.call(markdownEl.childNodes || []);
          if (!children.length) return;
          // Build blocks grouped by headings
          var blocks = []; var current = null;
          function startBlockFor(node){ current = { heading: node, title: (node && node.textContent ? node.textContent.trim() : ''), nodes: [] }; blocks.push(current); }
          for (var i=0;i<children.length;i++){
            var n = children[i]; var tag=(n.tagName||'').toLowerCase(); var isHead=(tag==='h1'||tag==='h2'||tag==='h3');
            if (isHead){ startBlockFor(n); current.nodes.push(n); } else { if(!current) startBlockFor({ tagName:'', textContent:'' }); current.nodes.push(n); }
          }
          function norm(s){ return String(s||'').trim().toLowerCase(); }
          var profileIdx=-1, summaryIdx=-1, certIdx=-1;
          for (var j=0;j<blocks.length;j++){
            var t = norm(blocks[j].title||'');
            if (profileIdx===-1 && t==='profile summary') profileIdx=j;
            if (summaryIdx===-1 && (t==='summary' || t==='professional summary' || t==='experience summary')) summaryIdx=j;
            if (certIdx===-1 && (t==='certifications' || t==='certificates' || t==='certificate')) certIdx=j;
          }
          // Determine fallback: if no summary variant found, place after the first heading block (2nd heading overall)
          function isRealHeadingBlock(b){ var hn=(b&&b.heading&&b.heading.tagName)||''; return hn==='H1'||hn==='H2'||hn==='H3'; }
          var firstHeadIdx=-1; for (var x=0;x<blocks.length;x++){ if (isRealHeadingBlock(blocks[x])) { firstHeadIdx = x; break; } }
          var targetIdx = (profileIdx !== -1) ? profileIdx : (summaryIdx !== -1 ? summaryIdx : firstHeadIdx);
          if (targetIdx!==-1 && certIdx!==-1 && certIdx!==targetIdx+1){
            var certBlock = blocks.splice(certIdx,1)[0];
            var insertAt = (certIdx < targetIdx) ? targetIdx : (targetIdx + 1);
            blocks.splice(insertAt,0,certBlock);
            var frag = document.createDocumentFragment();
            for (var k=0;k<blocks.length;k++){ var bn=blocks[k].nodes; for (var m=0;m<bn.length;m++) frag.appendChild(bn[m]); }
            markdownEl.innerHTML=''; markdownEl.appendChild(frag);
          }
        }catch(e){}
      })();
      // Format Work Experience sections
      (function formatWorkExperienceHeadings(){
        try{
          if (!markdownEl) return;
          var headings = markdownEl.querySelectorAll('h1, h2, h3');
          var workHead = null;
          for (var i=0;i<headings.length;i++){
            var txt = (headings[i].textContent||'').trim();
            if (/^(work\s+experience|experience)$/i.test(txt)) { workHead = headings[i]; break; }
          }
          if (!workHead) return;
          function levelOf(tag){ return tag === 'H1' ? 1 : (tag === 'H2' ? 2 : 3); }
          var sectionLevel = levelOf(workHead.tagName||'H2');
          var subLevelMin = Math.min(3, sectionLevel + 1);
          var n = workHead.nextSibling;
          var idx = 1;
          while (n){
            if (n.tagName === 'H1' || n.tagName === 'H2' || n.tagName === 'H3'){
              var lvl = levelOf(n.tagName);
              if (lvl <= sectionLevel) break;
              if (lvl >= subLevelMin){
                var orig = (n.textContent||'').trim();
                // Format: "Work Experience 1" (bold blue text)
                n.innerHTML = '<span style="font-weight: bold; color: #3b82f6;">Work Experience ' + idx + '</span>';
                var after = n.nextSibling;
                while (after && after.nodeType === 3) after = after.nextSibling;
                var hasPosition = false;
                if (after && (after.tagName||'').toLowerCase() === 'p'){
                  var t = (after.textContent||'').trim();
                  hasPosition = /^position\s*:/i.test(t);
                }
                if (!hasPosition){
                  var p = document.createElement('p');
                  p.innerHTML = '<strong>Position:</strong> ' + escapeHtml(orig);
                  n.parentNode.insertBefore(p, n.nextSibling);
                }
                idx++;
              }
            }
            n = n.nextSibling;
          }
        }catch(e){}
      })();
      
      // Format Projects sections
      (function formatProjectsHeadings(){
        try{
          if (!markdownEl) return;
          var headings = markdownEl.querySelectorAll('h1, h2, h3');
          var projHead = null;
          for (var i=0;i<headings.length;i++){
            var txt = (headings[i].textContent||'').trim();
            if (/^projects?$/i.test(txt)) { projHead = headings[i]; break; }
          }
          if (!projHead) return;
          function levelOf(tag){ return tag === 'H1' ? 1 : (tag === 'H2' ? 2 : 3); }
          var sectionLevel = levelOf(projHead.tagName||'H2');
          var subLevelMin = Math.min(3, sectionLevel + 1);
          var n = projHead.nextSibling;
          var idx = 1;
          while (n){
            if (n.tagName === 'H1' || n.tagName === 'H2' || n.tagName === 'H3'){
              var lvl = levelOf(n.tagName);
              if (lvl <= sectionLevel) break;
              if (lvl >= subLevelMin){
                var orig = (n.textContent||'').trim();
                // Format: "Project 1" (bold golden text)
                n.innerHTML = '<span style="font-weight: bold; color: #fbbf24;">Project ' + idx + '</span>';
                var after = n.nextSibling;
                while (after && after.nodeType === 3) after = after.nextSibling;
                var hasTitle = false;
                if (after && (after.tagName||'').toLowerCase() === 'p'){
                  var t = (after.textContent||'').trim();
                  hasTitle = /^title\s*:/i.test(t);
                }
                if (!hasTitle){
                  var p = document.createElement('p');
                  // Format: "Title:" in golden color, then the project name in white
                  p.innerHTML = '<strong style="color: #fbbf24;">Title:</strong> ' + escapeHtml(orig);
                  n.parentNode.insertBefore(p, n.nextSibling);
                } else {
                  // If title already exists, make sure "Title:" is golden
                  var titleP = after;
                  if (titleP && (titleP.tagName||'').toLowerCase() === 'p'){
                    var titleText = titleP.innerHTML || titleP.textContent || '';
                    titleP.innerHTML = titleText.replace(/^(Title\s*:)/i, '<strong style="color: #fbbf24;">$1</strong>');
                  }
                }
                idx++;
              }
            }
            n = n.nextSibling;
          }
        }catch(e){}
      })();
      // Remove specific subheadings (keep content) like "Objective", "Certification", and "Skills" from top section
      (function removeUnwantedSubheadings(){
        try{
          if (!markdownEl) return;
          var heads = markdownEl.querySelectorAll('h1, h2, h3');
          var foundProfileSummary = false;
          
          for (var i = 0; i < heads.length; i++){
            var txt = (heads[i].textContent || '').trim().toLowerCase();
            
            // Mark when we find the Profile Summary section (our reference point)
            if (txt === 'profile summary') {
              foundProfileSummary = true;
              continue;
            }
            
            // Only process headings that come before the Profile Summary
            if (!foundProfileSummary) {
                // Only remove specific unwanted headings, preserve summary-related headings
                if (txt === 'objective' || txt === 'certification' || txt === 'experience summary') {
                // Remove the heading but keep its content
                var content = [];
                var next = heads[i].nextSibling;
                while (next && !['H1', 'H2', 'H3'].includes(next.tagName || '')) {
                  content.push(next);
                  next = next.nextSibling;
                }
                heads[i].replaceWith(...content);
                
                // Update the heads NodeList since we modified the DOM
                heads = markdownEl.querySelectorAll('h1, h2, h3');
                i--; // Adjust index since we removed an element
              }
            } else {
              // Once we're past the Profile Summary, we can stop checking
              break;
            }
          }
        } catch(e) {
          console.error('Error in removeUnwantedSubheadings:', e);
        }
      })();
      // Standardize Candidate Info at the top and remove any existing personal details
      (function enforceCandidateInfo(){
        try{
          if (!markdownEl) return;
          function isHeading(node){ var t=(node&&node.tagName||'').toLowerCase(); return t==='h1'||t==='h2'||t==='h3'; }
          var children = Array.prototype.slice.call(markdownEl.childNodes || []);
          
          // Skip removing summary sections - let them display normally
          // var summaryContent = [];
          // for (var i=0; i<children.length; i++) {
          //   var n = children[i];
          //   if (!n) continue;
          //   if (isHeading(n)) {
          //     var t = (n.textContent||'').trim().toLowerCase();
          //     if (t === 'summary' || t === 'professional summary') {
          //       // Found summary section, collect content until next heading
          //       i++;
          //       while (i < children.length && !isHeading(children[i])) {
          //         summaryContent.push(children[i].cloneNode(true));
          //         children[i].remove();
          //         i++;
          //       }
          //       // Remove the summary heading
          //       n.remove();
          //       break;
          //     }
          //   }
          // }
          
          // Remove any existing Candidate Info or personal detail block
          children = Array.prototype.slice.call(markdownEl.childNodes || []);
          for (var i=0;i<children.length;i++){
            var n = children[i];
            if (!n) continue;
            var tag = (n.tagName||'').toLowerCase();
            if (isHeading(n)){
              var t = (n.textContent||'').trim().toLowerCase();
              if (/^candidate\b/.test(t) || /candidate info/.test(t) || /personal\s+info|contact/i.test(t)){
                // remove heading and all nodes until next heading
                var to = n.nextSibling;
                n.remove();
                while (to && !isHeading(to)){
                  var next = to.nextSibling; to.remove(); to = next;
                }
                // restart scan from beginning
                i = -1; children = Array.prototype.slice.call(markdownEl.childNodes || []);
                continue;
              }
            } else if (tag === 'p'){
              var txt = (n.textContent||'').trim().toLowerCase();
              if (/^(name|email|phone|contact\s*no)\s*:/.test(txt)){
                n.remove(); i=-1; children = Array.prototype.slice.call(markdownEl.childNodes||[]); continue;
              }
            }
          }
          // Create the content wrapper
          var wrap = document.createElement('div');
          // Try different possible field names for candidate info
          var candidateInfo = null;
          if (data && data.json) {
            candidateInfo = data.json['Candidate Info'] || 
                           data.json['candidate_info'] || 
                           data.json['candidateInfo'] ||
                           data.json['Candidate_Info'] ||
                           null;
          }
          
          // Debug: Log the candidate info structure to help understand the data format
          console.log('Full data object:', data);
          if (data && data.json) {
            console.log('Available JSON keys:', Object.keys(data.json));
          }
          if (candidateInfo) {
            console.log('Candidate Info structure:', candidateInfo);
            console.log('Available fields:', Object.keys(candidateInfo));
            if (candidateInfo.summary) {
              console.log('Found summary field:', candidateInfo.summary);
            }
            // Check all possible summary fields
            console.log('Summary field (lowercase):', candidateInfo.summary);
            console.log('Summary field (uppercase):', candidateInfo.Summary);
            console.log('Professional Summary:', candidateInfo['Professional Summary']);
            console.log('Profile Summary:', candidateInfo['Profile Summary']);
          } else {
            console.log('No candidate info found. Available JSON keys:', data && data.json ? Object.keys(data.json) : 'No JSON data');
          }
          
          var sections = [];
          
          // Add basic info (Name, Email, Phone)
          var basicInfo = "";
          if (candidateInfo) {
            if (candidateInfo.Name) basicInfo += `<p><strong>Name:</strong> ${candidateInfo.Name}</p>`;
            if (candidateInfo.Phone) basicInfo += `<p><strong>Contact no:</strong> ${candidateInfo.Phone}</p>`;
            if (candidateInfo.Email) basicInfo += `<p><strong>Email:</strong> ${candidateInfo.Email}</p>`;
          } else {
            basicInfo = "<p><strong>Name:</strong> Not available</p>" +
                       "<p><strong>Contact no:</strong> Not available</p>" +
                       "<p><strong>Email:</strong> Not available</p>";
          }
          
          // 1. Profile Summary - Extract summary from webhook data
          var summaryText = '';
          if (candidateInfo) {
            // Check multiple possible summary field names
            var possibleSummaryFields = [
              'summary', 'Summary', 'SUMMARY',
              'professional summary', 'Professional Summary',
              'profile summary', 'Profile Summary',
              'objective', 'Objective', 'OBJECTIVE'
            ];
            
            for (var i = 0; i < possibleSummaryFields.length; i++) {
              var fieldName = possibleSummaryFields[i];
              if (candidateInfo[fieldName] && typeof candidateInfo[fieldName] === 'string' && candidateInfo[fieldName].trim()) {
                summaryText = candidateInfo[fieldName].trim();
                console.log('Found summary in field:', fieldName, 'Value:', summaryText);
                break; // Use the first found summary
              }
            }
          }
          
          // Build the Profile Summary section
          var profileHtml = basicInfo;
          if (summaryText && summaryText.trim()) {
            console.log('Displaying summary in Profile Summary:', summaryText);
            // Format the summary text with proper HTML
            var formattedSummary = summaryText
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/\n\s*\n/g, '</p><p>')
              .replace(/\n/g, '<br>');
            
            profileHtml += `<p style="margin-top: 12px; line-height: 1.6;"><strong>Summary:</strong> ${formattedSummary}</p>`;
          } else {
            console.log('No summary found in candidate info. Available fields:', candidateInfo ? Object.keys(candidateInfo) : 'No candidate info');
            // Debug: Log the entire candidateInfo object
            if (candidateInfo) {
              console.log('Full candidateInfo object:', candidateInfo);
              console.log('candidateInfo.summary:', candidateInfo.summary);
              console.log('candidateInfo.Summary:', candidateInfo.Summary);
            }
          }
          
          sections.push({
            title: 'Profile Summary',
            content: `<div style="margin-bottom: 20px;">${profileHtml}</div>`
          });
          
          // 2. Work Experience
          sections.push({
            title: 'Work Experience',
            content: '' // Will be filled from other sections
          });
          
          // 3. Projects
          sections.push({
            title: 'Projects',
            content: '' // Will be filled from other sections
          });
          
          // 4. Education
          sections.push({
            title: 'Education',
            content: '' // Will be filled from other sections
          });
          
          // 5. Skills
          sections.push({
            title: 'Skills',
            content: '' // Will be filled from other sections
          });
          
          // 6. Others
          sections.push({
            title: 'Others',
            content: '' // Will be filled from other sections
          });
          
          // Build the final HTML with all sections
          var html = '';
          sections.forEach(section => {
            if (section.content) {
              // Add section only if it has content or is a required section
              if (section.content.trim() !== '' || ['Profile Summary', 'Work Experience', 'Projects', 'Education', 'Skills', 'Others'].includes(section.title)) {
                html += `<h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 10px 0; padding-bottom: 5px; border-bottom: 1px solid #eee; text-transform: uppercase;">${section.title}</h2>`;
                html += section.content;
              }
            }
            });
           
           // Also display any additional summary headings that exist in the extracted data
           // This ensures all summary headings are visible on the output website
           if (markdownEl) {
             var allHeadings = markdownEl.querySelectorAll('h1, h2, h3');
             var displayedSections = ['Profile Summary', 'Work Experience', 'Projects', 'Education', 'Skills', 'Others'];
             
             for (var i = 0; i < allHeadings.length; i++) {
               var heading = allHeadings[i];
               var headingText = (heading.textContent || '').trim();
               var headingLower = headingText.toLowerCase();
               
               // Check if this is a summary-related heading that's not already displayed
               if ((headingLower === 'summary' || headingLower === 'professional summary' || 
                    headingLower === 'experience summary' || headingLower === 'objective') &&
                   !displayedSections.some(function(section) { 
                     return section.toLowerCase() === headingLower; 
                   })) {
                 
                 // Collect content for this heading
                 var content = '';
                 var nextNode = heading.nextSibling;
                 while (nextNode && !['H1', 'H2', 'H3'].includes(nextNode.tagName || '')) {
                   if (nextNode.nodeType === 1) { // Element node
                     content += nextNode.outerHTML;
                   } else if (nextNode.nodeType === 3) { // Text node
                     content += nextNode.textContent;
                   }
                   nextNode = nextNode.nextSibling;
                 }
                 
                 // Add this summary heading to the output
                 if (content.trim()) {
                   html += `<h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 10px 0; padding-bottom: 5px; border-bottom: 1px solid #eee; text-transform: uppercase;">${headingText}</h2>`;
                   html += content;
                 }
               }
             }
           }
            
            wrap.innerHTML = html;
          
          markdownEl.insertBefore(wrap, markdownEl.firstChild || null);
        }catch(e){}
      })();
    }catch(e){}
  }
  
  // Final Skills positioning - ensure Skills appears immediately after Certifications
  (function finalSkillsPositioning(){
    try {
      if (!markdownEl) return;
      
      const headings = markdownEl.querySelectorAll('h1, h2, h3');
      let certIndex = -1;
      let skillsIndex = -1;
      
      // Find indices of Certifications and Skills sections
      for (let i = 0; i < headings.length; i++) {
        const text = (headings[i].textContent || '').trim().toLowerCase();
        if (text === 'certifications' || text === 'certificates' || text === 'certificate') certIndex = i;
        if (text === 'skills') skillsIndex = i;
      }
      
      // Only reorder if both sections exist and Skills is not already after Certifications
      if (certIndex !== -1 && skillsIndex !== -1 && skillsIndex !== certIndex + 1) {
        // Build array of all sections
        const sections = [];
        
        for (let i = 0; i < headings.length; i++) {
          const heading = headings[i];
          const section = {
            heading: heading,
            content: [],
            type: (heading.textContent || '').trim().toLowerCase()
          };
          
          // Collect all nodes until next heading
          let nextNode = heading.nextSibling;
          while (nextNode && !['H1', 'H2', 'H3'].includes(nextNode.tagName || '')) {
            section.content.push(nextNode);
            nextNode = nextNode.nextSibling;
          }
          
          sections.push(section);
        }
        
        // Remove Skills section from current position
        const skillsSection = sections.splice(skillsIndex, 1)[0];
        
        // Find new position (right after Certifications)
        const newCertIndex = sections.findIndex(s => s.type === 'certifications' || s.type === 'certificates' || s.type === 'certificate');
        if (newCertIndex !== -1) {
          // Insert Skills section immediately after Certifications
          sections.splice(newCertIndex + 1, 0, skillsSection);
          
          // Rebuild the DOM with reordered sections
          const fragment = document.createDocumentFragment();
          
          sections.forEach(section => {
            fragment.appendChild(section.heading);
            section.content.forEach(node => {
              if (node.parentNode) { // Check if node is still in the document
                fragment.appendChild(node);
              }
            });
          });
          
          // Clear existing content and append reordered content
          while (markdownEl.firstChild) {
            markdownEl.removeChild(markdownEl.firstChild);
          }
          markdownEl.appendChild(fragment);
        }
      }
    } catch (e) {
      console.error('Error in final Skills positioning:', e);
    }
  })();
  
  // Toggle edit mode for right pane
  var editBtn = document.getElementById('editBtn');
  var effectsLayer = document.getElementById('effectsLayer');
  var isEditing = false;
  var editable = null;
  if (editBtn){
    editBtn.addEventListener('click', function(){
      // Deer runs around edit button perimeter (5s)
      try{
        var animal = document.createElement('div'); animal.className='animal';
        // Lightning icon
        animal.innerHTML = "<svg viewBox='0 0 64 64' aria-hidden='true'><path d='M36 2L10 36h16l-6 26 34-40H38l-2-20z'/></svg>";
        // Optional: dotted orbit ring for visual guidance
        var ring = document.createElement('div'); ring.className='orbit-ring'; ring.style.width=(rx*2)+'px'; ring.style.height=(ry*2)+'px'; effectsLayer.appendChild(ring);
        effectsLayer.appendChild(animal);
        var btnRect = editBtn.getBoundingClientRect();
        var cx = btnRect.left + btnRect.width/2; var cy = btnRect.top + btnRect.height/2;
        var rx = btnRect.width/2 + 24; var ry = btnRect.height/2 + 18;
        var start = null; var duration = 3000;
        function step(ts){
          if(!start) start = ts;
          var p = Math.min(1, (ts - start)/duration);
          var ang = p * Math.PI * 2;
          var x = cx + rx * Math.cos(ang);
          var y = cy + ry * Math.sin(ang);
          animal.style.left = x + 'px'; animal.style.top = y + 'px';
          animal.style.transform = 'translate(-50%,-50%) rotate(' + (ang*180/Math.PI+90) + 'deg)';
          if (p < 1) requestAnimationFrame(step); else setTimeout(function(){ try{ effectsLayer.removeChild(animal); effectsLayer.removeChild(ring); }catch(e){} }, 200);
        }
        requestAnimationFrame(step);
      }catch(e){}
      if (!isEditing){
        // Switch to editable textarea prefilled with current markdown source
        var currentMd = jsonToMarkdown(data && data.json ? data.json : null);
        currentMd = currentMd.replace(/^\s*(?:[-\*\u2022]\s+)?(#{1,3})\s*(.+)$/gm, function(_, marks, title){ return marks + ' ' + title.trim(); });
        editable = document.createElement('textarea');
        editable.style.width = '100%'; editable.style.minHeight = '300px'; editable.style.background = '#0b1220'; editable.style.color = '#e2e8f0'; editable.style.border = '1px solid #334155'; editable.style.borderRadius = '8px'; editable.style.padding = '10px'; editable.value = currentMd;
        markdownEl.replaceWith(editable);
        editBtn.textContent = 'Save';
        isEditing = true;
      } else {
        // Save back to preview
        var newMd = editable.value || '';
        var container = document.createElement('div'); container.id = 'markdown'; container.className='markdown'; container.innerHTML = mdToHtml(newMd);
        editable.replaceWith(container);
        markdownEl = container;
        editBtn.textContent = 'Edit';
        isEditing = false;
      }
    });
  }
  // DOCX download
  var downloadAllBtn = document.getElementById('downloadDocxTemplateAll');
  if (downloadAllBtn){
    downloadAllBtn.addEventListener('click', function(){
      // Full-screen blurred overlay with a large glowing download icon (center)
      try{
        var overlay = document.createElement('div'); overlay.className = 'dl-overlay';
        var backdrop = document.createElement('div'); backdrop.className = 'dl-backdrop';
        var iconWrap = document.createElement('div'); iconWrap.className = 'dl-icon';
        iconWrap.innerHTML = "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M3 17h18v2H3zM11 15V7.83L9.41 9.24 8 7.83l4-4 4 4-1.41 1.41L13 7.83V15z'/></svg>";
        overlay.appendChild(backdrop); overlay.appendChild(iconWrap); document.body.appendChild(overlay);
        setTimeout(function(){ try{ document.body.removeChild(overlay); }catch(e){} }, 1800);
      }catch(e){}
      function loadScript(src){
        return new Promise(function(resolve,reject){ var s=document.createElement('script'); s.src=src; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); });
      }
      function loadScriptTry(urls){
        var i = 0;
        return new Promise(function(resolve){
          (function next(){
            if (i >= urls.length) { resolve(); return; }
            loadScript(urls[i]).then(resolve).catch(function(){ i++; next(); });
          })();
        });
      }
      function ensureEngines(){
        var hasZip = !!window.PizZip;
        var hasTpl = !!(window.docxtemplater || window.Docxtemplater);
        if (hasZip && hasTpl) return Promise.resolve();
        // Prefer CDN first to avoid file:// 404 noise
        return loadScriptTry(['https://cdn.jsdelivr.net/npm/pizzip@3.1.7/dist/pizzip.min.js'])
          .then(function(){ return loadScriptTry(['https://cdn.jsdelivr.net/npm/docxtemplater@3.36.2/build/docxtemplater.js']); });
      }
      function ensureTemplate(){
        if (templateArrayBuffer) return Promise.resolve();
        // Require http(s) to fetch template
        var isHttp = location.protocol === 'http:' || location.protocol === 'https:';
        if (!isHttp){ return Promise.reject(new Error('Template loading requires http(s)')); }
        // Try override URLs (query or session) first; then configured paths
        function attemptIdx(i){
          var override = getOverrideTemplateUrls();
          var sources = override && override.length ? override : TEMPLATE_PATHS;
          if (i >= sources.length) return Promise.reject(new Error('no template'));
          var p = sources[i] + (sources === TEMPLATE_PATHS ? ('?v=' + Date.now()) : '');
          return fetch(p, { cache:'no-store' })
            .then(function(res){ if(!res.ok) throw new Error('missing'); return res.arrayBuffer(); })
            .then(function(buf){ templateArrayBuffer = buf; })
            .catch(function(){ return attemptIdx(i+1); });
        }
        return attemptIdx(0);
      }
      Promise.resolve()
        .then(ensureEngines)
        .then(ensureTemplate)
        .then(function(){
          var PZ = window.PizZip;
          if (!templateArrayBuffer || !PZ){ alert('Template or zip engine not available.'); return; }
          // Mirror the right-pane HTML into the template, including tables
          var nodes = markdownEl ? markdownEl.childNodes : [];
          var zip = new PZ(templateArrayBuffer);
          var docXml = '';
          try { docXml = zip.file('word/document.xml').asText(); } catch(e){ alert('Template is not a valid .docx'); return; }
          function xmlEscape(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
          function run(text, opts){
            var rPr='';
            var o = opts || {};
            if (o.bold) rPr += '<w:b/>';
            if (o.italic) rPr += '<w:i/>';
            if (o.underline) rPr += "<w:u w:val='single'/>";
            var sz = o.size; // Word expects half-points
            if (sz){ rPr += "<w:sz w:val='"+sz+"'/><w:szCs w:val='"+sz+"'/>"; }
            var color = o.color || '000000';
            if (color) rPr += "<w:color w:val='"+color+"'/>";
            var font = o.font || 'Calibri';
            if (font){ rPr += "<w:rFonts w:ascii='"+font+"' w:hAnsi='"+font+"' w:cs='"+font+"'/>"; }
            return "<w:r>" + (rPr?('<w:rPr>'+rPr+'</w:rPr>'):'') + "<w:t xml:space='preserve'>" + xmlEscape(text) + "</w:t></w:r>";
          }
          function runsFromNode(node){
            var t = (node && node.tagName||'').toLowerCase();
            if (!t){ return run(node && node.textContent || '', {}); }
            var pieces='';
            var bold = (t==='strong' || t==='b');
            var italic = (t==='em' || t==='i');
            if (bold || italic){
              var kids = node.childNodes; for (var i=0;i<kids.length;i++) pieces += run(kids[i].textContent||'', { bold:bold, italic:italic, size:24, font:'Calibri', color:'000000' });
              return pieces;
            }
            if (t==='span' || t==='p' || t==='li' || t==='th' || t==='td'){
              var ks = node.childNodes; for (var j=0;j<ks.length;j++){ pieces += runsFromNode(ks[j]); }
              return pieces;
            }
            return run(node.textContent||'', { size:24, font:'Calibri', color:'000000' });
          }
          function p(style, childrenXml, options){
            var pPr = '';
            var parts = [];
            if (style){ parts.push("<w:pStyle w:val='"+style+"'/>"); }
            var spacing = options && options.spacing;
            if (spacing){
              var before = (spacing.before!=null ? spacing.before : '');
              var after  = (spacing.after!=null  ? spacing.after  : '');
              var line   = (spacing.line!=null   ? spacing.line   : '');
              var attrs = '';
              if (before!=='') attrs += " w:before='"+before+"'";
              if (after!=='')  attrs += " w:after='"+after+"'";
              if (line!=='')   attrs += " w:line='"+line+"' w:lineRule='auto'";
              parts.push("<w:spacing"+attrs+"/>");
            }
            if (parts.length){ pPr = '<w:pPr>'+parts.join('')+'</w:pPr>'; }
            return "<w:p>"+pPr+ (childrenXml||'') + "</w:p>";
          }
          function tableXml(table){
            var rows = table.querySelectorAll('tr');
            var body = '';
            for (var r=0;r<rows.length;r++){
              var cells = rows[r].querySelectorAll('th,td');
              var rowXml='';
              for (var c=0;c<cells.length;c++){
                rowXml += "<w:tc><w:p>" + runsFromNode(cells[c]) + "</w:p></w:tc>";
              }
              body += "<w:tr>"+rowXml+"</w:tr>";
            }
            return "<w:tbl><w:tblPr><w:tblW w:w='0' w:type='auto'/></w:tblPr>"+ body +"</w:tbl>";
          }
          var inject='';
          for (var k=0;k<nodes.length;k++){
            var n = nodes[k]; var t=(n.tagName||'').toLowerCase();
            // Skip any stray standalone "0" nodes (text nodes or elements whose
            // trimmed textContent is exactly "0"). These sometimes appear at the
            // very start of the markdown DOM and end up as a leading 0 in the
            // generated download. Ignoring them removes the stray character.
            try {
              var txt = (n.textContent || '').toString().trim();
              if (txt === '0') continue;
            } catch (e) { /* ignore and continue processing node */ }
            if (t==='h1' || t==='h2' || t==='h3'){
              // Headings: 14pt, Calibri, black, bold, underline
              inject += p('', run(n.textContent||'', { size:14*2, font:'Calibri', color:'000000', bold:true, underline:true }), { spacing:{ before:480, after:240, line:240 } });
            }
            else if (t==='p') inject += p('', runsFromNode(n));
            else if (t==='ul' || t==='ol'){
              var lis = n.querySelectorAll('li');
              for (var m=0;m<lis.length;m++) inject += p('', run('• ', { size:24, font:'Calibri', color:'000000' }) + runsFromNode(lis[m]), { spacing:{ before:0, after:80, line:220 } });
            } else if (t==='table'){
              inject += tableXml(n);
            }
          }
          var newXml = docXml.replace('</w:body>', inject + '</w:body>');
          zip.file('word/document.xml', newXml);
          var blob = zip.generate({ type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Sample word.docx'; a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1500);
        })
        .catch(function(){ alert('To use "Download with Template", open this site via http(s) (e.g., http://localhost) so the template can be loaded.'); });
    });
  }
  
  // Vetting Report button - send data to remote webhook and wait for response
  
  function initVettingReportButton() {
    // This function is kept for backward compatibility but does nothing
    // The actual handler is in window.handleVettingReportClick() below
  }
  
  // Initialize vetting report button when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVettingReportButton);
  } else {
    initVettingReportButton();
  }
})();

// Global function to handle vetting report button click - DEFINED OUTSIDE IIFE
window.handleVettingReportClick = function(event) {
  event.preventDefault();
  event.stopPropagation();
  
  var jobDescriptionInput = document.getElementById('jobDescriptionInput');
  var jobDescriptionAlert = document.getElementById('jobDescriptionAlert');
  var vettingReportBtn = document.getElementById('vettingReportBtn');
  
  if (!jobDescriptionInput || !jobDescriptionAlert) {
    console.error('Required elements not found');
    return;
  }
  
  var jobDesc = jobDescriptionInput.value.trim();
  
  // Validate that job description is not empty
  if (jobDesc.length === 0) {
    console.log('❌ TEXT BOX IS EMPTY - SHOWING ALERT');
    
    // Show the popup with animation using CSS classes
    jobDescriptionAlert.classList.add('show');
    
    // Add shake animation after zoom completes
    setTimeout(function() {
      jobDescriptionAlert.classList.add('shake');
    }, 500);
    
    // Remove shake after animation
    setTimeout(function() {
      jobDescriptionAlert.classList.remove('shake');
    }, 1000);
    
    jobDescriptionInput.focus();
    jobDescriptionInput.style.borderColor = '#ff6b6b';
    jobDescriptionInput.style.boxShadow = '0 0 20px rgba(255, 107, 107, 1)';
    
    return;
  }
  
  console.log('✅ TEXT BOX HAS CONTENT - PROCEEDING');
  
  // Hide alert if showing
  jobDescriptionAlert.classList.remove('show');
  jobDescriptionAlert.classList.remove('shake');
  
  // Reset border styling
  jobDescriptionInput.style.borderColor = '#fbbf24';
  jobDescriptionInput.style.boxShadow = 'none';
  
  // Get data from the page
  setTimeout(function() {
    try {
      // Attempt to collect structured extracted data (from runtime or sessionStorage)
      var currentData = window.extractedData || null;
      var currentMeta = window.uploadedMetaData || null;

      // If we don't have structured data, try to read from sessionStorage
      if (!currentData) {
        try {
          var ss = sessionStorage.getItem('resume_extractor_result');
          if (ss) currentData = JSON.parse(ss);
        } catch (e) {
          // ignore parse errors
        }
      }

      // Also capture the rendered/right-side text so webhook gets the visible output
      var renderedEl = document.getElementById('extracted') || document.getElementById('markdown');
      var renderedText = '';
      try {
        if (renderedEl) renderedText = (renderedEl.innerText || renderedEl.textContent || '').trim();
      } catch (e) { renderedText = ''; }

      // If no structured data, at least send the rendered text as raw data
      if (!currentData && renderedText) {
        currentData = { rawText: renderedText };
      } else if (currentData && renderedText) {
        // Attach rendered text as an auxiliary field so webhook can parse it too
        try { currentData._renderedText = renderedText; } catch(e){}
      }

      // Persist job description and resume data for later pages
      sessionStorage.setItem('job_description', jobDesc);
      try { sessionStorage.setItem('resume_extractor_result', JSON.stringify(currentData || {})); } catch(e){}
      try { if (currentMeta) sessionStorage.setItem('uploadedFileMeta', JSON.stringify(currentMeta)); } catch(e){}

      var webhookBase = 'https://n8n.srv922914.hstgr.cloud/webhook/';
      var webhookName = encodeURIComponent('Vetting Report');
      var webhookUrl = webhookBase + webhookName;

      var originalText = vettingReportBtn.textContent;
      vettingReportBtn.disabled = true;
      vettingReportBtn.textContent = 'Preparing vetting report...';

      // Put the right-side resume data under a single heading string 'Resume:\n' for webhook
      var payload = {
        Resume: 'Resume:\n' + JSON.stringify(currentData, null, 2),
        meta: currentMeta,
        jobDescription: jobDesc
      };
      
      console.log('📤 SENDING TO WEBHOOK:');
      console.log('Job Description:', jobDesc);
      console.log('Resume Data:', currentData);
      console.log('Full Payload:', payload);

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(res){
        var ctype = (res.headers.get('content-type') || '').toLowerCase();
        if (ctype.indexOf('application/json') !== -1) return res.json();
        return res.text();
      })
      .then(function(webhookResult){
        try {
          sessionStorage.setItem('vetting_report_webhook_result', typeof webhookResult === 'string' ? webhookResult : JSON.stringify(webhookResult));
        } catch(e) {
          console.error('Failed to save webhook result:', e);
        }
        window.location.href = 'vetting-report.html';
      })
      .catch(function(err){
        console.error('Webhook error:', err);
        alert('Failed to contact vetting webhook. Opening vetting report locally instead.');
        vettingReportBtn.disabled = false;
        vettingReportBtn.textContent = originalText;
        window.location.href = 'vetting-report.html';
      });

    } catch (e) {
      console.error('Exception:', e);
      alert('Error preparing vetting report. Please try again.');
      vettingReportBtn.disabled = false;
      vettingReportBtn.textContent = originalText;
    }
  }, 0);
};

// Setup close button for the alert
window.setupAlertButton = function() {
  var closeBtn = document.getElementById('jobDescriptionAlertClose');
  var jobDescriptionAlert = document.getElementById('jobDescriptionAlert');
  var jobDescriptionInput = document.getElementById('jobDescriptionInput');
  
  if (!closeBtn) return;
  
  closeBtn.addEventListener('click', function() {
    console.log('Alert close button clicked');
    jobDescriptionAlert.classList.remove('show');
    jobDescriptionAlert.classList.remove('shake');
    if (jobDescriptionInput) {
      jobDescriptionInput.focus();
    }
  });
};

// Initialize alert button
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.setupAlertButton);
} else {
  window.setupAlertButton();
}