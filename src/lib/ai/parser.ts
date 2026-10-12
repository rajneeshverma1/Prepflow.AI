import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { ResumeData, WorkExperience, Education, Project, SkillCategory, CustomSection } from '../types/resume';
import { resumeDataSchema } from '../schema/resume';

const PARSE_RESUME_SYSTEM_PROMPT = `You are PromptCV AI — an expert resume parser.
Extract all details from the uploaded resume document into a structured JSON object matching this exact schema:

{
  "personal": {
    "fullName": "Candidate Full Name",
    "jobTitle": "Target or Current Role (e.g. Software Engineer)",
    "email": "candidate@example.com",
    "phone": "+1 234 567 890",
    "location": "City, Country",
    "github": "https://github.com/...",
    "linkedin": "https://linkedin.com/in/...",
    "website": "https://..."
  },
  "summary": "Professional summary or bio if present",
  "education": [
    {
      "institution": "University / College",
      "degree": "Degree (e.g. B.Tech Computer Science)",
      "startDate": "Start Date",
      "endDate": "End Date",
      "gpa": "CGPA or GPA"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "startDate": "Start Date",
      "endDate": "End Date or Present",
      "highlights": ["bullet 1", "bullet 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Short description",
      "highlights": ["bullet 1", "bullet 2"],
      "techStack": ["React", "Node.js"]
    }
  ],
  "skills": [
    {
      "category": "Languages",
      "items": ["Java", "SQL"]
    }
  ],
  "template": "classic"
}

CRITICAL RULES:
1. Return ONLY the JSON object. Do not include markdown or explanations.
2. Extract the candidate's real name accurately into "personal.fullName".
3. Extract education, projects, work experience, and skills from the actual document.
4. Do not return empty placeholder names like "Applicant Name".
`;

export async function parseResumeContent(
  input: string | { buffer: Buffer; mimeType: string; fileName?: string },
  fileNameParam?: string
): Promise<ResumeData> {
  const geminiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const isMultimodal = typeof input === 'object' && !!input.buffer;
  const buffer = isMultimodal ? (input as any).buffer : null;
  const mimeType = isMultimodal ? (input as any).mimeType : 'application/pdf';
  const rawText = typeof input === 'string' ? input : '';
  const fileName = typeof input === 'object' ? (input as any).fileName : fileNameParam;

  // 1. Try Gemini API (multimodal PDF & text)
  if (geminiKey) {
    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest',
    ];
    for (const model of candidateModels) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const contents: any[] = [PARSE_RESUME_SYSTEM_PROMPT];

        if (isMultimodal && buffer) {
          contents.push({
            inlineData: {
              data: buffer.toString('base64'),
              mimeType: mimeType || 'application/pdf',
            },
          });
          contents.push('Extract all sections and data from this uploaded resume document into the required ResumeData JSON schema.');
        } else {
          contents.push(`Uploaded Resume Content:\n${rawText}`);
        }

        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawJson = JSON.parse(cleanJsonString(response.text || ''));
        const normalized = normalizeParsedResume(rawJson, fileName);
        const validated = resumeDataSchema.parse(normalized);
        return validated as ResumeData;
      } catch (err: any) {
        console.warn(`Gemini (${model}) resume parsing failed:`, err?.message || err);
      }
    }
  }

  // 2. Try OpenAI API if key is present
  if (openaiKey && rawText) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PARSE_RESUME_SYSTEM_PROMPT },
          { role: 'user', content: `Uploaded Resume Content:\n${rawText}` },
        ],
      });

      const parsed = JSON.parse(cleanJsonString(response.choices[0]?.message?.content || ''));
      const normalized = normalizeParsedResume(parsed, fileName);
      const validated = resumeDataSchema.parse(normalized);
      return validated as ResumeData;
    } catch (err: any) {
      console.warn('OpenAI resume parsing failed, using smart fallback parser:', err?.message);
    }
  }

  // 3. Robust Local Resume Parser (Zero-hallucination, extracts actual content)
  return fallbackSmartTextParser(rawText, fileName);
}

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }
  return cleaned;
}

