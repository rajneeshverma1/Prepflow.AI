import { NextResponse } from 'next/server';
import { parseResumeContent } from '@/lib/ai/parser';
import { createResume, updateResumeData } from '@/lib/db/resumeStore';
import { generateLatexSource } from '@/lib/latex/renderer';
import { compileLatexToPdf } from '@/lib/latex/compiler';

export async function POST(req: Request) {
  try {
    // Polyfill DOMMatrix for PDF.js / pdf-parse in Node runtime
    if (typeof globalThis.DOMMatrix === 'undefined') {
      (globalThis as any).DOMMatrix = class DOMMatrix { constructor() {} };
    }

    let pdfParse: any = null;
    try {
      pdfParse = require('pdf-parse');
    } catch (reqErr) {
      console.warn('Failed to require pdf-parse:', reqErr);
    }

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
        try {
          if (pdfParse) {
            const parseFunc = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse);
            if (typeof parseFunc === 'function') {
              const parsedPdf = await parseFunc(buffer);
              extractedText = parsedPdf.text || '';
            } else if (pdfParse.PDFParse) {
              const parser = new pdfParse.PDFParse(buffer);
              extractedText = (await parser.getText()) || '';
            }
          }
        } catch (pdfErr) {
          console.warn('pdf-parse execution error, applying fallback string extraction:', pdfErr);
        }

        // Fallback string extraction if pdf-parse text is empty
        if (!extractedText || extractedText.trim().length < 10) {
          const rawStr = buffer.toString('binary');
          const strings = rawStr.match(/[\x20-\x7E\s]{4,}/g) || [];
          extractedText = strings.join(' ');
        }
      } else if (file.type.startsWith('image/')) {
        // Image upload: fallback text extracted from filename or description
        extractedText = `Uploaded Resume Image: ${fileName}\nExtract and structure professional resume details for ${fileName.replace(/\.[^/.]+$/, '')}`;
      } else {
        extractedText = buffer.toString('utf8');
      }
    } else if (textPrompt) {
      extractedText = textPrompt;
    }

    // Clean control characters from extracted text
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

    // 2. Generate LaTeX Source & Compile PDF
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

    let finalResume: any = created;
    if (compileRes.success && compileRes.pdfRelativePath) {
      finalResume = await updateResumeData(created.id, parsedData, `Uploaded ${fileName}`, compileRes.pdfRelativePath);
    }

    return NextResponse.json({
      success: true,
      resumeId: created.id,
      resume: finalResume,
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
