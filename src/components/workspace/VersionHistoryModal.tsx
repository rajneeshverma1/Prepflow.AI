'use client';

import React from 'react';
import { X, History, RotateCcw, Clock, Sparkles } from 'lucide-react';
import { RevisionMeta } from '@/lib/types/resume';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisions: RevisionMeta[];
  currentVersion: number;
  onRestore: (version: number) => void;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  revisions,
  currentVersion,
  onRestore,
}: VersionHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#18181B] border border-[#E6E1D7] dark:border-[#27272A] rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#7C5CFF]/10 flex items-center justify-center text-[#7C5CFF]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Version History</h2>
              <p className="text-xs text-zinc-500">Track and restore previous AI prompts & resume snapshots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {revisions.map((rev) => {
            const isCurrent = rev.version === currentVersion;
            const formattedDate = new Date(rev.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={rev.id || rev.version}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-[#7C5CFF] bg-[#7C5CFF]/5'
                    : 'border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                      v{rev.version}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-bold text-[#7C5CFF] tracking-wider">
                        Current Active Version
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formattedDate}
                  </span>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 mb-2 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF] shrink-0 mt-0.5" />
                  <span>Prompt: "{rev.prompt || 'Manual Edit'}"</span>
                </p>

                {!isCurrent && (
                  <button
                    onClick={() => {
                      onRestore(rev.version);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-[#7C5CFF] hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" /> Restore this version
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