function normalizeParsedResume(raw: any, fileName?: string): any {
  if (!raw || typeof raw !== 'object') return raw;

  // 1. Normalize personal info
  const p = raw.personal || {};
  const personal = {
    fullName: p.fullName || p.name || p.candidate_name || raw.fullName || raw.candidate_name || raw.name || (fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Applicant Name'),
    jobTitle: p.jobTitle || p.role || p.title || raw.jobTitle || 'Software Engineer',
    email: p.email || raw.email || '',
    phone: p.phone || raw.phone || '',
    location: p.location || raw.location || '',
    github: p.github || raw.github || undefined,
    linkedin: p.linkedin || raw.linkedin || undefined,
    website: p.website || p.portfolio || raw.website || undefined,
  };

  // 2. Normalize education
  const education = (Array.isArray(raw.education) ? raw.education : []).map((e: any, idx: number) => ({
    id: e.id || `edu-${idx + 1}`,
    institution: e.institution || e.university || e.school || 'University',
    degree: e.degree || 'Degree',
    fieldOfStudy: e.fieldOfStudy || undefined,
    location: e.location || undefined,
    startDate: e.startDate || '',
    endDate: e.endDate || '',
    gpa: e.gpa || e.score || undefined,
    highlights: Array.isArray(e.highlights) ? e.highlights : [],
  }));

  // 3. Normalize experience
  const experience = (Array.isArray(raw.experience) ? raw.experience : []).map((exp: any, idx: number) => ({
    id: exp.id || `exp-${idx + 1}`,
    company: exp.company || exp.organization || 'Company',
    position: exp.position || exp.role || exp.title || 'Role',
    location: exp.location || undefined,
    startDate: exp.startDate || '',
    endDate: exp.endDate || '',
    current: exp.current || exp.endDate?.toLowerCase()?.includes('present') || false,
    highlights: Array.isArray(exp.highlights) ? exp.highlights : (exp.description ? [exp.description] : []),
  }));

  // 4. Normalize projects
  const projects = (Array.isArray(raw.projects) ? raw.projects : []).map((proj: any, idx: number) => ({
    id: proj.id || `proj-${idx + 1}`,
    name: proj.name || proj.title || 'Project',
    description: proj.description || '',
    highlights: Array.isArray(proj.highlights) ? proj.highlights : [],
    techStack: Array.isArray(proj.techStack) ? proj.techStack : (Array.isArray(proj.skills) ? proj.skills : []),
  }));

  // 5. Normalize skills
  let skills = raw.skills;
  if (Array.isArray(skills)) {
    if (skills.length > 0 && typeof skills[0] === 'string') {
      skills = [{ id: 'sk-1', category: 'Technical Skills', items: skills }];
    } else {
      skills = skills.map((s: any, idx: number) => ({
        id: s.id || `sk-${idx + 1}`,
        category: s.category || s.name || 'Skills',
        items: Array.isArray(s.items) ? s.items : (typeof s.items === 'string' ? s.items.split(',').map((x: string) => x.trim()) : []),
      }));
    }
  } else {
    skills = [];
  }

  return {
    personal,
    summary: raw.summary || '',
    education,
    experience,
    projects,
    skills,
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    template: raw.template || 'classic',
  };
}

const SECTION_HEADERS: Record<string, string[]> = {
  summary: ['summary', 'professional summary', 'executive summary', 'profile', 'about me', 'objective', 'overview'],
  experience: ['experience', 'work experience', 'professional experience', 'employment history', 'work history', 'employment', 'internships'],
  education: ['education', 'academic background', 'academic history', 'academics', 'education & credentials', 'qualifications'],
  projects: ['projects', 'key projects', 'selected projects', 'personal projects', 'technical projects', 'academic projects'],
  skills: ['skills', 'technical skills', 'skills & tools', 'core competencies', 'technologies', 'technical expertise', 'skills & technologies', 'tools & technologies'],
  certifications: ['certifications', 'certificates', 'licenses & certifications', 'accreditations', 'credentials', 'licenses'],
  custom: ['co-curricular activities', 'co-curricular', 'extracurricular', 'extracurricular activities', 'activities', 'achievements', 'awards', 'honors', 'publications', 'research', 'leadership', 'volunteer', 'volunteer experience'],
};

const KNOWN_SKILL_CATEGORIES = [
  'Languages & Core', 'Programming Languages', 'Languages',
  'Frameworks & Libraries', 'Frameworks', 'Libraries',
  'Databases & Storage', 'Databases',
  'DevOps & Cloud', 'DevOps', 'Cloud & DevOps', 'Cloud',
  'AI & Tools', 'AI & Machine Learning', 'AI Workflows', 'AI',
  'Tools & Technologies', 'Tools', 'Technologies',
  'Platforms', 'Infrastructure', 'Core Competencies',
  'Web Technologies', 'Frontend', 'Backend'
];
KNOWN_SKILL_CATEGORIES.sort((a, b) => b.length - a.length);

const DATE_RANGE_REGEX = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\.?\s*)?\b(20\d{2}|19\d{2})\b\s*[-–—to]+\s*(Present|Current|Ongoing|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\.?\s*(?:20\d{2}|19\d{2})\b|\b(?:20\d{2}|19\d{2})\b)/i;

