import { prisma } from './client';
import { ResumeData, RevisionMeta, ChatMessage } from '../types/resume';
import { SAMPLE_FULLSTACK_RESUME, SAMPLE_AI_RESUME } from '../sample/defaultResume';
import { generateLatexSource } from '../latex/renderer';

// In-memory fallback cache for instant local dev responsiveness when database is connecting/configuring
const memoryResumes: Map<string, {
  id: string;
  title: string;
  targetRole?: string;
  template: string;
  data: ResumeData;
  pdfPath?: string;
  texSource?: string;
  createdAt: string;
  updatedAt: string;
  revisions: RevisionMeta[];
  messages: ChatMessage[];
}> = new Map();

// Populate memory store with starter sample resumes if empty
function initializeSampleMemoryStore() {
  if (memoryResumes.size === 0) {
    const defaultId1 = 'sample-fullstack-1';
    const tex1 = generateLatexSource(SAMPLE_FULLSTACK_RESUME);
    memoryResumes.set(defaultId1, {
      id: defaultId1,
      title: 'Alex Chen – Senior Full-Stack Engineer',
      targetRole: 'Full-Stack Engineer',
      template: 'classic',
      data: SAMPLE_FULLSTACK_RESUME,
      texSource: tex1,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
      revisions: [
        {
          id: 'rev-1',
          version: 1,
          prompt: 'Initial creation from template',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          data: SAMPLE_FULLSTACK_RESUME,
          texSource: tex1,
        }
      ],
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Hello! I am your AI Resume Editor. You can ask me to add experiences, rewrite bullet points, tailor your resume for a job description, or change templates!',
          timestamp: new Date().toISOString(),
          suggestedActions: [
            'Add my latest internship',
            'Rewrite bullet points for impact',
            'Tailor for a Senior Full-Stack role',
            'Shorten to 1 page',
            'Switch to Modern template'
          ]
        }
      ]
    });

    const defaultId2 = 'sample-ai-1';
    const tex2 = generateLatexSource(SAMPLE_AI_RESUME);
    memoryResumes.set(defaultId2, {
      id: defaultId2,
      title: 'Maya Lin – AI Research Engineer',
      targetRole: 'AI Research Engineer',
      template: 'modern',
      data: SAMPLE_AI_RESUME,
      texSource: tex2,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      revisions: [
        {
          id: 'rev-1',
          version: 1,
          prompt: 'Created AI Research Resume',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          data: SAMPLE_AI_RESUME,
          texSource: tex2,
        }
      ],
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Welcome! How can I assist you with refining your AI Research Engineer resume today?',
          timestamp: new Date().toISOString(),
          suggestedActions: [
            'Add PyTorch optimization achievements',
            'Improve publication highlights',
            'Switch to Technical template'
          ]
        }
      ]
    });
  }
}

initializeSampleMemoryStore();

export async function getAllResumes() {
  try {
    if (process.env.DATABASE_URL) {
      const resumes = await prisma.resume.findMany({
        orderBy: { updatedAt: 'desc' },
      });
      if (resumes.length > 0) {
        return resumes.map((r) => ({
          ...r,
          data: JSON.parse(r.data) as ResumeData,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));
      }
    }
  } catch (err) {
    console.warn('Prisma query failed, falling back to memory store:', err);
  }

  return Array.from(memoryResumes.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getResumeById(id: string) {
  try {
    if (process.env.DATABASE_URL) {
      const resume = await prisma.resume.findUnique({
        where: { id },
        include: {
          revisions: { orderBy: { version: 'desc' } },
          messages: { orderBy: { timestamp: 'asc' } },
        },
      });
      if (resume) {
        return {
          id: resume.id,
          title: resume.title,
          targetRole: resume.targetRole || undefined,
          template: resume.template,
          data: JSON.parse(resume.data) as ResumeData,
          pdfPath: resume.pdfPath || undefined,
          texSource: resume.texSource || undefined,
          createdAt: resume.createdAt.toISOString(),
          updatedAt: resume.updatedAt.toISOString(),
          revisions: resume.revisions.map((rev) => ({
            id: rev.id,
            version: rev.version,
            prompt: rev.prompt || undefined,
            createdAt: rev.createdAt.toISOString(),
            data: JSON.parse(rev.data) as ResumeData,
            texSource: rev.texSource || undefined,
          })),
          messages: resume.messages.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
            timestamp: m.timestamp.toISOString(),
          })),
        };
      }
    }
  } catch (err) {
    console.warn('Prisma query failed, checking memory store:', err);
  }

  return memoryResumes.get(id) || null;
}

