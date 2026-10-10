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

    let inputTexSource: string | undefined = undefined;
    try {
      const body = await request.json();
      if (body && typeof body.texSource === 'string' && body.texSource.trim().length > 0) {
        inputTexSource = body.texSource;
      }
    } catch {
      // Body was empty or not JSON
    }

    const texSource = inputTexSource || resume.texSource || generateLatexSource(resume.data);
    const compileRes = await compileLatexToPdf(texSource, id);

    if (compileRes.success && compileRes.pdfRelativePath) {
      resume.texSource = texSource;
      resume.pdfPath = compileRes.pdfRelativePath;
      await updateResumeData(id, resume.data, 'Recompiled LaTeX PDF', compileRes.pdfRelativePath);
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
