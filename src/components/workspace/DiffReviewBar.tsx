'use client';

import React from 'react';
import { Sparkles, Check, X, CheckCheck, XCircle, ChevronRight, FileText } from 'lucide-react';
import { ResumeDiffItem } from '@/lib/ai/diff';

interface DiffReviewBarProps {
  diffs: ResumeDiffItem[];
  onAcceptItem: (id: string) => void;
  onRejectItem: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onApply: () => void;
  isApplying?: boolean;
}

export function DiffReviewBar({
  diffs,
  onAcceptItem,
  onRejectItem,
  onAcceptAll,
  onRejectAll,
  onApply,
  isApplying,
}: DiffReviewBarProps) {
  if (diffs.length === 0) return null;

  const pendingCount = diffs.filter((d) => d.status === 'pending').length;
  const acceptedCount = diffs.filter((d) => d.status === 'accepted').length;
  const rejectedCount = diffs.filter((d) => d.status === 'rejected').length;

  return (
    <div className="bg-white border-b border-[#E2E4E9] shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Top Header Controls */}
      <div className="px-4 py-2.5 bg-[#FAF5FF] border-b border-[#E9D5FF] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#7C5CFF] text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#17191C]">
              Review AI Suggested Changes
            </h4>
            <p className="text-[11px] text-[#595E68]">
              {diffs.length} change{diffs.length !== 1 ? 's' : ''} proposed • {pendingCount} pending • {acceptedCount} accepted • {rejectedCount} rejected
            </p>
          </div>
        </div>

        {/* Global Batch Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAcceptAll}
            disabled={isApplying}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs disabled:opacity-50"
            title="Accept all suggestions"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Accept All</span>
          </button>
          <button
            onClick={onRejectAll}
            disabled={isApplying}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-200 text-[#17191C] hover:bg-zinc-300 transition-colors shadow-2xs disabled:opacity-50"
            title="Reject all suggestions"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject All</span>
          </button>
          {acceptedCount > 0 && (
            <button
              onClick={onApply}
              disabled={isApplying}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#7C5CFF] text-white hover:bg-[#6a4ee0] transition-colors shadow-2xs disabled:opacity-50"
            >
              <span>{isApplying ? 'Compiling...' : 'Apply Accepted & Compile'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Changes List */}
      <div className="max-h-72 overflow-y-auto divide-y divide-[#F0F1F5] p-2 space-y-2">
        {diffs.map((diff) => {
          const isPending = diff.status === 'pending';
          const isAccepted = diff.status === 'accepted';
          const isRejected = diff.status === 'rejected';

          return (
            <div
              key={diff.id}
              className={`p-3 rounded-xl transition-all border ${
                isAccepted
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : isRejected
                  ? 'bg-zinc-50 border-zinc-200 opacity-60'
                  : 'bg-white border-[#E2E4E9] hover:border-[#7C5CFF]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F7F7F9] text-[#595E68] border border-[#E2E4E9]">
                  {diff.title}
                </span>

                <div className="flex items-center gap-1.5">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => onAcceptItem(diff.id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        title="Accept this change"
                      >
                        <Check className="w-3 h-3" /> Accept
                      </button>
                      <button
                        onClick={() => onRejectItem(diff.id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        title="Reject this change"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </>
                  ) : isAccepted ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-md">
                      <Check className="w-3 h-3" /> Accepted
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1 bg-zinc-200 px-2 py-0.5 rounded-md">
                      <X className="w-3 h-3" /> Rejected
                    </span>
                  )}
                </div>
              </div>

              {/* Text Diff View: Strikethrough old, Green highlight new (Google Docs Style) */}
              <div className="text-xs leading-relaxed font-sans space-y-1">
                {diff.type === 'modify' && (
                  <div>
                    <span className="text-[11px] font-semibold text-red-600 block mb-0.5">Original:</span>
                    <p className="line-through text-red-700 bg-red-50/80 p-1.5 rounded-lg border border-red-200/60 font-mono text-[11px]">
                      {diff.oldValue}
                    </p>
                  </div>
                )}
                {diff.type === 'remove' && (
                  <div>
                    <span className="text-[11px] font-semibold text-red-600 block mb-0.5">Removed:</span>
                    <p className="line-through text-red-700 bg-red-50/80 p-1.5 rounded-lg border border-red-200/60 font-mono text-[11px]">
                      {diff.oldValue}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-[11px] font-semibold text-emerald-700 block mb-0.5">
                    {diff.type === 'add' ? 'Added:' : 'Suggested Replacement:'}
                  </span>
                  <p className="text-emerald-900 bg-emerald-50/90 p-1.5 rounded-lg border border-emerald-200/80 font-sans text-xs">
                    {diff.newValue}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
