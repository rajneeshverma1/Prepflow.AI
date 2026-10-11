import { NextResponse } from 'next/server';
import { getResumeById, updateResumeData, deleteResume, duplicateResume } from '@/lib/db/resumeStore';
import { generateLatexSource } from '@/lib/latex/renderer';
import { compileLatexToPdf } from '@/lib/latex/compiler';
import { resumeDataSchema } from '@/lib/schema/resume';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const resume = await getResumeById(id);
    if (!resume) {
      return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });
    }

    // Ensure LaTeX and PDF are generated if missing
    if (!resume.texSource) {
      resume.texSource = generateLatexSource(resume.data);
    }

    return NextResponse.json({ success: true, resume });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    
    // Handle duplication request
    if (body.action === 'duplicate') {
      const duplicated = await duplicateResume(id);
      return NextResponse.json({ success: true, resume: duplicated });
    }

    const existing = await (await import('@/lib/db/resumeStore')).getResumeById(id);
    // Preserve record-level template; only switch if explicitly provided in body
    const effectiveTemplate = body.template || validatedData.template || existing?.template || 'classic';
    const dataWithTemplate = { ...validatedData, template: effectiveTemplate as any };

    const texSource = body.texSource || generateLatexSource(dataWithTemplate);
    
    // Recompile PDF
    const compileRes = await compileLatexToPdf(texSource, id);
    const pdfPath = compileRes.success ? compileRes.pdfRelativePath : undefined;

    const updated = await updateResumeData(id, dataWithTemplate, body.prompt || 'Manual update', pdfPath, texSource);


    return NextResponse.json({
      success: true,
      resume: updated,
      compileResult: compileRes,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteResume(id);
    return NextResponse.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
