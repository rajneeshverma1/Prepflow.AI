import { NextResponse } from 'next/server';
import { getResumeById, updateResumeData } from '@/lib/db/resumeStore';
import { generateLatexSource } from '@/lib/latex/renderer';
import { compileLatexToPdf } from '@/lib/latex/compiler';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const resume = await getResumeById(id);
    if (!resume) {
      return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });
    }

    const texSource = generateLatexSource(resume.data);
    const compileRes = await compileLatexToPdf(texSource, id);

    if (compileRes.success && compileRes.pdfRelativePath) {
      await updateResumeData(id, resume.data, 'Recompiled PDF', compileRes.pdfRelativePath);
    }

    return NextResponse.json({
      success: compileRes.success,
      pdfPath: compileRes.pdfRelativePath,
      texSource,
      error: compileRes.error,
      latexLogs: compileRes.latexLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
