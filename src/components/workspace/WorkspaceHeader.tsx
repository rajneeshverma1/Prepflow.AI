'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Code2, History, Check, RefreshCw, PanelLeft } from 'lucide-react';
import { TemplateId } from '@/lib/types/resume';

interface WorkspaceHeaderProps {
  title: string;
  template: TemplateId;
  onUpdateTitle: (newTitle: string) => void;
  onUpdateTemplate: (template: TemplateId) => void;
  onOpenRevisions: () => void;
  onOpenLatex: () => void;
  onDownloadPdf: () => void;
  isCompiling: boolean;
  onManualCompile: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function WorkspaceHeader({
  title,
  template,
  onUpdateTitle,
  onUpdateTemplate,
  onOpenRevisions,
  onOpenLatex,
  onDownloadPdf,
  isCompiling,
  onManualCompile,
  isSidebarOpen,
  onToggleSidebar,
}: WorkspaceHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleValue.trim()) {
      onUpdateTitle(titleValue.trim());
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-[#E2E4E9] bg-white/90 backdrop-blur-md px-4 flex items-center justify-between">
      {/* Left: Back, Sidebar Toggle & Title */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          className="p-1.5 rounded-lg border border-[#E2E4E9] bg-white text-[#17191C] hover:bg-[#F7F7F9] transition-colors"
          title="Back to Home"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isSidebarOpen
                ? 'border-[#7C5CFF] bg-[#7C5CFF]/10 text-[#7C5CFF]'
                : 'border-[#E2E4E9] bg-white text-[#595E68] hover:text-[#17191C] hover:bg-[#F7F7F9]'
            }`}
            title={isSidebarOpen ? 'Close Resume Form Sidebar' : 'Open Resume Form Sidebar'}
          >
            <PanelLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{isSidebarOpen ? 'Hide Form' : 'Edit Form'}</span>
          </button>
        )}

        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              className="px-2 py-0.5 text-sm font-semibold rounded border border-[#7C5CFF] bg-transparent text-[#17191C] focus:outline-hidden"
              autoFocus
            />
            <button type="submit" className="p-1 text-[#7C5CFF]">
              <Check className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="font-bold text-sm text-[#17191C] hover:text-[#7C5CFF] transition-colors flex items-center gap-2"
          >
            <span>{title}</span>
            <span className="text-[10px] text-[#8A8F9B] font-normal border border-[#E2E4E9] px-1.5 py-0.5 rounded">
              Edit
            </span>
          </button>
        )}
      </div>

      {/* Center: Template & Recompile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-[#F7F7F9] border border-[#E2E4E9] rounded-full p-1 text-xs">
          <span className="text-[#8A8F9B] text-[11px] px-2 font-medium">Template:</span>
          {(['classic', 'modern', 'technical'] as TemplateId[]).map((t) => (
            <button
              key={t}
              onClick={() => onUpdateTemplate(t)}
              className={`px-3 py-1 rounded-full capitalize font-medium transition-all text-xs ${
                template === t
                  ? 'bg-[#17191C] text-white shadow-xs'
                  : 'text-[#595E68] hover:text-[#17191C]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={onManualCompile}
          disabled={isCompiling}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E2E4E9] bg-white text-xs font-medium text-[#17191C] hover:bg-[#F7F7F9] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin text-[#7C5CFF]' : ''}`} />
          <span>{isCompiling ? 'Compiling...' : 'Recompile'}</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenRevisions}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E4E9] bg-white text-xs font-medium text-[#595E68] hover:bg-[#F7F7F9]"
          title="Version history"
        >
          <History className="w-3.5 h-3.5 text-[#8A8F9B]" />
          <span className="hidden sm:inline">History</span>
        </button>

        <button
          onClick={onOpenLatex}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E4E9] bg-white text-xs font-medium text-[#595E68] hover:bg-[#F7F7F9]"
          title="View LaTeX source code"
        >
          <Code2 className="w-3.5 h-3.5 text-[#8A8F9B]" />
          <span className="hidden sm:inline">LaTeX Source</span>
        </button>

        <button
          onClick={onDownloadPdf}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#17191C] text-white text-xs font-medium shadow-xs transition-transform hover:-translate-y-px"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </button>
      </div>
    </header>
  );
}
