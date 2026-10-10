import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { ResumeData } from '../types/resume';
import { resumeDataSchema } from '../schema/resume';
import { SAMPLE_FULLSTACK_RESUME } from '../sample/defaultResume';

const PARSE_RESUME_SYSTEM_PROMPT = `You are PromptCV AI — an expert resume parser.
Your task is to parse raw text extracted from an uploaded resume document (PDF, DOCX, TXT, or Image) into a structured JSON object matching the ResumeData schema.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object matching the ResumeData schema.
2. Extract truth factual details accurately: fullName, jobTitle, email, phone, location, github, linkedin, summary, experience array, education array, projects array, skills array, certifications array.
3. Template field should be set to "classic" by default unless specified.
4. Each experience item MUST have: id, company, position, location, startDate, endDate, current, highlights array.
5. Each education item MUST have: id, institution, degree, fieldOfStudy, startDate, endDate, gpa, highlights.
6. Each project item MUST have: id, name, description, highlights array, techStack array.
7. Each skill item MUST have: id, category, items array.
`;

export async function parseResumeContent(rawText: string, fileName?: string): Promise<ResumeData> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Try Gemini API
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${PARSE_RESUME_SYSTEM_PROMPT}\n\nUploaded Resume Content:\n${rawText}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(cleanJsonString(response.text || ''));
      const validated = resumeDataSchema.parse(parsed);
      return validated as ResumeData;
    } catch (err: any) {
      console.warn('Gemini resume parsing failed, trying OpenAI or smart fallback:', err?.message);
    }
  }

  // 2. Try OpenAI API
  if (openaiKey) {
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

function fallbackSmartTextParser(rawText: string, fileName?: string): ResumeData {
  const cleanLines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (l.startsWith('%PDF') || l.startsWith('<<') || l.startsWith('obj') || l.startsWith('endobj') || l.startsWith('xref') || l.startsWith('stream')) return false;
      if (/^[%\\\/<>]+/.test(l)) return false;
      return true;
    });

  // Extract contact links & info
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,13}/);
  const githubMatch = rawText.match(/github\.com\/[a-zA-Z0-9_-]+/i);
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const websiteMatch = rawText.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i);

  // Name extraction
  let name = '';
  for (let i = 0; i < Math.min(5, cleanLines.length); i++) {
    const line = cleanLines[i];
    if (
      line.length > 2 &&
      line.length < 40 &&
      !line.includes('@') &&
      !line.includes('.com') &&
      !/^(experience|education|projects|skills|summary|curriculum|resume)/i.test(line)
    ) {
      name = line;
      break;
    }
  }
  if (!name && fileName) {
    name = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }
  if (!name) name = 'Applicant Name';

  // Job Title candidate
  let jobTitle = 'Software Engineer';
  for (let i = 0; i < Math.min(6, cleanLines.length); i++) {
    const line = cleanLines[i];
    if (
      line !== name &&
      line.length > 3 &&
      line.length < 50 &&
      !line.includes('@') &&
      !/^\+?\d/.test(line) &&
      /engineer|developer|manager|designer|analyst|architect|consultant|intern|specialist|lead|scientist/i.test(line)
    ) {
      jobTitle = line;
      break;
    }
  }

  // Section Segmentation
  const experience: ResumeData['experience'] = [];
  const education: ResumeData['education'] = [];
  const projects: ResumeData['projects'] = [];
  const skills: ResumeData['skills'] = [];
  let summaryText = '';

  let currentSection: 'header' | 'summary' | 'experience' | 'education' | 'projects' | 'skills' = 'header';

  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    const lower = line.toLowerCase();

    // Section header detection
    if (/^(experience|work experience|employment|professional experience|work history)/i.test(lower)) {
      currentSection = 'experience';
      continue;
    } else if (/^(education|academic background|academics|university)/i.test(lower)) {
      currentSection = 'education';
      continue;
    } else if (/^(projects|personal projects|technical projects|key projects)/i.test(lower)) {
      currentSection = 'projects';
      continue;
    } else if (/^(skills|technical skills|skills & expertise|core competencies|technologies)/i.test(lower)) {
      currentSection = 'skills';
      continue;
    } else if (/^(summary|professional summary|about me|profile|objective)/i.test(lower)) {
      currentSection = 'summary';
      continue;
    }

    if (currentSection === 'summary') {
      if (summaryText.length < 500) {
        summaryText += (summaryText ? ' ' : '') + line;
      }
    } else if (currentSection === 'experience') {
      // Look for role / company / dates
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
      if (isBullet) {
        if (experience.length === 0) {
          experience.push({
            id: `exp-${Date.now()}`,
            company: 'Tech Company',
            position: jobTitle,
            startDate: '2022',
            endDate: 'Present',
            current: true,
            highlights: [],
          });
        }
        experience[experience.length - 1].highlights.push(line.replace(/^[•\-*]\s*/, ''));
      } else if (line.length < 60) {
        // Potential new role or company header
        const dateMatch = line.match(/(20\d\d|19\d\d|present|current)/i);
        if (dateMatch || experience.length === 0) {
          experience.push({
            id: `exp-${Date.now()}-${experience.length}`,
            company: line,
            position: jobTitle,
            startDate: '2022',
            endDate: 'Present',
            current: true,
            highlights: [],
          });
        }
      }
    } else if (currentSection === 'education') {
      if (education.length === 0 || /university|college|institute|school|bachelor|master|b\.tech|degree/i.test(line)) {
        education.push({
          id: `edu-${Date.now()}-${education.length}`,
          institution: line,
          degree: 'Bachelor of Science in Computer Science',
          startDate: '2020',
          endDate: '2024',
          highlights: [],
        });
      }
    } else if (currentSection === 'skills') {
      const items = line.split(/[,|•;]/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 35);
      if (items.length > 0) {
        if (skills.length === 0) {
          skills.push({ id: `sk-1`, category: 'Technical Skills', items: [] });
        }
        skills[0].items.push(...items);
      }
    } else if (currentSection === 'projects') {
      if (line.startsWith('•') || line.startsWith('-')) {
        if (projects.length === 0) {
          projects.push({
            id: `proj-${Date.now()}`,
            name: 'Key Technical Project',
            description: '',
            highlights: [],
            techStack: ['TypeScript', 'React', 'Node.js'],
          });
        }
        projects[projects.length - 1].highlights.push(line.replace(/^[•\-*]\s*/, ''));
      } else if (line.length < 50) {
        projects.push({
          id: `proj-${Date.now()}-${projects.length}`,
          name: line,
          description: '',
          highlights: [],
          techStack: ['TypeScript', 'Node.js'],
        });
      }
    }
  }

  // Deduplicate skills
  if (skills.length > 0 && skills[0].items.length > 0) {
    skills[0].items = Array.from(new Set(skills[0].items));
  }

  return {
    personal: {
      fullName: name,
      jobTitle: jobTitle,
      email: emailMatch ? emailMatch[0] : 'user@example.com',
      phone: phoneMatch ? phoneMatch[0] : '+1 (555) 000-0000',
      location: 'San Francisco, CA',
      github: githubMatch ? `https://${githubMatch[0]}` : undefined,
      linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : undefined,
      website: websiteMatch ? websiteMatch[0] : undefined,
    },
    summary: summaryText || 'Experienced professional with a proven background in building scalable systems, high-quality deliverables, and technical execution.',
    experience: experience.length > 0 ? experience : SAMPLE_FULLSTACK_RESUME.experience,
    education: education.length > 0 ? education : SAMPLE_FULLSTACK_RESUME.education,
    projects: projects.length > 0 ? projects : SAMPLE_FULLSTACK_RESUME.projects,
    skills: skills.length > 0 && skills[0].items.length > 0 ? skills : SAMPLE_FULLSTACK_RESUME.skills,
    certifications: [],
    template: 'classic',
  };
}
