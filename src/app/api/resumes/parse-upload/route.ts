import { NextResponse } from 'next/server';
import { parseResumeContent } from '@/lib/ai/parser';
import { createResume, updateResumeData } from '@/lib/db/resumeStore';
import { generateLatexSource } from '@/lib/latex/renderer';
import { compileLatexToPdf } from '@/lib/latex/compiler';

/**
 * Extract text from a PDF Buffer using pdfjs-dist (pure JS, no native deps).
 * pdfjs-dist v5 is ESM-only so we use dynamic import().
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic ESM import of pdfjs-dist legacy build (works in Node server routes)
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);
    const pdfjsLib = pdfjs.default ?? pdfjs;

    // Disable worker for Node.js server-side usage
    pdfjsLib.GlobalWorkerOptions = pdfjsLib.GlobalWorkerOptions ?? {};
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

    const uint8 = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true });
    const pdf = await loadingTask.promise;

    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      textParts.push(pageText);
    }
    return textParts.join('\n').trim();
  } catch (err) {
    console.warn('pdfjs-dist extraction failed, using binary fallback:', err);
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const textPrompt = formData.get('text') as string | null;

    let extractedText = '';
    let fileName = 'Uploaded Resume';

    if (file) {
      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // Try pdfjs-dist first (pure JS, no native deps)
        extractedText = await extractPdfText(buffer);

        // Clean page markers like "-- 1 of 2 --"
        if (extractedText) {
          extractedText = extractedText.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, ' ').trim();
        }

        // Fallback: raw binary string extraction if pdfjs found nothing
        if (!extractedText || extractedText.trim().length < 10) {
          const rawStr = buffer.toString('binary');
          const strings = rawStr.match(/[\x20-\x7E\s]{4,}/g) || [];
          extractedText = strings.join(' ');
        }
      } else if (file.type.startsWith('image/')) {
        extractedText = `Uploaded Resume Image: ${fileName}\nExtract and structure professional resume details for ${fileName.replace(/\.[^/.]+$/, '')}`;
      } else {
        // Plain text / docx fallback
        extractedText = buffer.toString('utf8');
      }
    } else if (textPrompt) {
      extractedText = textPrompt;
    }

    // Sanitize control characters
    extractedText = extractedText.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, ' ').trim();

    if (!extractedText || extractedText.length < 5) {
      extractedText = `Resume Document: ${fileName}\nCandidate Name: ${fileName.replace(/\.[^/.]+$/, '')}\nSoftware Engineer Resume`;
    }

    // 1. AI Parsing into structured ResumeData JSON
    let parsedData;
    try {
      parsedData = await parseResumeContent(extractedText, fileName);
    } catch (parseErr) {
      console.warn('AI Parsing error, using safe fallback parser:', parseErr);
      parsedData = await parseResumeContent(`Resume of ${fileName}`, fileName);
    }

    // 2. Generate LaTeX Source & Compile PDF (tectonic optional)
    const texSource = generateLatexSource(parsedData);
    const title = parsedData.personal.fullName && parsedData.personal.fullName !== 'Applicant Name'
      ? `${parsedData.personal.fullName} – Resume`
      : (fileName.replace(/\.[^/.]+$/, '') || 'Uploaded Resume');

    const created = await createResume({
      title,
      targetRole: parsedData.personal.jobTitle || 'Software Engineer',
      template: parsedData.template || 'classic',
      initialData: parsedData,
    });

    const compileRes = await compileLatexToPdf(texSource, created.id);

    if (compileRes.success && compileRes.pdfRelativePath) {
      await updateResumeData(created.id, parsedData, `Uploaded ${fileName}`, compileRes.pdfRelativePath);
    } else {
      // Even if tectonic is missing, still store texSource for LaTeX view
      await updateResumeData(created.id, parsedData, `Uploaded ${fileName}`, undefined);
    }

    return NextResponse.json({
      success: true,
      resumeId: created.id,
      resume: created,
      compileResult: compileRes,
    });
  } catch (err: any) {
    console.error('Failed to parse uploaded resume:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process uploaded resume. Please try again.' },
      { status: 500 }
    );
  }
}
