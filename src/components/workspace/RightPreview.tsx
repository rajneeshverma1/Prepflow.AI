'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Copy,
  Code,
  FileText,
  Check,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Play,
  Upload,
} from 'lucide-react';
import { ResumeData } from '@/lib/types/resume';

interface RightPreviewProps {
  pdfUrl?: string;
  originalPdfPath?: string;
  pdfPath?: string;
  texSource: string;
  data: ResumeData;
  isCompiling: boolean;
  onDownloadPdf: () => void;
  onDownloadTex: () => void;
  onTexSourceSave?: (newSource: string) => void;
  /** Live change callback */
  onChangeTexSource?: (newSource: string) => void;
  onUploadPdf?: (file: File) => void;
  isUploadingPdf?: boolean;
}

export function RightPreview({
  pdfUrl,
  originalPdfPath,
  pdfPath,
  texSource,
  data,
  isCompiling,
  onTexSourceSave,
  onChangeTexSource,
  onUploadPdf,
  isUploadingPdf,
}: RightPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState<'pdf' | 'latex'>('pdf');
  const [copied, setCopied] = useState(false);
  const [editedTex, setEditedTex] = useState(texSource);
  const isDirty = editedTex !== texSource;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync editedTex when parent updates texSource
  useEffect(() => {
    setEditedTex(texSource);
  }, [texSource]);

  // Active PDF URL: prioritize specifically active pdfUrl (from new upload or compile), then originalPdfPath, then pdfPath
  const activePdf = pdfUrl || originalPdfPath || pdfPath;

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(editedTex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onTexSourceSave?.(editedTex);
    setActiveTab('pdf');
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 15, 175));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 15, 50));
  const handleResetZoom = () => setZoom(100);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onUploadPdf?.(file);
      e.target.value = '';
    }
  };

  return (
    <aside className="w-full h-full bg-[#F7F7F9] flex flex-col shrink-0 overflow-hidden">
      {/* Hidden file input for uploading replacement PDF */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Top preview toolbar */}
      <div className="h-11 border-b border-[#E2E4E9] bg-white px-3 sm:px-4 flex items-center justify-between text-xs gap-2 shrink-0">
        {/* Toggle PDF Preview vs LaTeX Source */}
        <div className="flex items-center gap-1 bg-[#F7F7F9] p-0.5 rounded-full border border-[#E2E4E9]">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-medium transition-all ${
              activeTab === 'pdf'
                ? 'bg-white text-[#17191C] shadow-2xs font-semibold'
                : 'text-[#595E68] hover:text-[#17191C]'
            }`}
            title="View current PDF resume preview"
          >
            <FileText className="w-3.5 h-3.5 text-[#7C5CFF]" />
            <span>PDF Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('latex')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-medium transition-all ${
              activeTab === 'latex'
                ? 'bg-white text-[#17191C] shadow-2xs font-semibold'
                : 'text-[#595E68] hover:text-[#17191C]'
            }`}
            title="View and edit raw LaTeX source code"
          >
            <Code className="w-3.5 h-3.5 text-[#17191C]" />
            <span>LaTeX Source</span>
          </button>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Controls for PDF view */}
          {activeTab === 'pdf' && (
            <div className="hidden sm:flex items-center gap-1 text-[#595E68] bg-[#F7F7F9] px-1 py-0.5 rounded-full border border-[#E2E4E9]">
              <button
                onClick={handleZoomOut}
                className="p-1 rounded-full hover:bg-white hover:text-[#17191C]"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 rounded text-[11px] font-mono hover:bg-white"
              >
                {zoom}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1 rounded-full hover:bg-white hover:text-[#17191C]"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Upload PDF Button */}
          {onUploadPdf && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPdf}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E2E4E9] bg-white text-[#17191C] font-medium text-xs hover:border-[#7C5CFF] hover:text-[#7C5CFF] transition-all disabled:opacity-50"
              title="Upload a PDF to replace current resume"
            >
              {isUploadingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7C5CFF]" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-[#7C5CFF]" />
              )}
              <span className="hidden md:inline">
                {isUploadingPdf ? 'Parsing...' : 'Upload PDF'}
              </span>
            </button>
          )}

          {/* Actions for LaTeX view */}
          {activeTab === 'latex' ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyLatex}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E2E4E9] bg-white text-[#17191C] font-medium text-xs hover:border-[#7C5CFF]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              {isDirty && (
                <button
                  onClick={handleApply}
                  disabled={isCompiling}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#7C5CFF] text-white font-semibold text-xs hover:bg-[#6a4ee0] disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Play className="w-3 h-3" />
                  <span>Apply &amp; Compile</span>
                </button>
              )}
            </div>
          ) : (
            activePdf && (
              <a
                href={activePdf}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full border border-[#E2E4E9] bg-white text-[#595E68] hover:text-[#7C5CFF] hover:border-[#7C5CFF]"
                title="Open PDF in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )
          )}
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-start relative">
        {/* Compilation overlay */}
        {isCompiling && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-20 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-[#7C5CFF] animate-spin" />
            <span className="text-xs font-semibold text-[#17191C]">Compiling LaTeX PDF with Tectonic...</span>
          </div>
        )}

        {/* Tab 1: Single Unified PDF Preview */}
        {activeTab === 'pdf' && (
          <div className="w-full flex flex-col items-center gap-3">
            {activePdf ? (
              <div
                key={activePdf}
                className="bg-white shadow-2xl rounded-xs transition-all duration-150 origin-top overflow-hidden border border-[#E2E4E9]"
                style={{
                  width: `${(8.5 * 96 * zoom) / 100}px`,
                  height: `${(11 * 96 * zoom) / 100}px`,
                  maxWidth: '100%',
                }}
              >
                <iframe
                  key={activePdf}
                  src={`${activePdf}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full border-none"
                  title="Resume PDF Preview"
                />
              </div>
            ) : (
              /* Fallback card preview when no compiled PDF exists yet */
              <div
                className="flex flex-col gap-4 items-center"
                style={{ width: `${(8.5 * 96 * zoom) / 100}px`, maxWidth: '100%' }}
              >
                <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-1">
                      PDF preview not yet available
                    </p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Upload a PDF resume or click <strong>Recompile</strong> in the header to generate the preview.
                    </p>
                  </div>
                </div>

                {/* Resume information card preview */}
                <div
                  className="bg-white text-[#17191C] shadow-2xl p-8 rounded-xs transition-all origin-top border border-[#E2E4E9] w-full"
                  style={{ minHeight: `${(11 * 96 * zoom) / 100}px` }}
                >
                  <div className="text-center border-b border-[#E2E4E9] pb-4 mb-4">
                    <h1 className="text-2xl font-bold tracking-tight text-[#17191C]">
                      {data.personal.fullName || 'Applicant Name'}
                    </h1>
                    <p className="text-sm font-medium text-[#595E68] mb-1">{data.personal.jobTitle}</p>
                    <p className="text-xs text-[#8A8F9B]">
                      {[data.personal.email, data.personal.phone, data.personal.location].filter(Boolean).join(' • ')}
                    </p>
                  </div>

                  {data.summary && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C5CFF] border-b border-[#E2E4E9] pb-1 mb-2">
                        Summary
                      </h3>
                      <p className="text-xs text-[#595E68] leading-relaxed">{data.summary}</p>
                    </div>
                  )}

                  {data.experience && data.experience.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C5CFF] border-b border-[#E2E4E9] pb-1 mb-2">
                        Work Experience
                      </h3>
                      <div className="space-y-3">
                        {data.experience.map((exp) => (
                          <div key={exp.id}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold">{exp.position}</span>
                              <span className="text-[#8A8F9B] font-mono text-[11px]">
                                {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[#595E68] mb-1">{exp.company}</p>
                            <ul className="list-disc list-inside text-[11px] text-[#595E68] space-y-0.5">
                              {exp.highlights.map((h, i) => (
                                <li key={i}>{h}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.education && data.education.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C5CFF] border-b border-[#E2E4E9] pb-1 mb-2">
                        Education
                      </h3>
                      <div className="space-y-2">
                        {data.education.map((edu) => (
                          <div key={edu.id}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold">{edu.institution}</span>
                              <span className="text-[#8A8F9B] font-mono text-[11px]">
                                {edu.startDate} – {edu.endDate}
                              </span>
                            </div>
                            <p className="text-xs text-[#595E68]">
                              {edu.degree}
                              {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.skills && data.skills.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C5CFF] border-b border-[#E2E4E9] pb-1 mb-2">
                        Skills
                      </h3>
                      <div className="text-xs space-y-1">
                        {data.skills.map((s) => (
                          <p key={s.id}>
                            <span className="font-semibold">{s.category}: </span>
                            <span className="text-[#595E68]">{s.items.join(', ')}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Editable LaTeX Source */}
        {activeTab === 'latex' && (
          <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-[#E2E4E9] shadow-inner overflow-hidden">
            {isDirty && (
              <div className="px-3 py-1.5 bg-[#7C5CFF]/10 border-b border-[#7C5CFF]/20 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-medium text-[#7C5CFF]">
                  Unsaved changes — click &quot;Apply &amp; Compile&quot; to update the PDF preview
                </span>
                <button
                  onClick={() => setEditedTex(texSource)}
                  className="text-[11px] text-[#595E68] hover:text-red-500 font-medium"
                >
                  Reset
                </button>
              </div>
            )}
            <textarea
              value={editedTex}
              onChange={(e) => {
                setEditedTex(e.target.value);
                onChangeTexSource?.(e.target.value);
              }}
              spellCheck={false}
              className="flex-1 w-full p-4 font-mono text-xs text-[#17191C] bg-white resize-none outline-none leading-relaxed"
              placeholder="LaTeX source code..."
            />
          </div>
        )}
      </div>
    </aside>
  );
}
