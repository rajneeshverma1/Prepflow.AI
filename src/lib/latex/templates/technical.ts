import { ResumeData } from '../../types/resume';
import { escapeLatex } from '../escape';

export function renderTechnicalTemplate(data: ResumeData): string {
  const p = data.personal;
  const esc = escapeLatex;

  const contacts: string[] = [];
  if (p.email) contacts.push(`\\href{mailto:${p.email}}{${esc(p.email)}}`);
  if (p.phone) contacts.push(esc(p.phone));
  if (p.location) contacts.push(esc(p.location));
  if (p.website) contacts.push(`\\href{${p.website}}{${esc(p.website.replace(/^https?:\/\//, ''))}}`);
  if (p.github) contacts.push(`\\href{${p.github}}{github.com/${esc(p.github.replace(/^https?:\/\/(www\.)?github\.com\//, ''))}}`);
  if (p.linkedin) contacts.push(`\\href{${p.linkedin}}{linkedin.com/in/${esc(p.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ''))}}`);

  const contactLine = contacts.join(' $|$ ');

  const summaryBlock = data.summary
    ? `
\\section*{OVERVIEW}
${esc(data.summary)}
\\vspace{4pt}
`
    : '';

  const skillItems = data.skills
    .map((sk) => `\\textbf{${esc(sk.category)}:} & ${sk.items.map(esc).join(', ')} \\\\`)
    .join('\n');

  const skillsBlock = skillItems
    ? `
\\section*{SKILLS \\& TECHNOLOGIES}
\\begin{tabular}{@{} l l @{}}
${skillItems}
\\end{tabular}
\\vspace{4pt}
`
    : '';

  const experienceItems = data.experience
    .map((exp) => {
      const dates = `${esc(exp.startDate)} -- ${exp.current ? 'Present' : esc(exp.endDate)}`;
      const loc = exp.location ? ` (${esc(exp.location)})` : '';
      const highlights = exp.highlights && exp.highlights.length > 0
        ? `
  \\begin{itemize}[leftmargin=1.5em, noitemsep, topsep=2pt]
${exp.highlights.map((h) => `    \\item ${esc(h)}`).join('\n')}
  \\end{itemize}`
        : '';

      return `
\\textbf{${esc(exp.company)}} -- \\textit{${esc(exp.position)}}${loc} \\hfill \\textbf{${dates}}
${highlights}
\\vspace{4pt}`;
    })
    .join('\n');

  const experienceBlock = experienceItems
    ? `
\\section*{ENGINEERING EXPERIENCE}
${experienceItems}
`
    : '';

  const projectItems = data.projects
    .map((proj) => {
      const titleLink = proj.link
        ? `\\href{${proj.link}}{\\textbf{${esc(proj.name)}}}`
        : `\\textbf{${esc(proj.name)}}`;
      const tech = proj.techStack && proj.techStack.length > 0
        ? ` -- \\textit{\\small ${proj.techStack.map(esc).join(', ')}}`
        : '';
      const highlights = proj.highlights && proj.highlights.length > 0
        ? `
  \\begin{itemize}[leftmargin=1.5em, noitemsep, topsep=2pt]
${proj.highlights.map((h) => `    \\item ${esc(h)}`).join('\n')}
  \\end{itemize}`
        : '';

      return `
${titleLink}${tech} \\\\
${esc(proj.description)}
${highlights}
\\vspace{4pt}`;
    })
    .join('\n');

  const projectsBlock = projectItems
    ? `
\\section*{PROJECTS}
${projectItems}
`
    : '';

  const educationItems = data.education
    .map((edu) => {
      const dates = `${esc(edu.startDate)} -- ${esc(edu.endDate)}`;
      const gpa = edu.gpa ? ` | GPA: ${esc(edu.gpa)}` : '';
      return `
\\textbf{${esc(edu.institution)}} \\hfill ${dates} \\\\
${esc(edu.degree)}${edu.fieldOfStudy ? ` in ${esc(edu.fieldOfStudy)}` : ''}${gpa}
\\vspace{4pt}`;
    })
    .join('\n');

  const educationBlock = educationItems
    ? `
\\section*{EDUCATION}
${educationItems}
`
    : '';

  const customBlocks = (data.customSections || [])
    .map((sec) => {
      if (!sec.title || !sec.items || sec.items.length === 0) return '';
      const items = sec.items.map((item) => `    \\item ${esc(item)}`).join('\n');
      return `
\\section*{${esc(sec.title.toUpperCase())}}
\\begin{itemize}[leftmargin=1.5em, noitemsep, topsep=2pt]
${items}
\\end{itemize}
\\vspace{4pt}`;
    })
    .filter(Boolean)
    .join('\n');

  return `\\documentclass[10pt, letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{tabularx}

\\hypersetup{
    colorlinks=true,
    linkcolor=black,
    urlcolor=black,
}

\\titleformat{\\section}{\\normalsize\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{8pt}{4pt}

\\pagestyle{empty}

\\begin{document}

\\begin{center}
    {\\Large \\bfseries ${esc(p.fullName)}}\\\\[2pt]
    {\\small ${esc(p.jobTitle)}}\\\\[3pt]
    {\\small ${contactLine}}
\\end{center}

${summaryBlock}
${skillsBlock}
${experienceBlock}
${projectsBlock}
${educationBlock}
${customBlocks}

\\end{document}
`;
}
