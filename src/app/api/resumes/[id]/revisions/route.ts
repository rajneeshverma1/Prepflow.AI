import { NextResponse } from 'next/server';
import { getResumeById, updateResumeData } from '@/lib/db/resumeStore';
import { generateLatexSource } from '@/lib/latex/renderer';
import { compileLatexToPdf } from '@/lib/latex/compiler';

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
    return NextResponse.json({ success: true, revisions: resume.revisions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const versionNumber = body.version;

    const resume = await getResumeById(id);
    if (!resume) {
      return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });
    }

    const targetRevision = resume.revisions?.find((r: any) => r.version === versionNumber);
    if (!targetRevision) {
      return NextResponse.json({ success: false, error: `Revision version ${versionNumber} not found` }, { status: 404 });
    }

    // Restore dataset from revision snapshot
    const restoredData = targetRevision.data;
    const texSource = generateLatexSource(restoredData);
    const compileRes = await compileLatexToPdf(texSource, id);

    const updated = await updateResumeData(
      id,
      restoredData,
      `Restored version ${versionNumber}`,
      compileRes.success ? compileRes.pdfRelativePath : undefined
    );

    return NextResponse.json({
      success: true,
      resume: updated,
      message: `Successfully restored version ${versionNumber}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
