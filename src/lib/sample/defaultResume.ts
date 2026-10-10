import { ResumeData } from '../types/resume';

export const SAMPLE_FULLSTACK_RESUME: ResumeData = {
  personal: {
    fullName: 'Alex Chen',
    jobTitle: 'Senior Full-Stack Engineer',
    email: 'alex.chen@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    website: 'https://alexchen.dev',
    github: 'https://github.com/alexchen',
    linkedin: 'https://linkedin.com/in/alexchen-dev',
  },
  summary: 'Senior Full-Stack Engineer with 6+ years of experience building high-performance web applications, distributed systems, and real-time collaboration platforms using React, Node.js, and TypeScript. Passionate about developer tools and elegant UX.',
  experience: [
    {
      id: 'exp-1',
      company: 'Vercel / Next.js Infrastructure',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2023',
      endDate: 'Present',
      current: true,
      highlights: [
        'Architected real-time streaming compilation pipeline handling over 10M serverless requests daily with sub-50ms latency.',
        'Engineered high-throughput TypeScript SDKs and caching layers that reduced p99 API response times by 38%.',
        'Mentored 6 junior engineers and led key architectural reviews for edge runtime performance optimization.',
      ],
    },
    {
      id: 'exp-2',
      company: 'Linear Systems',
      position: 'Full-Stack Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2021',
      endDate: '2023',
      current: false,
      highlights: [
        'Designed and implemented real-time sync engine utilizing WebSockets and CRDTs for multi-user issue tracking.',
        'Created modular component library in React, Tailwind CSS, and Radix UI used across 4 internal product teams.',
        'Decreased bundle size by 42% through code splitting, tree shaking, and dynamic import optimizations.',
      ],
    },
    {
      id: 'exp-3',
      company: 'Stripe Labs',
      position: 'Frontend Engineer Intern',
      location: 'Seattle, WA',
      startDate: '2020',
      endDate: '2021',
      current: false,
      highlights: [
        'Built interactive developer dashboard telemetry tools using React, GraphQL, and D3.js visualization charts.',
        'Authored comprehensive unit and integration test suites achieving 94% test coverage.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'B.S. in Computer Science & Applied Mathematics',
      location: 'Berkeley, CA',
      startDate: '2017',
      endDate: '2021',
      gpa: '3.92 / 4.0',
      highlights: ['UCSA Scholar', 'Head Teaching Assistant for Data Structures (CS61B)'],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'PromptCV',
      description: 'AI-Native LaTeX Resume Builder & Real-time Compiler',
      highlights: [
        'Built an AI-assisted resume editor with live side-by-side PDF preview and tectonic LaTeX worker compilation.',
        'Integrated Zod structured schema edits preventing LLM hallucination and preserving formatting precision.',
      ],
      techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Tectonic', 'PostgreSQL', 'Prisma'],
      link: 'https://promptcv.dev',
    },
    {
      id: 'proj-2',
      name: 'EdgeDB Studio',
      description: 'Visual database query editor and schema explorer',
      highlights: [
        'Developed WebGL visual query graph generator displaying complex database relations with zero UI lag.',
        'Gained over 3,200 GitHub stars and adopted by 15,000+ active developer teams.',
      ],
      techStack: ['React', 'TypeScript', 'WebGL', 'Node.js', 'Docker'],
      link: 'https://github.com/alexchen/edgedb-studio',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      category: 'Languages & Core',
      items: ['TypeScript', 'JavaScript (ESNext)', 'Python', 'Go', 'HTML5/CSS3', 'SQL', 'LaTeX'],
    },
    {
      id: 'skill-2',
      category: 'Frameworks & Libraries',
      items: ['React 19', 'Next.js App Router', 'Node.js', 'Express', 'Tailwind CSS', 'Prisma', 'GraphQL'],
    },
    {
      id: 'skill-3',
      category: 'Infrastructure & Tools',
      items: ['PostgreSQL', 'Docker', 'AWS (S3, Lambda)', 'Vercel', 'Git', 'Tectonic', 'Linux'],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      date: '2023',
    },
  ],
  template: 'classic',
};

export const SAMPLE_AI_RESUME: ResumeData = {
  personal: {
    fullName: 'Maya Lin',
    jobTitle: 'AI Research Engineer',
    email: 'maya.lin@example.com',
    phone: '+1 (555) 987-6543',
    location: 'New York, NY',
    website: 'https://mayalin.ai',
    github: 'https://github.com/mayalin-ai',
    linkedin: 'https://linkedin.com/in/mayalin-ai',
  },
  summary: 'AI Research Engineer specializing in Large Language Models, structured tool calling, and multimodal reasoning systems. Co-authored 3 NeurIPS/ICLR papers on efficient LLM fine-tuning and retrieval-augmented generation.',
  experience: [
    {
      id: 'exp-1',
      company: 'Anthropic Research',
      position: 'AI Research Scientist',
      location: 'San Francisco, CA',
      startDate: '2023',
      endDate: 'Present',
      current: true,
      highlights: [
        'Co-developed novel reward modeling pipeline for Claude alignment, improving factual accuracy by 22%.',
        'Optimized distributed PyTorch training jobs across 512 H100 GPUs with FlashAttention-3 and FP8 precision.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'Stanford University',
      degree: 'M.S. in Artificial Intelligence & Computer Science',
      startDate: '2021',
      endDate: '2023',
      gpa: '4.0 / 4.0',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'FastRAG-LLM',
      description: 'Sub-millisecond Vector RAG Pipeline for High-Throughput Search',
      highlights: ['Benchmarked sub-10ms retrieval latency across 50M document embeddings using HNSW indexes.'],
      techStack: ['Python', 'PyTorch', 'Qdrant', 'Transformers', 'FastAPI'],
    },
  ],
  skills: [
    {
      id: 'skill-1',
      category: 'AI / ML Frameworks',
      items: ['PyTorch', 'Transformers', 'vLLM', 'TRT-LLM', 'LangChain', 'LlamaIndex', 'NumPy'],
    },
  ],
  certifications: [],
  template: 'modern',
};
