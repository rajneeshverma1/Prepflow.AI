import fs from 'fs';
import path from 'path';
import { parseResumeContent } from '../src/lib/ai/parser';
import { generateLatexSource } from '../src/lib/latex/renderer';
import { compileLatexToPdf } from '../src/lib/latex/compiler';

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text || '';
}

async function run() {
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  const files = fs.existsSync(uploadsDir)
    ? fs.readdirSync(uploadsDir).filter((f) => f.endsWith('.pdf'))
    : [];
  const pdfFile = files.length > 0
    ? path.join(uploadsDir, files[0])
    : path.join(uploadsDir, 'resume-1791713373900-wt36s-original-1791713373901.pdf');

  if (!fs.existsSync(pdfFile)) {
    console.log('No test PDF found in public/uploads, skipping extraction test.');
    return;
  }

  const buffer = fs.readFileSync(pdfFile);
  const text = await extractPdfText(buffer);
  console.log('--- EXTRACTED TEXT LENGTH ---', text.length);

  const parsed = await parseResumeContent(text, 'Rajneesh_Verma_Resume.pdf');
  console.log('\n--- PARSED RESUME DETAILS ---');
  console.log('Name:', parsed.personal.fullName);
  console.log('Title:', parsed.personal.jobTitle);
  console.log('Email:', parsed.personal.email);
  console.log('Phone:', parsed.personal.phone);
  console.log('Location:', parsed.personal.location);
  console.log('Website:', parsed.personal.website);
  console.log('LinkedIn:', parsed.personal.linkedin);
  console.log('GitHub:', parsed.personal.github);
  console.log('Summary:', parsed.summary);

  console.log('\n--- WORK EXPERIENCE (' + parsed.experience.length + ') ---');
  parsed.experience.forEach((exp, idx) => {
    console.log(`[${idx + 1}] ${exp.position} @ ${exp.company} (${exp.startDate} - ${exp.endDate})`);
    exp.highlights.forEach(h => console.log('   • ' + h));
  });

  console.log('\n--- PROJECTS (' + parsed.projects.length + ') ---');
  parsed.projects.forEach((proj, idx) => {
    console.log(`[${idx + 1}] ${proj.name} [${(proj.techStack || []).join(', ')}]`);
    proj.highlights.forEach(h => console.log('   • ' + h));
  });

  console.log('\n--- EDUCATION (' + parsed.education.length + ') ---');
  parsed.education.forEach((edu, idx) => {
    console.log(`[${idx + 1}] ${edu.degree} @ ${edu.institution} (${edu.startDate} - ${edu.endDate})`);
  });

  console.log('\n--- SKILLS (' + parsed.skills.length + ') ---');
  parsed.skills.forEach((sk, idx) => {
    console.log(`[${idx + 1}] ${sk.category}: ${sk.items.join(', ')}`);
  });

  if (parsed.certifications?.length) {
    console.log('\n--- CERTIFICATIONS (' + parsed.certifications.length + ') ---');
    parsed.certifications.forEach((c, idx) => {
      console.log(`[${idx + 1}] ${c.name} -- ${c.issuer} (${c.date})`);
    });
  }

  // Now test LaTeX generation & compilation for all 4 templates
  for (const tpl of ['classic', 'modern', 'technical', 'minimal']) {
    console.log(`\n--- TESTING COMPILATION FOR TEMPLATE: ${tpl} ---`);
    const data = { ...parsed, template: tpl as any };
    const tex = generateLatexSource(data);
    const result = await compileLatexToPdf(tex, `test-compile-${tpl}`);
    console.log(`Result [${tpl}]:`, result.success ? 'SUCCESS (PDF generated)' : 'FAILED: ' + result.error);
    if (!result.success) {
      console.log('Failed LaTeX excerpt:\n', tex.substring(0, 500));
    }
  }
}

run().catch(console.error);
