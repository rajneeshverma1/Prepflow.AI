import { ResumeData } from '../../types/resume';
import { escapeLatex } from '../escape';

export function renderModernTemplate(data: ResumeData): string {
  const p = data.personal;
  const esc = escapeLatex;

  const contacts: string[] = [];
  if (p.email) contacts.push(`\\href{mailto:${p.email}}{${esc(p.email)}}`);
  if (p.phone) contacts.push(esc(p.phone));
  if (p.location) contacts.push(esc(p.location));
  if (p.website) contacts.push(`\\href{${p.website}}{${esc(p.website.replace(/^https?:\/\//, ''))}}`);
  if (p.github) contacts.push(`\\href{${p.github}}{GitHub}`);
  if (p.linkedin) contacts.push(`\\href{${p.linkedin}}{LinkedIn}`);

  const contactLine = contacts.join(' \\ \\ $|$ \\ \\ ');

  const summaryBlock = data.summary
    ? `
\\section*{Professional Summary}
${esc(data.summary)}
\\vspace{4pt}
`
    : '';

  const experienceItems = data.experience
    .map((exp) => {
      const dates = `${esc(exp.startDate)} -- ${exp.current ? 'Present' : esc(exp.endDate)}`;
      const loc = exp.location ? ` | ${esc(exp.location)}` : '';
      const highlights = exp.highlights && exp.highlights.length > 0
        ? `
  \\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]
${exp.highlights.map((h) => `    \\item ${esc(h)}`).join('\n')}
  \\end{itemize}`
        : '';

      return `
\\textbf{\\large ${esc(exp.position)}} \\hfill {\\color{accentColor}\\textbf{${dates}}} \\\\
{\\color{darkGrey}\\textbf{${esc(exp.company)}}}${loc}
${highlights}
\\vspace{6pt}`;
    })
    .join('\n');

  const experienceBlock = experienceItems
    ? `
\\section*{Experience}
${experienceItems}
`
    : '';

  const educationItems = data.education
    .map((edu) => {
      const dates = `${esc(edu.startDate)} -- ${esc(edu.endDate)}`;
      const gpa = edu.gpa ? ` (GPA: ${esc(edu.gpa)})` : '';
      return `
\\textbf{${esc(edu.institution)}} \\hfill ${dates} \\\\
${esc(edu.degree)}${edu.fieldOfStudy ? ` in ${esc(edu.fieldOfStudy)}` : ''}${gpa}
\\vspace{4pt}`;
    })
    .join('\n');

  const educationBlock = educationItems
    ? `
\\section*{Education}
${educationItems}
`
    : '';

  const projectItems = data.projects
    .map((proj) => {
      const titleLink = proj.link
        ? `\\href{${proj.link}}{\\textbf{${esc(proj.name)}}}`
        : `\\textbf{${esc(proj.name)}}`;
      const tech = proj.techStack && proj.techStack.length > 0
        ? ` \\hfill \\textit{\\small ${proj.techStack.map(esc).join(', ')}}`
        : '';
      const highlights = proj.highlights && proj.highlights.length > 0
        ? `
  \\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]
${proj.highlights.map((h) => `    \\item ${esc(h)}`).join('\n')}
  \\end{itemize}`
        : '';

      return `
${titleLink}${tech} \\\\
{\\small ${esc(proj.description)}}
${highlights}
\\vspace{5pt}`;
    })
    .join('\n');

  const projectsBlock = projectItems
    ? `
\\section*{Projects}
${projectItems}
`
    : '';

  const skillItems = data.skills
    .map((sk) => `\\textbf{${esc(sk.category)}:} ${sk.items.map(esc).join(', ')}`)
    .join(' \\\\\n');

  const skillsBlock = skillItems
    ? `
\\section*{Technical Expertise}
${skillItems}
`
    : '';

  // Certifications
  const certItems = (data.certifications || [])
    .map((c) => {
      let line = `\\textbf{${esc(c.name)}}`;
      if (c.issuer && c.issuer !== 'Credential Issuer' && c.issuer !== 'Issuer') {
        line += ` -- ${esc(c.issuer)}`;
      }
      if (c.date && c.date !== 'Year' && c.date !== 'Date') {
        line += ` (${esc(c.date)})`;
      }
      return line;
    })
    .filter(Boolean)
    .join(' \\\\\n');

  const certsBlock = certItems
    ? `
\\section*{Certifications}
${certItems}
`
    : '';

  const customBlocks = (data.customSections || [])
    .map((sec) => {
      if (!sec.title || !sec.items || sec.items.length === 0) return '';
      const items = sec.items.map((item) => `    \\item ${esc(item)}`).join('\n');
      return `
\\section*{${esc(sec.title)}}
\\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]
${items}
\\end{itemize}
\\vspace{5pt}`;
    })
    .filter(Boolean)
    .join('\n');

  return `\\documentclass[10pt, letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.55in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}

\\definecolor{accentColor}{RGB}{124, 92, 255}
\\definecolor{darkGrey}{RGB}{60, 60, 60}

\\hypersetup{
    colorlinks=true,
    linkcolor=accentColor,
    urlcolor=accentColor,
}

\\titleformat{\\section}{\\large\\bfseries\\color{accentColor}}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{10pt}{6pt}

\\pagestyle{empty}

\\begin{document}

\\begin{center}
    {\\Huge \\bfseries ${esc(p.fullName)}}\\\\[3pt]
    {\\large \\color{darkGrey}\\textbf{${esc(p.jobTitle)}}}\\\\[5pt]
    {\\small ${contactLine}}
\\end{center}
\\vspace{4pt}

${summaryBlock}
${experienceBlock}
${educationBlock}
${projectsBlock}
${skillsBlock}
${certsBlock}
${customBlocks}

\\end{document}
`;
}
