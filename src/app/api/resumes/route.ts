import { NextResponse } from 'next/server';
import { getAllResumes, createResume } from '@/lib/db/resumeStore';
import { compileLatexToPdf } from '@/lib/latex/compiler';

export async function GET() {
  try {
    const resumes = await getAllResumes();
    return NextResponse.json({ success: true, resumes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const newResume = await createResume({
      title: body.title || 'Untitled Resume',
      targetRole: body.targetRole,
      template: body.template || 'classic',
      initialData: body.initialData,
      texSource: body.texSource,
      originalPdfPath: body.originalPdfPath,
    });

    if (newResume.texSource) {
      const compileRes = await compileLatexToPdf(newResume.texSource, newResume.id);
      if (compileRes.success && compileRes.pdfRelativePath) {
        newResume.pdfPath = compileRes.pdfRelativePath;
      }
    }

    return NextResponse.json({ success: true, resume: newResume }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create resume' },
      { status: 500 }
    );
  }
}
