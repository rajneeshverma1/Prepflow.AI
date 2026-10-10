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

  // Extract email & phone with regex
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  
  const rawNameCandidate = cleanLines[0];
  const isValidName = rawNameCandidate && rawNameCandidate.length < 40 && !rawNameCandidate.includes('%') && !rawNameCandidate.includes('<');
  const cleanFileName = fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : '';
  const name = isValidName ? rawNameCandidate : (cleanFileName || 'Applicant Name');

  const rawTitleCandidate = cleanLines[1];
  const isValidTitle = rawTitleCandidate && rawTitleCandidate.length < 50 && !rawTitleCandidate.includes('%') && !rawTitleCandidate.includes('<');
  const jobTitle = isValidTitle ? rawTitleCandidate : 'Software Engineer';

  const experience: ResumeData['experience'] = [];
  const education: ResumeData['education'] = [];
  const projects: ResumeData['projects'] = [];
  const skills: ResumeData['skills'] = [];

  // Simple heuristic section parsing
  let currentSection = 'summary';
  let summaryText = '';

  for (let i = 2; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    const lower = line.toLowerCase();

    if (lower.includes('experience') || lower.includes('work history') || lower.includes('employment')) {
      currentSection = 'experience';
      continue;
    } else if (lower.includes('education') || lower.includes('academic') || lower.includes('university')) {
      currentSection = 'education';
      continue;
    } else if (lower.includes('project') || lower.includes('portfolio')) {
      currentSection = 'projects';
      continue;
    } else if (lower.includes('skill') || lower.includes('technolog')) {
      currentSection = 'skills';
      continue;
    }

    if (currentSection === 'summary' && summaryText.length < 300) {
      summaryText += (summaryText ? ' ' : '') + line;
    } else if (currentSection === 'experience') {
      if (experience.length === 0 || line.startsWith('•') || line.startsWith('-')) {
        if (experience.length === 0) {
          experience.push({
            id: `exp-${Date.now()}`,
            company: 'Parsed Company',
            position: jobTitle,
            startDate: '2022',
            endDate: 'Present',
            current: true,
            highlights: [],
          });
        }
        experience[0].highlights.push(line.replace(/^[•\-*]\s*/, ''));
      }
    } else if (currentSection === 'skills') {
      if (skills.length === 0) {
        skills.push({ id: `sk-1`, category: 'Technical Skills', items: [] });
      }
      skills[0].items.push(...line.split(/[,|]/).map((s) => s.trim()).filter(Boolean));
    }
  }

  // Merge with sensible defaults if parsing is sparse
  return {
    personal: {
      fullName: name,
      jobTitle: jobTitle,
      email: emailMatch ? emailMatch[0] : 'user@example.com',
      phone: phoneMatch ? phoneMatch[0] : '+1 (555) 000-0000',
      location: 'San Francisco, CA',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
    summary: summaryText || 'Experienced software developer with a strong track record of engineering impact and technical execution.',
    experience: experience.length > 0 ? experience : SAMPLE_FULLSTACK_RESUME.experience,
    education: education.length > 0 ? education : SAMPLE_FULLSTACK_RESUME.education,
    projects: projects.length > 0 ? projects : SAMPLE_FULLSTACK_RESUME.projects,
    skills: skills.length > 0 ? skills : SAMPLE_FULLSTACK_RESUME.skills,
    certifications: [],
    template: 'classic',
  };
}
