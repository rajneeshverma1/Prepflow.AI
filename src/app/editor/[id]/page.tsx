import { Suspense } from 'react';
import { EditorClient } from './EditorClient';

export const instant = false;

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#121214]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Loading editor...</p>
          </div>
        </div>
      }
    >
      <EditorClient id={id} />
    </Suspense>
  );
}
