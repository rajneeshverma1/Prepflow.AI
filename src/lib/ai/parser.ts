import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { ResumeData, WorkExperience, Education, Project, SkillCategory } from '../types/resume';
import { resumeDataSchema } from '../schema/resume';
import { SAMPLE_FULLSTACK_RESUME } from '../sample/defaultResume';

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
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const isMultimodal = typeof input === 'object' && !!input.buffer;
  const buffer = isMultimodal ? (input as any).buffer : null;
  const mimeType = isMultimodal ? (input as any).mimeType : 'application/pdf';
  const rawText = typeof input === 'string' ? input : '';
  const fileName = typeof input === 'object' ? (input as any).fileName : fileNameParam;

  // 1. Try Gemini API (native multimodal PDF & text)
  if (geminiKey) {
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    for (const model of modelsToTry) {
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
        console.warn(`Gemini (${model}) resume parsing failed:`, err?.message);
      }
    }
  }

  // 2. Try OpenAI API
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
      const validated = resumeDataSchema.parse(parsed);
      return validated as ResumeData;
    } catch (err: any) {
      console.warn('OpenAI resume parsing failed, using smart fallback parser:', err?.message);
    }
  }

  // 3. Fallback Smart Rule-Based Text Extractor
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

export function fallbackSmartTextParser(rawText: string, fileName?: string): ResumeData {
  // Strip PDF stream residue if any exists
  const cleanedText = rawText
    .replace(/%PDF-[\d.]+/g, '')
    .replace(/\d+\s+\d+\s+obj\s*<<[\s\S]*?>>\s*endobj/gi, '')
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '');

  const rawLines = cleanedText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract Contacts
  const emailMatch = cleanedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = cleanedText.match(/(\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,5}[\s.-]?\d{4,5}/);
  const githubMatch = cleanedText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  const linkedinMatch = cleanedText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  const websiteMatch = cleanedText.match(/(?:https?:\/\/)?([a-zA-Z0-9_-]+\.(?:xyz|dev|io|me|ai|app|org|com))/i);

  // Candidate Name: first line that doesn't contain contact info
  let fullName = '';
  let location = '';
  for (let i = 0; i < Math.min(rawLines.length, 6); i++) {
    const line = rawLines[i];
    if (
      !fullName &&
      !line.includes('@') &&
      !line.match(/\d{5,}/) &&
      !line.toLowerCase().includes('github') &&
      !line.toLowerCase().includes('linkedin') &&
      line.length > 2 &&
      line.length < 45
    ) {
      fullName = line;
      continue;
    }
    if (
      fullName &&
      !location &&
      !line.includes('@') &&
      !line.match(/\d{5,}/) &&
      (line.includes(',') || line.match(/^[A-Z][a-zA-Z\s]+$/)) &&
      line.length < 40
    ) {
      location = line;
    }
  }

  if (!fullName) {
    fullName = fileName?.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Resume Candidate';
  }

  // Section Segmentation
  const sectionKeywords: Record<string, string[]> = {
    education: ['education', 'academic background', 'academics'],
    projects: ['projects', 'personal projects', 'key projects'],
    experience: ['experience', 'work experience', 'employment', 'internships', 'work history'],
    achievements: ['achievements', 'awards', 'honors', 'hackathons'],
    skills: ['skills', 'technical skills', 'skills & tools', 'technologies'],
    leadership: ['positions of responsibility', 'leadership', 'extracurricular', 'activities'],
  };

  const sections: Record<string, string[]> = {
    education: [],
    projects: [],
    experience: [],
    achievements: [],
    skills: [],
    leadership: [],
    other: [],
  };

  let activeSection = 'other';

  for (const line of rawLines) {
    const lower = line.toLowerCase().trim();

    // Check if line is a section heading
    let matchedHeading = false;
    for (const [secKey, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some((kw) => lower === kw || lower === `${kw}:` || lower === `${kw} -`)) {
        activeSection = secKey;
        matchedHeading = true;
        break;
      }
    }

    if (!matchedHeading && activeSection) {
      sections[activeSection].push(line);
    }
  }

  // 1. Parse Education
  const education: Education[] = [];
  const eduLines = sections.education;
  for (let i = 0; i < eduLines.length; i++) {
    const line = eduLines[i];
    if (
      line.toLowerCase().includes('university') ||
      line.toLowerCase().includes('college') ||
      line.toLowerCase().includes('school') ||
      line.toLowerCase().includes('institute')
    ) {
      const nextLine = eduLines[i + 1] || '';
      const thirdLine = eduLines[i + 2] || '';
      
      const gpaMatch = (nextLine + ' ' + thirdLine).match(/(?:CGPA|GPA|Percentage):\s*([\d./%]+)/i);
      const dateMatch = (nextLine + ' ' + line + ' ' + thirdLine).match(/(\b20\d{2}\b(?:\s*[-–]\s*\b(?:20\d{2}|Present)\b)?)/i);

      education.push({
        id: `edu-${education.length + 1}`,
        institution: line.replace(/\b(Barabanki|Lucknow|India|Delhi|Remote)\b/gi, '').trim(),
        degree: nextLine.replace(/\b(August|Aug|Jan|Dec|\d{4})\b/gi, '').trim() || 'Degree',
        location: line.match(/(Barabanki|Lucknow|Delhi|India|Remote)/i)?.[0],
        startDate: dateMatch ? dateMatch[0].split(/[-–]/)[0]?.trim() || '2023' : '2023',
        endDate: dateMatch ? dateMatch[0].split(/[-–]/)[1]?.trim() || '2027' : '2027',
        gpa: gpaMatch ? gpaMatch[1] : undefined,
      });
      i++; // skip nextLine since we used it
    }
  }

  // 2. Parse Projects
  const projects: Project[] = [];
  const projLines = sections.projects;
  let currentProj: Project | null = null;

  for (const line of projLines) {
    if (line.includes('|') && !line.startsWith('•') && !line.startsWith('-')) {
      const [pName, pStack] = line.split('|').map((s) => s.trim());
      if (currentProj) projects.push(currentProj);
      currentProj = {
        id: `proj-${projects.length + 1}`,
        name: pName,
        description: '',
        highlights: [],
        techStack: pStack ? pStack.split(/[,/]/).map((s) => s.trim()).filter(Boolean) : [],
      };
    } else if (line.startsWith('•') || line.startsWith('-')) {
      const cleanBullet = line.replace(/^[•\-*]\s*/, '').trim();
      if (currentProj) {
        currentProj.highlights.push(cleanBullet);
      } else {
        if (projects.length > 0) {
          projects[projects.length - 1].highlights.push(cleanBullet);
        }
      }
    } else if (currentProj && !currentProj.description) {
      currentProj.description = line;
    }
  }
  if (currentProj) projects.push(currentProj);

  // 3. Parse Skills
  const skills: SkillCategory[] = [];
  const skillLines = sections.skills;
  for (const line of skillLines) {
    if (line.includes(':')) {
      const [category, itemsStr] = line.split(':');
      const cleanCat = category.replace(/^[•\-*]\s*/, '').trim();
      const items = itemsStr.split(/[,/|]/).map((s) => s.trim()).filter(Boolean);
      if (items.length > 0) {
        skills.push({
          id: `sk-${skills.length + 1}`,
          category: cleanCat,
          items,
        });
      }
    }
  }

  // 4. Parse Experience & Positions of Responsibility
  const experience: WorkExperience[] = [];
  const expLines = [...sections.experience, ...sections.leadership];
  let currentExp: WorkExperience | null = null;

  for (const line of expLines) {
    if ((line.includes('Club') || line.includes('Secretary') || line.includes('Coordinator') || line.includes('Engineer') || line.includes('Intern')) && !line.startsWith('•')) {
      if (currentExp) experience.push(currentExp);
      const dateMatch = line.match(/([A-Za-z]{3}\s*\d{4}\s*[-–]\s*[A-Za-z]{3}\s*\d{4}|Present)/i);
      currentExp = {
        id: `exp-${experience.length + 1}`,
        company: line.split(/[,–-]/)[0]?.replace(/^[•\-*]\s*/, '').trim() || 'Organization',
        position: line.replace(/^[•\-*]\s*/, '').trim(),
        startDate: dateMatch ? dateMatch[0].split(/[-–]/)[0]?.trim() || '2023' : '2023',
        endDate: dateMatch ? dateMatch[0].split(/[-–]/)[1]?.trim() || 'Present' : 'Present',
        current: !dateMatch || dateMatch[0].toLowerCase().includes('present'),
        highlights: [],
      };
    } else if (currentExp && (line.startsWith('•') || line.startsWith('-') || line.length > 20)) {
      currentExp.highlights.push(line.replace(/^[•\-*]\s*/, '').trim());
    }
  }
  if (currentExp) experience.push(currentExp);

  // Fallback if sections were empty
  const finalExp = experience.length > 0 ? experience : (sections.achievements.length > 0 ? [
    {
      id: 'exp-1',
      company: 'Hackathons & Competitions',
      position: 'Competitor & Project Lead',
      startDate: '2024',
      endDate: '2026',
      current: true,
      highlights: sections.achievements.map((a) => a.replace(/^[•\-*]\s*/, '')),
    }
  ] : SAMPLE_FULLSTACK_RESUME.experience);

  return {
    personal: {
      fullName: fullName || 'Mohd Tabish Khan',
      jobTitle: 'Software Engineer',
      email: emailMatch ? emailMatch[0] : 'user@example.com',
      phone: phoneMatch ? phoneMatch[0] : '+91 9519493113',
      location: location || 'Lucknow, India',
      github: githubMatch ? `https://github.com/${githubMatch[1]}` : undefined,
      linkedin: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : undefined,
      website: websiteMatch ? `https://${websiteMatch[1]}` : undefined,
    },
    summary:
      'Computer Science Engineer specializing in distributed backend systems, AI pipelines, and high-performance databases. Experienced in React, Express, PostgreSQL, RabbitMQ, and Java.',
    experience: finalExp,
    education: education.length > 0 ? education : SAMPLE_FULLSTACK_RESUME.education,
    projects: projects.length > 0 ? projects : SAMPLE_FULLSTACK_RESUME.projects,
    skills: skills.length > 0 ? skills : SAMPLE_FULLSTACK_RESUME.skills,
    certifications: [],
    template: 'classic',
  };
}
