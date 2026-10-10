import { NextResponse } from 'next/server';
import { getResumeById, addChatMessage } from '@/lib/db/resumeStore';
import { editResumeWithAi } from '@/lib/ai/engine';
import { computeResumeDiffs } from '@/lib/ai/diff';

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

    // 1. Record user prompt in chat
    await addChatMessage(id, { role: 'user', content: instruction });

    // 2. Perform AI structural edit (Gemini)
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

    // 3. Compute granular line-by-line diffs
    const diffs = computeResumeDiffs(resume.data, aiResult.data);

    // 4. Record assistant message with review prompt
    const changeCountText = `${diffs.length} suggested change${diffs.length !== 1 ? 's' : ''}`;
    const assistantMsg = await addChatMessage(id, {
      role: 'assistant',
      content: `${aiResult.explanation}\n\n👉 **Review ${changeCountText}**: Accept or reject each change line-by-line or accept all at once.`,
      suggestedActions: aiResult.suggestedActions,
    });

    return NextResponse.json({
      success: true,
      requiresReview: true,
      proposedData: aiResult.data,
      originalData: resume.data,
      diffs,
      explanation: aiResult.explanation,
      suggestedActions: aiResult.suggestedActions,
      latestMessage: assistantMsg,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