function isSectionHeading(line: string): { isHeading: boolean; sectionKey?: string; headingTitle?: string } {
  const clean = line.replace(/^[#*•\-_=~]+\s*/, '').replace(/[:\-_=~]+$/, '').trim().toLowerCase();
  if (clean.length > 50 || clean.length < 3) return { isHeading: false };

  for (const [key, keywords] of Object.entries(SECTION_HEADERS)) {
    if (keywords.includes(clean)) {
      return { isHeading: true, sectionKey: key, headingTitle: line.trim() };
    }
  }

  // Check uppercase headings like "WORK EXPERIENCE" or "TECHNICAL SKILLS"
  if (line === line.toUpperCase() && line.length >= 4 && line.length <= 40 && !line.includes('@') && !line.match(/\d{4}/)) {
    for (const [key, keywords] of Object.entries(SECTION_HEADERS)) {
      if (keywords.some((kw) => clean.includes(kw))) {
        return { isHeading: true, sectionKey: key, headingTitle: line.trim() };
      }
    }
  }

  return { isHeading: false };
}

function groupLinesIntoBullets(lines: string[]): string[] {
  const bullets: string[] = [];
  for (const line of lines) {
    const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('▪') || /^\d+\./.test(line);
    const clean = line.replace(/^[•\-*▪]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    if (!clean) continue;

    if (isBullet || bullets.length === 0) {
      bullets.push(clean);
    } else {
      // Append continuation line to previous bullet
      bullets[bullets.length - 1] += ` ${clean}`;
    }
  }
  return bullets;
}

export function fallbackSmartTextParser(rawText: string, fileName?: string): ResumeData {
  const cleanedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/%PDF-[\d.]+/g, '')
    .replace(/\d+\s+\d+\s+obj\s*<<[\s\S]*?>>\s*endobj/gi, '')
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .trim();

  const rawLines = cleanedText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Contact Info Extraction
  const emailMatch = cleanedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  const phoneMatch = cleanedText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,5}[\s.-]?\d{4,5}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  const githubMatch = cleanedText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  const github = githubMatch ? `https://github.com/${githubMatch[1]}` : undefined;

  const linkedinMatch = cleanedText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  const linkedin = linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : undefined;

  // Website search limited to header (first 10 lines) to avoid matching internal company domains
  let website: string | undefined;
  const topText = rawLines.slice(0, 10).join(' ');
  const webMatches = topText.matchAll(/(?:https?:\/\/)?([a-zA-Z0-9_-]+\.(?:xyz|dev|io|me|ai|app|org|com|net))(?:\/[^\s]*)?/gi);
  for (const m of webMatches) {
    const candidate = m[0];
    const host = m[1].toLowerCase();
    if (host.includes('github.com') || host.includes('linkedin.com')) continue;
    if (email && host.includes(email.split('@')[1]?.toLowerCase())) continue;
    if (['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'].includes(host)) continue;
    website = candidate.startsWith('http') ? candidate : `https://${candidate}`;
    break;
  }

  // 2. Candidate Name, Location, and Title Detection from top lines
  let fullName = '';
  let jobTitle = '';
  let location = '';

  const topLines = rawLines.slice(0, 10);
  for (let i = 0; i < topLines.length; i++) {
    const line = topLines[i];
    if (isSectionHeading(line).isHeading) break;

    const isContactLine = line.includes('@') || (phone && line.includes(phone)) || line.includes('github.com');
    if (!fullName && !isContactLine && line.length >= 2 && line.length <= 45 && !line.includes('|')) {
      if (/^[a-zA-Z\s.'-]+$/.test(line) && line.split(/\s+/).length <= 5) {
        fullName = line;
        continue;
      }
    }

    if (isContactLine && !location) {
      // Find location part separated by · or | or •
      const parts = line.split(/[·|•]/).map((s) => s.trim());
      for (const p of parts) {
        if (!p.includes('@') && !(phone && p.includes(phone)) && !p.includes('github') && !p.includes('linkedin') && !p.includes('http')) {
          if (p.length >= 3 && p.length <= 45 && (p.includes(',') || /^[A-Z][a-z]+/.test(p))) {
            location = p;
            break;
          }
        }
      }
    }

    if (fullName && !jobTitle && !isContactLine && line.length <= 55 && !line.includes('•') && !line.includes('@')) {
      if (!line.includes(',') && !line.match(/\d/)) {
        jobTitle = line;
      }
    }
  }

  if (!fullName) {
    if (fileName) {
      fullName = fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\bresume\b/gi, '')
        .replace(/\bcv\b/gi, '')
        .trim();
    }
    if (!fullName) fullName = 'Resume Candidate';
  }

  // 3. Section Segmentation
  const sections: Record<string, string[]> = {
    summary: [],
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
  };

  const customSectionsList: CustomSection[] = [];
  let currentSectionKey = 'header';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const heading = isSectionHeading(line);

    if (heading.isHeading && heading.sectionKey) {
      const key = heading.sectionKey;
      if (['summary', 'experience', 'education', 'projects', 'skills', 'certifications'].includes(key)) {
        currentSectionKey = key;
      } else {
        currentSectionKey = 'custom';
        customSectionsList.push({
          id: `custom-${customSectionsList.length + 1}`,
          title: heading.headingTitle || 'ADDITIONAL ACTIVITIES',
          items: [],
        });
      }
      continue;
    }

    if (currentSectionKey !== 'header') {
      if (currentSectionKey === 'custom' && customSectionsList.length > 0) {
        customSectionsList[customSectionsList.length - 1].items.push(line);
      } else if (sections[currentSectionKey]) {
        sections[currentSectionKey].push(line);
      }
    }
  }

  // 4. Parse Summary & fallback job title
  const summary = sections.summary.join(' ').trim();
  if (!jobTitle && summary) {
    const titleMatch = summary.match(/^(?:A\s+)?([A-Za-z\s&/-]{3,35})\s+(?:with|experienced|specializing|working|building|focused)/i);
    if (titleMatch) jobTitle = titleMatch[1].trim();
  }
  if (!jobTitle) jobTitle = 'Software Engineer';

  // 5. Parse Work Experience
  const experience: WorkExperience[] = [];
  const expLines = sections.experience;
  let curExp: {
    id: string;
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate: string;
    current: boolean;
    rawHighlights: string[];
  } | null = null;

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i];
    const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('▪');
    const curDate = line.match(DATE_RANGE_REGEX);
    const nextDate = !isBullet && expLines[i + 1] && !expLines[i + 1].startsWith('•') ? expLines[i + 1].match(DATE_RANGE_REGEX) : null;

    if (!isBullet && (curDate || nextDate)) {
      if (curExp) {
        experience.push({
          id: curExp.id,
          company: curExp.company,
          position: curExp.position,
          location: curExp.location,
          startDate: curExp.startDate,
          endDate: curExp.endDate,
          current: curExp.current,
          highlights: groupLinesIntoBullets(curExp.rawHighlights),
        });
      }

      let company = '';
      let position = '';
      let loc = '';
      let startDate = '';
      let endDate = 'Present';

      if (nextDate) {
        // Pattern A: Line i is Company [Location], Line i+1 is Position + Date
        const compLine = line;
        const posLine = expLines[i + 1];
        i++; // consume next line

        startDate = nextDate[1]?.trim() || '';
        endDate = nextDate[2]?.trim() || 'Present';

        const locRegex = /\((?:Remote|[^)]+)\)|\b(?:Remote|Chicago,\s*Illinois|San Francisco,\s*CA|Lucknow,\s*India|Mumbai,\s*India|United States|India)\b/gi;
        const compLoc = compLine.match(locRegex);
        const posLoc = posLine.match(locRegex);
        loc = (posLoc ? posLoc.join(', ') : compLoc ? compLoc.join(', ') : '').replace(/^\(|\)$/g, '').trim();

        company = compLine.replace(locRegex, '').replace(/[–\-|,\s]+$/, '').trim();
        const cleanPos = posLine.replace(nextDate[0], '').replace(locRegex, '').replace(/^[–\-|,\s]+|[–\-|,\s]+$/g, '').trim();
        position = cleanPos || jobTitle || 'Software Engineer';
      } else if (curDate) {
        // Pattern B: Line i has Date
        startDate = curDate[1]?.trim() || '';
        endDate = curDate[2]?.trim() || 'Present';
        const lineNoDate = line.replace(curDate[0], '').trim();
        const parts = lineNoDate.split(/[|•·,–-]/).map((s) => s.trim()).filter(Boolean);
        const nextLine = expLines[i + 1] && !expLines[i + 1].startsWith('•') && !expLines[i + 1].startsWith('-') ? expLines[i + 1] : '';

        if (parts.length >= 2) {
          position = parts[0];
          company = parts[1];
        } else if (parts.length === 1 && nextLine) {
          position = parts[0];
          company = nextLine;
          i++;
        } else {
          position = parts[0] || jobTitle;
          company = nextLine || 'Company';
          if (nextLine) i++;
        }
      }

      curExp = {
        id: `exp-${experience.length + 1}`,
        company: company || 'Company',
        position: position || 'Software Engineer',
        location: loc || undefined,
        startDate,
        endDate,
        current: /present|current|ongoing/i.test(endDate),
        rawHighlights: [],
      };
    } else if (curExp) {
      curExp.rawHighlights.push(line);
    }
  }

  if (curExp) {
    experience.push({
      id: curExp.id,
      company: curExp.company,
      position: curExp.position,
      location: curExp.location,
      startDate: curExp.startDate,
      endDate: curExp.endDate,
      current: curExp.current,
      highlights: groupLinesIntoBullets(curExp.rawHighlights),
    });
  }

  // 6. Parse Education
  const education: Education[] = [];
  const eduLines = sections.education;
  for (let i = 0; i < eduLines.length; i++) {
    const line = eduLines[i];
    const prev = eduLines[i - 1] || '';
    const next = eduLines[i + 1] || '';
    const isInst = /university|college|school|institute|srmu|academy|polytechnic/i.test(line);

    if (isInst) {
      const combined = `${prev} ${line} ${next}`;
      const dateMatch = combined.match(DATE_RANGE_REGEX) || combined.match(/\b(20\d{2})\b/);
      const degreeRegex = /(B\.?Tech[^\n,]*|Bachelor[^\n,]*|Master[^\n,]*|B\.?S\.?[^\n,]*|M\.?S\.?[^\n,]*|Ph\.?D\.?[^\n,]*|Associate[^\n,]*|Diploma[^\n,]*)/i;
      const degMatch = prev.match(degreeRegex) || line.match(degreeRegex) || next.match(degreeRegex);
      const degree = degMatch ? degMatch[0].replace(DATE_RANGE_REGEX, '').trim() : 'Degree';
      const gpaMatch = combined.match(/(?:GPA|CGPA|Percentage)[\s:]*([0-9.]+(?:\s*\/\s*[0-9.]+)?%?)/i);

      education.push({
        id: `edu-${education.length + 1}`,
        institution: line.replace(/\b(Remote|\d{4})\b/gi, '').replace(/[–\-]\s*$/, '').trim(),
        degree,
        startDate: dateMatch ? (dateMatch[1] || dateMatch[0]) : '',
        endDate: dateMatch ? (dateMatch[2] || dateMatch[1] || 'Present') : '',
        gpa: gpaMatch ? gpaMatch[1] : undefined,
      });
    }
  }

  // 7. Parse Projects
  const projects: Project[] = [];
  const projLines = sections.projects;
  let curProj: {
    id: string;
    name: string;
    description: string;
    techStack: string[];
    rawHighlights: string[];
  } | null = null;

  for (let i = 0; i < projLines.length; i++) {
    const line = projLines[i];
    const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('▪');
    const isTitle = !isBullet && (
      line.includes('–') || line.includes(' - ') || line.includes('|') ||
      /\b(Live|GitHub|Demo|App)\b/i.test(line) ||
      (projLines[i + 1] && (projLines[i + 1].startsWith('•') || projLines[i + 1].startsWith('-')))
    ) && !line.endsWith('.') && !/^[a-z]/.test(line);

    if (isTitle) {
      if (curProj) {
        projects.push({
          id: curProj.id,
          name: curProj.name,
          description: curProj.description,
          techStack: curProj.techStack,
          highlights: groupLinesIntoBullets(curProj.rawHighlights),
        });
      }
      const cleanLine = line.replace(/\bLive\b/gi, '').trim();
      const parts = cleanLine.split(/[–\-|]/).map((s) => s.trim()).filter(Boolean);
      curProj = {
        id: `proj-${projects.length + 1}`,
        name: parts[0] || cleanLine,
        description: parts.slice(1).join(' – ') || '',
        techStack: [],
        rawHighlights: [],
      };
    } else if (curProj) {
      curProj.rawHighlights.push(line);
    }
  }

  if (curProj) {
    projects.push({
      id: curProj.id,
      name: curProj.name,
      description: curProj.description,
      techStack: curProj.techStack,
      highlights: groupLinesIntoBullets(curProj.rawHighlights),
    });
  }

  // 8. Parse Skills
  const skills: SkillCategory[] = [];
  const fullSkillText = sections.skills.join(' ');
  const catRegex = new RegExp('\\b(' + KNOWN_SKILL_CATEGORIES.map((c) => c.replace(/&/g, '\\&')).join('|') + ')\\s*:', 'gi');
  const catMatches = [...fullSkillText.matchAll(catRegex)];

  if (catMatches.length > 0) {
    for (let i = 0; i < catMatches.length; i++) {
      const match = catMatches[i];
      const catName = match[1].trim();
      const startIdx = match.index + match[0].length;
      const endIdx = catMatches[i + 1] ? catMatches[i + 1].index : fullSkillText.length;
      const itemsStr = fullSkillText.substring(startIdx, endIdx).trim();
      const items = itemsStr.split(/[,·•|]/).map((s) => s.trim()).filter(Boolean);
      skills.push({
        id: `sk-${skills.length + 1}`,
        category: catName,
        items,
      });
    }
  } else {
    for (const line of sections.skills) {
      if (line.includes(':')) {
        const [category, itemsStr] = line.split(':');
        const cleanCat = category.replace(/^[•\-*▪]\s*/, '').trim();
        const items = itemsStr.split(/[,/|•]/).map((s) => s.trim()).filter(Boolean);
        if (items.length > 0) {
          skills.push({
            id: `sk-${skills.length + 1}`,
            category: cleanCat,
            items,
          });
        }
      }
    }
  }

  // 9. Parse Certifications
  const certifications = sections.certifications
    .map((line, idx) => {
      const clean = line.replace(/^[•\-*▪]\s*/, '').trim();
      if (!clean) return null;
      const dateMatch = clean.match(/\b(20\d{2})\b/);
      return {
        id: `cert-${idx + 1}`,
        name: clean.replace(/\(\d{4}\)/g, '').trim(),
        issuer: '',
        date: dateMatch ? dateMatch[1] : '',
      };
    })
    .filter(Boolean) as any[];

  // 10. Custom Sections (e.g. Co-Curricular Activities, Leadership)
  const customSections = customSectionsList.map((cs) => ({
    ...cs,
    items: groupLinesIntoBullets(cs.items),
  }));

  return {
    personal: {
      fullName,
      jobTitle,
      email,
      phone,
      location,
      github,
      linkedin,
      website,
    },
    summary,
    experience,
    education,
    projects,
    skills,
    certifications,
    customSections: customSections.length > 0 ? customSections : undefined,
    template: 'classic',
  };
}
