import { ResumeData } from '../../types/resume';
import { escapeLatex } from '../escape';

export function renderClassicTemplate(data: ResumeData): string {
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

  // Summary
  const summaryBlock = data.summary
    ? `
\\section*{Summary}
${esc(data.summary)}
\\vspace{6pt}
`
    : '';

  // Experience
  const experienceItems = data.experience
    .map((exp) => {
      const dates = `${esc(exp.startDate)} -- ${exp.current ? 'Present' : esc(exp.endDate)}`;
      const loc = exp.location ? ` \\hfill ${esc(exp.location)}` : '';
      const highlights = exp.highlights && exp.highlights.length > 0
        ? `
  \\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]
${exp.highlights.map((h) => `    \\item ${esc(h)}`).join('\n')}
  \\end{itemize}`
        : '';

      return `
\\textbf{${esc(exp.position)}} \\hfill ${dates} \\\\
\\textit{${esc(exp.company)}}${loc}
${highlights}
\\vspace{4pt}`;
    })
    .join('\n');

  const experienceBlock = experienceItems
    ? `
\\section*{Work Experience}
${experienceItems}
`
    : '';

  // Education
  const educationItems = data.education
    .map((edu) => {
      const dates = `${esc(edu.startDate)} -- ${esc(edu.endDate)}`;
      const gpa = edu.gpa ? ` (GPA: ${esc(edu.gpa)})` : '';
      const highlights = edu.highlights && edu.highlights.length > 0
        ? `\\\\ \\textit{Highlights: ${edu.highlights.map(esc).join(', ')}}`
        : '';

      return `
\\textbf{${esc(edu.institution)}} \\hfill ${dates} \\\\
${esc(edu.degree)}${edu.fieldOfStudy ? ` in ${esc(edu.fieldOfStudy)}` : ''}${gpa} ${highlights}
\\vspace{4pt}`;
    })
    .join('\n');

  const educationBlock = educationItems
    ? `
\\section*{Education}
${educationItems}
`
    : '';

  // Projects
  const projectItems = data.projects
    .map((proj) => {
      const titleLink = proj.link
        ? `\\href{${proj.link}}{\\textbf{${esc(proj.name)}}}`
        : `\\textbf{${esc(proj.name)}}`;
      const tech = proj.techStack && proj.techStack.length > 0
        ? ` \\hfill \\textit{${proj.techStack.map(esc).join(', ')}}`
        : '';
      const desc = proj.description ? `\\\\ ${esc(proj.description)}` : '';
      const highlights = proj.highlights && proj.highlights.length > 0
        ? `
  \\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]
${proj.highlights.map((h) => `    \\item ${esc(h)}`).join('\n')}
  \\end{itemize}`
        : '';

      return `
${titleLink}${tech}${desc}
${highlights}
\\vspace{4pt}`;
    })
    .join('\n');

  const projectsBlock = projectItems
    ? `
\\section*{Key Projects}
${projectItems}
`
    : '';

  // Skills
  const skillItems = data.skills
    .map((sk) => `\\textbf{${esc(sk.category)}:} ${sk.items.map(esc).join(', ')}`)
    .join(' \\\\\n');

  const skillsBlock = skillItems
    ? `
\\section*{Skills}
${skillItems}
`
    : '';

  // Certifications
  const certItems = data.certifications
    .map((c) => `\\textbf{${esc(c.name)}} -- ${esc(c.issuer)} (${esc(c.date)})`)
    .join(' \\\\\n');

  const certsBlock = certItems
    ? `
\\section*{Certifications}
${certItems}
`
    : '';

  return `\\documentclass[10pt, letterpaper]{article}
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

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{10pt}{6pt}

\\pagestyle{empty}

\\begin{document}

\\begin{center}
    {\\LARGE \\bfseries ${esc(p.fullName)}}\\\\[4pt]
    {\\large \\textit{${esc(p.jobTitle)}}}\\\\[4pt]
    ${contactLine}
\\end{center}

${summaryBlock}
${experienceBlock}
${educationBlock}
${projectsBlock}
${skillsBlock}
${certsBlock}

\\end{document}
`;
}
