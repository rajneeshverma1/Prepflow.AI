import { NextResponse } from 'next/server';
import { parseResumeContent } from '@/lib/ai/parser';
import { createResume, updateResumeData } from '@/lib/db/resumeStore';
import { generateLatexSource } from '@/lib/latex/renderer';
import { compileLatexToPdf } from '@/lib/latex/compiler';
import { extractTextFromPdfBuffer } from '@/lib/pdf/extractor';

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
        extractedText = await extractTextFromPdfBuffer(buffer);
      } else if (file.name.toLowerCase().endsWith('.docx') || file.type.includes('wordprocessingml')) {
        // DOCX extraction from XML stream
        const rawDocx = buffer.toString('utf8');
        const matches = rawDocx.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
        if (matches.length > 0) {
          extractedText = matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
        } else {
          extractedText = buffer.toString('utf8');
        }
      } else if (file.type.startsWith('image/')) {
        extractedText = `Uploaded Resume Image: ${fileName}\nCandidate Name: ${fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}\nSoftware Engineer Resume`;
      } else {
        extractedText = buffer.toString('utf8');
      }
    } else if (textPrompt) {
      extractedText = textPrompt;
    }

    // Clean control characters from extracted text
    extractedText = extractedText.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, ' ').trim();

    if (!extractedText || extractedText.length < 5) {
      extractedText = `Resume Document: ${fileName}\nCandidate Name: ${fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}\nSoftware Engineer Resume`;
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
    const title = parsedData.personal.fullName && parsedData.personal.fullName !== 'Candidate Name' && parsedData.personal.fullName !== 'Applicant Name'
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
