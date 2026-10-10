import { NextResponse } from 'next/server';
import { getResumeById, updateResumeData, addChatMessage } from '@/lib/db/resumeStore';
import { editResumeWithAi } from '@/lib/ai/engine';
import { generateLatexSource } from '@/lib/latex/renderer';
import { compileLatexToPdf } from '@/lib/latex/compiler';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const instruction = body.instruction?.trim();

    if (!instruction) {
      return NextResponse.json({ success: false, error: 'Instruction prompt is required' }, { status: 400 });
    }

    const resume = await getResumeById(id);
    if (!resume) {
      return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });
    }

    // 1. Record user's prompt in chat history
    await addChatMessage(id, { role: 'user', content: instruction });

    // 2. Perform AI structural edit
    const aiResult = await editResumeWithAi(resume.data, instruction, resume.targetRole || undefined);

    if (!aiResult.success || !aiResult.data) {
      const errorMessage = aiResult.error || 'AI edit failed to generate valid data.';
      await addChatMessage(id, {
        role: 'assistant',
        content: `⚠️ ${errorMessage}`,
        isError: true,
      });
      return NextResponse.json({ success: false, error: errorMessage }, { status: 422 });
    }

    // 3. Render LaTeX & Compile PDF
    const texSource = generateLatexSource(aiResult.data);
    const compileRes = await compileLatexToPdf(texSource, id);

    // 4. Save revision
    const updatedResume = await updateResumeData(
      id,
      aiResult.data,
      instruction,
      compileRes.success ? compileRes.pdfRelativePath : undefined
    );

    // 5. Record assistant explanation in chat
    let assistantMessageContent = `${aiResult.explanation}`;
    if (!compileRes.success) {
      assistantMessageContent += `\n\n⚠️ *PDF compilation note*: ${compileRes.error}`;
    }

    const assistantMsg = await addChatMessage(id, {
      role: 'assistant',
      content: assistantMessageContent,
      suggestedActions: aiResult.suggestedActions,
    });

    return NextResponse.json({
      success: true,
      resume: updatedResume,
      compileResult: compileRes,
      latestMessage: assistantMsg,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
