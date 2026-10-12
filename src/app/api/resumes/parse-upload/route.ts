import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseResumeContent } from '@/lib/ai/parser';
import { editResumeWithAi } from '@/lib/ai/engine';
import { createResume, updateResumeData, getResumeById, addChatMessage } from '@/lib/db/resumeStore';
import { generateLatexSource } from '@/lib/latex/renderer';
import { compileLatexToPdf } from '@/lib/latex/compiler';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Extract selectable text from a PDF Buffer using pdf-parse
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || '';
  } catch (err: any) {
    console.warn('pdf-parse extraction failed:', err?.message || err);
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const textPrompt = formData.get('text') as string | null;
    const existingResumeId = formData.get('resumeId') as string | null;
    const instruction = (formData.get('instruction') as string | null)?.trim() || undefined;

    if (!file && !textPrompt) {
      return NextResponse.json(
        { success: false, error: 'No file or resume content was provided. Please choose a valid PDF file.' },
        { status: 400 }
      );
    }

    let extractedText = '';
    let fileName = 'Uploaded Resume';
    let originalPdfPath: string | undefined = undefined;

    // Generate or reuse resume ID
    const resumeId = existingResumeId || `resume-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (file) {
      fileName = file.name;

      // File size validation
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, error: `File size exceeds the 25MB limit. Please upload a smaller PDF.` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // 1. Save original PDF directly to public/uploads directory
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        const savedFileName = `${resumeId}-original-${Date.now()}.pdf`;
        const targetPath = path.join(uploadsDir, savedFileName);
        await fs.writeFile(targetPath, buffer);

        // Serve via API route ensuring immediate availability
        originalPdfPath = `/api/resumes/pdf/${savedFileName}`;

        // 2. Extract selectable text
        extractedText = await extractPdfText(buffer);

        // Clean page markers like "-- 1 of 2 --"
        if (extractedText) {
          extractedText = extractedText.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, ' ').trim();
        }

        // Fallback: raw binary string extraction if pdf-parse found nothing
        if (!extractedText || extractedText.trim().length < 10) {
          const rawStr = buffer.toString('binary');
          const strings = rawStr.match(/[\x20-\x7E\s]{4,}/g) || [];
          extractedText = strings.join(' ');
        }
      } else if (file.type.startsWith('image/')) {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        const ext = path.extname(file.name) || '.png';
        const savedFileName = `${resumeId}-original-${Date.now()}${ext}`;
        await fs.writeFile(path.join(uploadsDir, savedFileName), buffer);
        originalPdfPath = `/api/resumes/pdf/${savedFileName}`;
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

    parsedData.originalPdfPath = originalPdfPath;
    parsedData.isUploadedPdf = true;
    parsedData.originalFileName = fileName;

    // Apply prompt modification if instruction was provided with the upload
    let finalData = parsedData;
    let editExplanation = '';
    if (instruction) {
      try {
        const aiEdit = await editResumeWithAi(parsedData, instruction, parsedData.personal.jobTitle || undefined);
        if (aiEdit.success && aiEdit.data) {
          finalData = {
            ...aiEdit.data,
            originalPdfPath,
            isUploadedPdf: true,
            originalFileName: fileName,
          };
          editExplanation = aiEdit.explanation;
        }
      } catch (err: any) {
        console.warn('AI prompt execution on uploaded resume failed, proceeding with parsed data:', err?.message);
      }
    }

    // 4. Generate LaTeX source
    const texSource = generateLatexSource(finalData);

    // 5. Compile LaTeX to PDF
    const compileRes = await compileLatexToPdf(texSource, resumeId);
    const compiledPdfPath = compileRes.success ? compileRes.pdfRelativePath : undefined;

    // 6. Title formatting
    const title = finalData.personal.fullName && finalData.personal.fullName !== 'Applicant Name'
      ? `${finalData.personal.fullName} – Resume`
      : (fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Uploaded Resume');

    let resumeRecord;
    if (existingResumeId) {
      const existing = await getResumeById(existingResumeId);
      if (existing) {
        // Record user upload in chat
        const userMsg = instruction
          ? `Attached resume: ${fileName}\n\n${instruction}`
          : `Uploaded resume: ${fileName}`;
        await addChatMessage(existingResumeId, {
          role: 'user',
          content: userMsg,
        });

        // Record assistant response in chat
        const assistantMsg = instruction && editExplanation
          ? `Imported **${fileName}** and applied your prompt:\n\n${editExplanation}\n\nYour LaTeX source and PDF preview have been synchronized automatically.`
          : `Successfully imported and parsed **${fileName}**!\n\nAll details (contact info, work experience, education, projects, skills) have been converted to structured LaTeX code. Your live PDF preview has been synchronized.\n\nYou can now enter any prompts to modify or tailor your resume.`;

        await addChatMessage(existingResumeId, {
          role: 'assistant',
          content: assistantMsg,
          suggestedActions: [
            'Rewrite bullet points with STAR impact metrics',
            'Tailor resume for Senior Full-Stack role',
            'Shorten resume to 1 page',
            'Switch template to Modern',
          ],
        });

        resumeRecord = await updateResumeData(
          existingResumeId,
          finalData,
          instruction || `Uploaded resume: ${fileName}`,
          compiledPdfPath,
          texSource,
          originalPdfPath
        );
      } else {
        resumeRecord = await createResume({
          id: resumeId,
          title,
          targetRole: finalData.personal.jobTitle || 'Software Engineer',
          template: finalData.template || 'classic',
          initialData: finalData,
          texSource,
          originalPdfPath,
          pdfPath: compiledPdfPath,
        });
      }
    } else {
      resumeRecord = await createResume({
        id: resumeId,
        title,
        targetRole: finalData.personal.jobTitle || 'Software Engineer',
        template: finalData.template || 'classic',
        initialData: finalData,
        texSource,
        originalPdfPath,
        pdfPath: compiledPdfPath,
      });
    }

    return NextResponse.json({
      success: true,
      resumeId: resumeRecord.id,
      resume: resumeRecord,
      originalPdfPath,
      pdfPath: compiledPdfPath,
      texSource,
      compileResult: compileRes,
    });
  } catch (err: any) {
    console.error('Failed to parse uploaded resume:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process uploaded resume. Please check the file and try again.' },
      { status: 500 }
    );
  }
}
