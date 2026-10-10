import { ResumeData } from '../../types/resume';
import { escapeLatex } from '../escape';

export function renderMinimalTemplate(data: ResumeData): string {
  const p = data.personal;
  const esc = escapeLatex;

  const contacts: string[] = [];
  if (p.email) contacts.push(`\\href{mailto:${p.email}}{${esc(p.email)}}`);
  if (p.phone) contacts.push(esc(p.phone));
  if (p.location) contacts.push(esc(p.location));
  if (p.website) contacts.push(`\\href{${p.website}}{${esc(p.website.replace(/^https?:\/\//, ''))}}`);
  if (p.github) contacts.push(`\\href{${p.github}}{GitHub}`);
  if (p.linkedin) contacts.push(`\\href{${p.linkedin}}{LinkedIn}`);

  const contactLine = contacts.join(' $\\cdot$ ');

  const summaryBlock = data.summary
    ? `
\\section*{Summary}
{\\color{charcoal}${esc(data.summary)}}
\\vspace{6pt}
`
    : '';

  const experienceItems = data.experience
    .map((exp) => {
      const dates = `${esc(exp.startDate)} -- ${exp.current ? 'Present' : esc(exp.endDate)}`;
      const loc = exp.location ? ` $\\cdot$ ${esc(exp.location)}` : '';
      const highlights = exp.highlights && exp.highlights.length > 0
        ? `
  \\begin{itemize}[leftmargin=1.2em, noitemsep, topsep=2pt]
${exp.highlights.map((h) => `    \\item {\\color{charcoal}${esc(h)}}`).join('\n')}
  \\end{itemize}`
        : '';

      return `
\\textbf{${esc(exp.position)}} \\hfill {\\small \\color{subtleGrey}${dates}} \\\\
{\\color{charcoal}\\textit{${esc(exp.company)}}}${loc}
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

  const projectItems = data.projects
    .map((proj) => {
      const titleLink = proj.link
        ? `\\href{${proj.link}}{\\textbf{${esc(proj.name)}}}`
        : `\\textbf{${esc(proj.name)}}`;
      const tech = proj.techStack && proj.techStack.length > 0
        ? ` \\hfill {\\small \\color{subtleGrey}${proj.techStack.map(esc).join(', ')}}`
        : '';
      const highlights = proj.highlights && proj.highlights.length > 0
        ? `
  \\begin{itemize}[leftmargin=1.2em, noitemsep, topsep=2pt]
${proj.highlights.map((h) => `    \\item {\\color{charcoal}${esc(h)}}`).join('\n')}
  \\end{itemize}`
        : '';

      return `
${titleLink}${tech} \\\\
{\\small \\color{charcoal}${esc(proj.description)}}
${highlights}
\\vspace{5pt}`;
    })
    .join('\n');

  const projectsBlock = projectItems
    ? `
\\section*{Selected Projects}
${projectItems}
`
    : '';

  const educationItems = data.education
    .map((edu) => {
      const dates = `${esc(edu.startDate)} -- ${esc(edu.endDate)}`;
      const gpa = edu.gpa ? ` (GPA: ${esc(edu.gpa)})` : '';
      return `
\\textbf{${esc(edu.institution)}} \\hfill {\\small \\color{subtleGrey}${dates}} \\\\
{\\color{charcoal}${esc(edu.degree)}${edu.fieldOfStudy ? ` in ${esc(edu.fieldOfStudy)}` : ''}${gpa}}
\\vspace{4pt}`;
    })
    .join('\n');

  const educationBlock = educationItems
    ? `
\\section*{Education}
${educationItems}
`
    : '';

  const skillItems = data.skills
    .map((sk) => `\\textbf{${esc(sk.category)}:} ${sk.items.map(esc).join(', ')}`)
    .join(' \\\\\n');

  const skillsBlock = skillItems
    ? `
\\section*{Skills \\& Tools}
{\\color{charcoal}${skillItems}}
`
    : '';

  return `\\documentclass[10pt, letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.6in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}

\\definecolor{charcoal}{RGB}{35, 35, 35}
\\definecolor{subtleGrey}{RGB}{110, 110, 110}

\\hypersetup{
    colorlinks=true,
    linkcolor=charcoal,
    urlcolor=charcoal,
}

\\titleformat{\\section}{\\normalsize\\bfseries\\uppercase}{}{0em}{}[{\\color{subtleGrey}\\hrule height 0.4pt}]
\\titlespacing*{\\section}{0pt}{10pt}{5pt}

\\pagestyle{empty}

\\begin{document}

\\begin{flushleft}
    {\\LARGE \\bfseries ${esc(p.fullName)}}\\\\[2pt]
    {\\large \\color{subtleGrey}${esc(p.jobTitle)}}\\\\[4pt]
    {\\small ${contactLine}}
\\end{flushleft}
\\vspace{2pt}

${summaryBlock}
${experienceBlock}
${projectsBlock}
${educationBlock}
${skillsBlock}

\\end{document}
`;
}
