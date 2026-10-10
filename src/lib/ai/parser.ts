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

export function fallbackSmartTextParser(rawText: string, fileName?: string): ResumeData {
  const cleanLines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (
        l.startsWith('%PDF') ||
        l.startsWith('<<') ||
        l.startsWith('>>') ||
        l.startsWith('obj') ||
        l.startsWith('endobj') ||
        l.startsWith('xref') ||
        l.startsWith('stream') ||
        l.startsWith('endstream') ||
        l.startsWith('trailer') ||
        l.startsWith('startxref') ||
        /^\d+\s+\d+\s+R$/.test(l) ||
        /^--\s*\d+\s+of\s+\d+\s*--$/.test(l)
      ) {
        return false;
      }
      if (/^[%\\\/<>]+/.test(l)) return false;
      return true;
    });

  // Extract contact links & info
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,13}/);
  const githubMatch = rawText.match(/github\.com\/[a-zA-Z0-9_-]+/i);
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const websiteMatch = rawText.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i);

  // Name extraction (first prominent non-contact line)
  let name = '';
  for (let i = 0; i < Math.min(8, cleanLines.length); i++) {
    const line = cleanLines[i];
    if (
      line.length >= 2 &&
      line.length < 40 &&
      !line.includes('@') &&
      !line.includes('.com') &&
      !line.includes('github') &&
      !line.includes('linkedin') &&
      !/^\+?\d/.test(line) &&
      !/^(experience|education|projects|skills|summary|curriculum|resume|work|contact|profile)/i.test(line)
    ) {
      name = line.replace(/[^a-zA-Z\s.-]/g, '').trim();
      if (name.length >= 2) break;
    }
  }
  if (!name && fileName) {
    name = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }
  if (!name) name = 'Candidate Name';

  // Job Title candidate
  let jobTitle = 'Software Engineer';
  for (let i = 0; i < Math.min(10, cleanLines.length); i++) {
    const line = cleanLines[i];
    if (
      line !== name &&
      line.length > 3 &&
      line.length < 60 &&
      !line.includes('@') &&
      !/^\+?\d/.test(line) &&
      /engineer|developer|manager|designer|analyst|architect|consultant|intern|specialist|lead|scientist|programmer|student|fresher|consultant/i.test(line)
    ) {
      jobTitle = line;
      break;
    }
  }

  // Location Candidate
  let location = 'Bangalore, India';
  for (let i = 0; i < Math.min(12, cleanLines.length); i++) {
    const line = cleanLines[i];
    if (
      line !== name &&
      line !== jobTitle &&
      /[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+|[A-Z][a-zA-Z]+,\s*[A-Z]{2}/.test(line) &&
      !line.includes('@') &&
      !line.includes('http')
    ) {
      const match = line.match(/[A-Za-z\s]+,\s*[A-Za-z\s]+/);
      if (match) {
        location = match[0].trim();
        break;
      }
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
    if (/^(experience|work experience|employment|employment history|professional experience|work history|career history)/i.test(lower)) {
      currentSection = 'experience';
      continue;
    } else if (/^(education|academic background|academics|university|academic qualification|qualifications)/i.test(lower)) {
      currentSection = 'education';
      continue;
    } else if (/^(projects|personal projects|technical projects|key projects|academic projects)/i.test(lower)) {
      currentSection = 'projects';
      continue;
    } else if (/^(skills|technical skills|skills & expertise|core competencies|technologies|tools & technologies|programming languages)/i.test(lower)) {
      currentSection = 'skills';
      continue;
    } else if (/^(summary|professional summary|about me|profile|career objective|objective)/i.test(lower)) {
      currentSection = 'summary';
      continue;
    }

    if (currentSection === 'summary') {
      if (summaryText.length < 600) {
        summaryText += (summaryText ? ' ' : '') + line;
      }
    } else if (currentSection === 'experience') {
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\d+\.\s*/.test(line);
      const hasDate = /(20\d\d|19\d\d|present|current|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(line);
      const isRoleCompanyHeader = !isBullet && (hasDate || line.includes('|') || line.includes('—') || line.includes(' - ') || line.length < 60);

      if (isRoleCompanyHeader && experience.length < 10) {
        let comp = line;
        let pos = jobTitle;
        let sDate = '2022';
        let eDate = 'Present';

        // Extract dates if present
        const dateMatch = line.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(?:19|20)\d{2}(?:\s*(?:-|–|to)\s*(?:(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(?:19|20)\d{2}|Present|Current))?/i);
        if (dateMatch) {
          const dStr = dateMatch[0];
          const parts = dStr.split(/[-–]|to/i).map((s) => s.trim());
          if (parts[0]) sDate = parts[0];
          if (parts[1]) eDate = parts[1];
          comp = comp.replace(dateMatch[0], '').replace(/[()|–—]/g, ' ').trim();
        }

        if (comp.includes('|') || comp.includes('—') || comp.includes(' - ')) {
          const splitParts = comp.split(/[|—]|\s+-\s+/).map((s) => s.trim()).filter(Boolean);
          if (splitParts.length >= 2) {
            pos = splitParts[0];
            comp = splitParts[1];
          }
        }

        experience.push({
          id: `exp-${Date.now()}-${experience.length}`,
          company: comp || 'Company',
          position: pos || jobTitle,
          startDate: sDate,
          endDate: eDate,
          current: /present|current/i.test(eDate),
          highlights: [],
        });
      } else {
        // Bullet or description line
        const bulletText = line.replace(/^[•\-*\d.]+\s*/, '').trim();
        if (bulletText.length > 3) {
          if (experience.length === 0) {
            experience.push({
              id: `exp-${Date.now()}`,
              company: 'Company / Project',
              position: jobTitle,
              startDate: '2022',
              endDate: 'Present',
              current: true,
              highlights: [],
            });
          }
          experience[experience.length - 1].highlights.push(bulletText);
        }
      }
    } else if (currentSection === 'education') {
      const hasDate = /(20\d\d|19\d\d)/.test(line);
      const hasEduKeyword = /university|college|institute|school|bachelor|master|b\.tech|b\.e\.|m\.tech|b\.s\.|m\.s\.|degree|diploma|phd|gpa/i.test(line);
      
      if (hasEduKeyword || hasDate || education.length === 0) {
        let degree = 'Bachelor of Technology';
        let institution = line;
        let sDate = '2020';
        let eDate = '2024';

        const dateMatch = line.match(/(?:19|20)\d{2}\s*[-–]\s*(?:(?:19|20)\d{2}|Present)/);
        if (dateMatch) {
          const parts = dateMatch[0].split(/[-–]/).map((s) => s.trim());
          sDate = parts[0] || '2020';
          eDate = parts[1] || '2024';
          institution = institution.replace(dateMatch[0], '').replace(/[()|]/g, ' ').trim();
        }

        if (/bachelor|b\.tech|b\.e|b\.s/i.test(line)) degree = 'Bachelor of Science / Technology';
        else if (/master|m\.tech|m\.s|mba/i.test(line)) degree = 'Master of Science';

        education.push({
          id: `edu-${Date.now()}-${education.length}`,
          institution: institution || 'University / Institute',
          degree: degree,
          startDate: sDate,
          endDate: eDate,
          highlights: [],
        });
      }
    } else if (currentSection === 'skills') {
      let category = 'Technical Skills';
      let itemsStr = line;

      if (line.includes(':')) {
        const parts = line.split(':');
        category = parts[0].trim();
        itemsStr = parts.slice(1).join(':');
      }

      const items = itemsStr
        .split(/[,|•;·\t]/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length < 40 && !s.toLowerCase().startsWith('skills'));

      if (items.length > 0) {
        const existingCat = skills.find((s) => s.category.toLowerCase() === category.toLowerCase());
        if (existingCat) {
          existingCat.items.push(...items);
        } else {
          skills.push({
            id: `sk-${skills.length + 1}`,
            category: category || 'Skills',
            items: items,
          });
        }
      }
    } else if (currentSection === 'projects') {
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
      if (isBullet) {
        if (projects.length === 0) {
          projects.push({
            id: `proj-${Date.now()}`,
            name: 'Key Project',
            description: '',
            highlights: [],
            techStack: ['TypeScript', 'React'],
          });
        }
        projects[projects.length - 1].highlights.push(line.replace(/^[•\-*]\s*/, '').trim());
      } else if (line.length < 60) {
        projects.push({
          id: `proj-${Date.now()}-${projects.length}`,
          name: line.replace(/[|:–—].*$/, '').trim(),
          description: '',
          highlights: [],
          techStack: ['TypeScript', 'React'],
        });
      }
    }
  }

  // Deduplicate skills in all categories
  skills.forEach((s) => {
    s.items = Array.from(new Set(s.items));
  });

  return {
    personal: {
      fullName: name || 'Candidate Name',
      jobTitle: jobTitle || 'Software Engineer',
      email: emailMatch ? emailMatch[0] : 'candidate@example.com',
      phone: phoneMatch ? phoneMatch[0] : '+91 98765 43210',
      location: location,
      github: githubMatch ? `https://${githubMatch[0]}` : undefined,
      linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : undefined,
      website: websiteMatch ? websiteMatch[0] : undefined,
    },
    summary: summaryText || 'Dynamic and results-driven professional with strong technical expertise, proven problem-solving abilities, and a track record of high-impact execution.',
    experience: experience.length > 0 ? experience : [
      {
        id: `exp-${Date.now()}`,
        company: 'Technology Solutions',
        position: jobTitle,
        startDate: '2022',
        endDate: 'Present',
        current: true,
        highlights: [
          'Engineered and delivered core software features, improving system throughput and performance.',
          'Collaborated with cross-functional teams to design, implement, and deploy production-grade solutions.'
        ]
      }
    ],
    education: education.length > 0 ? education : [
      {
        id: `edu-${Date.now()}`,
        institution: 'University Institute of Technology',
        degree: 'Bachelor of Technology in Computer Science',
        startDate: '2019',
        endDate: '2023',
        highlights: []
      }
    ],
    projects: projects.length > 0 ? projects : [
      {
        id: `proj-1`,
        name: 'Full Stack Web Platform',
        description: 'High performance web application built with modern frameworks',
        highlights: [
          'Implemented responsive UI and RESTful API backend handling real-time data sync.',
          'Optimized database queries and deployed automated CI/CD build pipelines.'
        ],
        techStack: ['TypeScript', 'Next.js', 'PostgreSQL', 'Tailwind CSS']
      }
    ],
    skills: skills.length > 0 ? skills : [
      {
        id: 'sk-1',
        category: 'Technical Skills',
        items: ['TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Git', 'LaTeX']
      }
    ],
    certifications: [],
    template: 'classic',
  };
}
