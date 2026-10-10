'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Copy, Trash2, Edit3, ArrowUpRight, Sparkles, Clock, Check, FileText } from 'lucide-react';
import { ResumeData } from '@/lib/types/resume';

interface ResumeCardProps {
  id: string;
  title: string;
  targetRole?: string;
  template: string;
  updatedAt: string;
  pdfPath?: string;
  data: ResumeData;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export function ResumeCard({
  id,
  title,
  targetRole,
  template,
  updatedAt,
  pdfPath,
  data,
  onDuplicate,
  onDelete,
  onRename,
}: ResumeCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const formattedDate = new Date(updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onRename(id, newTitle.trim());
      setIsRenaming(false);
    }
  };

  return (
    <div className="group relative rounded-2xl border border-[#E2E4E9] dark:border-[#272A30] bg-white dark:bg-[#17191C] p-6 shadow-2xs hover:shadow-float transition-all hover:border-[#7C5CFF]/40 flex flex-col justify-between">
      <div>
        {/* Header bar with badge & actions */}
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#F7F7F9] dark:bg-zinc-800 text-[#17191C] dark:text-zinc-200 border border-[#E2E4E9] dark:border-zinc-700">
            {template}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-[#8A8F9B] hover:text-[#17191C] dark:hover:text-white hover:bg-[#F7F7F9] dark:hover:bg-zinc-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#1C1E22] border border-[#E2E4E9] dark:border-[#272A30] shadow-xl py-1 z-20 text-xs"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  onClick={() => {
                    setIsRenaming(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-[#17191C] dark:text-zinc-300 hover:bg-[#F7F7F9] dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Rename
                </button>
                <button
                  onClick={() => {
                    onDuplicate(id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-[#17191C] dark:text-zinc-300 hover:bg-[#F7F7F9] dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
                <button
                  onClick={() => {
                    onDelete(id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        {isRenaming ? (
          <form onSubmit={handleSaveTitle} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-2.5 py-1 text-sm rounded-lg border border-[#7C5CFF] bg-transparent text-[#17191C] dark:text-zinc-100 w-full focus:outline-hidden"
              autoFocus
            />
            <button type="submit" className="p-1 text-[#7C5CFF]">
              <Check className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <h3 className="font-bold text-base text-[#17191C] dark:text-zinc-100 mb-1.5 group-hover:text-[#7C5CFF] transition-colors line-clamp-1">
            {title}
          </h3>
        )}

        {/* Target role badge */}
        <p className="text-xs text-[#595E68] dark:text-zinc-400 mb-4 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" />
          <span>{targetRole || data.personal.jobTitle || 'Software Engineer'}</span>
        </p>
      </div>

      {/* Footer bar */}
      <div className="pt-3.5 border-t border-[#E2E4E9] dark:border-[#272A30] flex items-center justify-between">
        <span className="text-[11px] text-[#8A8F9B] flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formattedDate}
        </span>

        <Link
          href={`/editor/${id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C5CFF] hover:underline"
        >
          <span>Open Editor</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
