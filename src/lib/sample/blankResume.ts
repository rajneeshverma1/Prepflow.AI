import { ResumeData } from '../types/resume';

/**
 * Raw Minimal ATS-Friendly LaTeX Resume Template
 * Compiles cleanly with tectonic / pdflatex
 */
export const BLANK_MINIMAL_LATEX_TEMPLATE = `\\documentclass[10pt, letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.6in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}

\\hypersetup{
    colorlinks=true,
    linkcolor=black,
    filecolor=black,
    urlcolor=black,
}

% Section formatting - ATS compliant, clean underline
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{10pt}{6pt}

\\pagestyle{empty}

\\begin{document}

% --- Header / Contact ---
\\begin{center}
    {\\LARGE \\bfseries YOUR NAME}\\\\[4pt]
    {\\large \\textit{Software Engineer}}\\\\[4pt]
    \\href{mailto:email@example.com}{email@example.com} $\\cdot$
    +1 (555) 000-0000 $\cdot$
    San Francisco, CA $\cdot$
    \\href{https://github.com/yourhandle}{github.com/yourhandle} $\cdot$
    \\href{https://linkedin.com/in/yourhandle}{linkedin.com/in/yourhandle}
\\end{center}

% --- Summary ---
\\section*{Professional Summary}
Results-driven Software Engineer with experience in full-stack development, distributed systems, and cloud infrastructure. Proven track record of delivering high-impact features and optimizing application performance.

% --- Experience ---
\\section*{Experience}
\\textbf{Software Engineer} \\hfill Jan 2023 -- Present \\\\
\\textit{Company Name} \\hfill San Francisco, CA
\\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]
    \\item Designed and developed scalable web services handling over 100k daily requests.
    \\item Optimized SQL database queries and caching layers, decreasing latency by 35\\%.
    \\item Collaborated with cross-functional product and design teams to deliver key features.
\\end{itemize}
\\vspace{4pt}

\\textbf{Software Engineering Intern} \\hfill Jun 2022 -- Aug 2022 \\\\
\\textit{Previous Company} \\hfill Remote
\\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]
    \\item Built automated CI/CD pipeline tests that reduced integration build times by 20\\%.
    \\item Developed RESTful API endpoints and integrated third-party payment processing.
\\end{itemize}
\\vspace{4pt}

% --- Education ---
\\section*{Education}
\\textbf{University Name} \\hfill Aug 2019 -- May 2023 \\\\
Bachelor of Science in Computer Science \\hfill GPA: 3.8 / 4.0

% --- Projects ---
\\section*{Projects}
\\textbf{Open-Source Project} \\hfill \\textit{Next.js, TypeScript, Tailwind CSS} \\\\
\\href{https://github.com/yourhandle/project}{github.com/yourhandle/project}
\\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]
    \\item Built real-time collaborative workspace used by 1,000+ monthly active developers.
    \\item Implemented responsive UI components and WebSocket sync engine.
\\end{itemize}
\\vspace{4pt}

% --- Technical Skills ---
\\section*{Technical Skills}
\\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]
    \\item \\textbf{Languages:} TypeScript, JavaScript, Python, Go, SQL
    \\item \\textbf{Frameworks \\& Libraries:} React, Next.js, Node.js, Express, Tailwind CSS
    \\item \\textbf{Developer Tools:} Docker, Git, PostgreSQL, Redis, Linux, AWS
\\end{itemize}

\\end{document}
`;

/**
 * Structured Blank Resume Data (matches BLANK_MINIMAL_LATEX_TEMPLATE)
 */
export const BLANK_RESUME_DATA: ResumeData = {
  personal: {
    fullName: 'YOUR NAME',
    jobTitle: 'Software Engineer',
    email: 'email@example.com',
    phone: '+1 (555) 000-0000',
    location: 'San Francisco, CA',
    website: 'https://yourwebsite.dev',
    github: 'https://github.com/yourhandle',
    linkedin: 'https://linkedin.com/in/yourhandle',
  },
  summary:
    'Results-driven Software Engineer with experience in full-stack development, distributed systems, and cloud infrastructure. Proven track record of delivering high-impact features and optimizing application performance.',
  experience: [
    {
      id: 'exp-1',
      company: 'Company Name',
      position: 'Software Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jan 2023',
      endDate: 'Present',
      current: true,
      highlights: [
        'Designed and developed scalable web services handling over 100k daily requests.',
        'Optimized SQL database queries and caching layers, decreasing latency by 35%.',
        'Collaborated with cross-functional product and design teams to deliver key features.',
      ],
    },
    {
      id: 'exp-2',
      company: 'Previous Company',
      position: 'Software Engineering Intern',
      location: 'Remote',
      startDate: 'Jun 2022',
      endDate: 'Aug 2022',
      current: false,
      highlights: [
        'Built automated CI/CD pipeline tests that reduced integration build times by 20%.',
        'Developed RESTful API endpoints and integrated third-party payment processing.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University Name',
      degree: 'Bachelor of Science in Computer Science',
      startDate: 'Aug 2019',
      endDate: 'May 2023',
      gpa: '3.8 / 4.0',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Open-Source Project',
      description: 'Real-time collaborative developer workspace',
      techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'WebSockets'],
      link: 'https://github.com/yourhandle/project',
      highlights: [
        'Built real-time collaborative workspace used by 1,000+ monthly active developers.',
        'Implemented responsive UI components and WebSocket sync engine.',
      ],
    },
  ],
  skills: [
    {
      id: 'skill-1',
      category: 'Languages',
      items: ['TypeScript', 'JavaScript', 'Python', 'Go', 'SQL'],
    },
    {
      id: 'skill-2',
      category: 'Frameworks & Libraries',
      items: ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS'],
    },
    {
      id: 'skill-3',
      category: 'Developer Tools',
      items: ['Docker', 'Git', 'PostgreSQL', 'Redis', 'Linux', 'AWS'],
    },
  ],
  certifications: [],
  template: 'classic',
};