export async function createResume(params: {
  title: string;
  targetRole?: string;
  template?: string;
  initialData?: ResumeData;
}) {
  const id = `resume-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const data = params.initialData || { ...SAMPLE_FULLSTACK_RESUME, template: (params.template as any) || 'classic' };
  const texSource = generateLatexSource(data);
  const now = new Date().toISOString();

  const newResume = {
    id,
    title: params.title || 'Untitled Resume',
    targetRole: params.targetRole || data.personal.jobTitle || 'Software Engineer',
    template: data.template || 'classic',
    data,
    texSource,
    pdfPath: undefined,
    createdAt: now,
    updatedAt: now,
    revisions: [
      {
        id: `rev-${Date.now()}`,
        version: 1,
        prompt: 'Initial creation',
        createdAt: now,
        data,
        texSource,
      },
    ],
    messages: [
      {
        id: `msg-${Date.now()}`,
        role: 'assistant' as const,
        content: `Created new resume: **${params.title}**. What changes or improvements would you like to make?`,
        timestamp: now,
        suggestedActions: [
          'Add recent work experience',
          'Optimize bullet points with STAR method',
          'Tailor for a specific job description',
        ],
      },
    ],
  };

  try {
    if (process.env.DATABASE_URL) {
      await prisma.resume.create({
        data: {
          id: newResume.id,
          title: newResume.title,
          targetRole: newResume.targetRole,
          template: newResume.template,
          data: JSON.stringify(newResume.data),
          texSource: newResume.texSource,
          revisions: {
            create: {
              id: newResume.revisions[0].id,
              version: 1,
              prompt: newResume.revisions[0].prompt,
              data: JSON.stringify(newResume.data),
              texSource: newResume.texSource,
            },
          },
          messages: {
            create: {
              id: newResume.messages[0].id,
              role: newResume.messages[0].role,
              content: newResume.messages[0].content,
            },
          },
        },
      });
    }
  } catch (err) {
    console.warn('Prisma create failed, storing in memory:', err);
  }

  memoryResumes.set(id, newResume);
  return newResume;
}

export async function updateResumeData(
  id: string,
  updatedData: ResumeData,
  prompt?: string,
  pdfPath?: string
) {
  const existing = await getResumeById(id);
  if (!existing) throw new Error(`Resume with ID ${id} not found`);

  const texSource = generateLatexSource(updatedData);
  const now = new Date().toISOString();
  const nextVersion = (existing.revisions?.length || 0) + 1;

  const newRevision: RevisionMeta = {
    id: `rev-${Date.now()}`,
    version: nextVersion,
    prompt: prompt || `Version ${nextVersion}`,
    createdAt: now,
    data: updatedData,
    texSource,
  };

  const updatedResume = {
    ...existing,
    template: updatedData.template || existing.template,
    data: updatedData,
    texSource,
    pdfPath: pdfPath || existing.pdfPath,
    updatedAt: now,
    revisions: [newRevision, ...(existing.revisions || [])],
  };

  try {
    if (process.env.DATABASE_URL) {
      await prisma.resume.update({
        where: { id },
        data: {
          template: updatedResume.template,
          data: JSON.stringify(updatedData),
          texSource,
          pdfPath: pdfPath || existing.pdfPath,
          updatedAt: new Date(now),
        },
      });

      await prisma.resumeRevision.create({
        data: {
          id: newRevision.id,
          resumeId: id,
          version: nextVersion,
          prompt: newRevision.prompt,
          data: JSON.stringify(updatedData),
          texSource,
          pdfPath: pdfPath || existing.pdfPath,
        },
      });
    }
  } catch (err) {
    console.warn('Prisma update failed, updating memory store:', err);
  }

  memoryResumes.set(id, updatedResume);
  return updatedResume;
}

export async function addChatMessage(
  resumeId: string,
  message: { role: 'user' | 'assistant' | 'system'; content: string; suggestedActions?: string[]; isError?: boolean }
) {
  const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  const now = new Date().toISOString();
  const chatMsg: ChatMessage = {
    id,
    role: message.role,
    content: message.content,
    timestamp: now,
    suggestedActions: message.suggestedActions,
    isError: message.isError,
  };

  const existing = await getResumeById(resumeId);
  if (existing) {
    existing.messages.push(chatMsg);
    memoryResumes.set(resumeId, existing);
  }

  try {
    if (process.env.DATABASE_URL) {
      await prisma.chatMessage.create({
        data: {
          id,
          resumeId,
          role: message.role,
          content: message.content,
        },
      });
    }
  } catch (err) {
    console.warn('Prisma chat insert failed, recorded in memory:', err);
  }

  return chatMsg;
}

export async function deleteResume(id: string) {
  memoryResumes.delete(id);
  try {
    if (process.env.DATABASE_URL) {
      await prisma.resume.delete({ where: { id } });
    }
  } catch (err) {
    console.warn('Prisma delete failed:', err);
  }
  return true;
}

export async function duplicateResume(id: string) {
  const existing = await getResumeById(id);
  if (!existing) throw new Error('Resume not found');

  return createResume({
    title: `${existing.title} (Copy)`,
    targetRole: existing.targetRole || undefined,
    template: existing.template,
    initialData: JSON.parse(JSON.stringify(existing.data)),
  });
}
