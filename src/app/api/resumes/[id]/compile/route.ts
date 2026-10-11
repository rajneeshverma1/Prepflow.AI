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

    // Allow caller to supply a custom texSource (e.g. manually edited LaTeX)
    let texSource: string;
    try {
      const body = await request.json().catch(() => ({}));
      texSource = (body?.texSource as string) || resume.texSource || generateLatexSource(resume.data);
    } catch {
      texSource = resume.texSource || generateLatexSource(resume.data);
    }

    const compileRes = await compileLatexToPdf(texSource, id);

    if (compileRes.success && compileRes.pdfRelativePath) {
      // Preserve the top-level template — never overwrite it with schema default
      const dataToSave = { ...resume.data, template: (resume.template as any) || resume.data.template };
      await updateResumeData(id, dataToSave, 'Recompiled PDF', compileRes.pdfRelativePath, texSource, resume.originalPdfPath);
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
