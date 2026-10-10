'use client';

import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Copy, Code, FileText, Check, ExternalLink, RefreshCw, AlertTriangle, Play } from 'lucide-react';
import { ResumeData } from '@/lib/types/resume';

interface RightPreviewProps {
  pdfPath?: string;
  texSource: string;
  data: ResumeData;
  isCompiling: boolean;
  onDownloadPdf: () => void;
  onDownloadTex: () => void;
  /** Called when user applies manually edited LaTeX */
  onTexSourceSave?: (newSource: string) => void;
}

export function RightPreview({
  pdfPath,
  texSource,
  data,
  isCompiling,
  onDownloadPdf,
  onDownloadTex,
  onTexSourceSave,
}: RightPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState<'pdf' | 'latex'>('pdf');
  const [copied, setCopied] = useState(false);
  // Editable LaTeX state — syncs when parent updates texSource
  const [editedTex, setEditedTex] = useState(texSource);
  const isDirty = editedTex !== texSource;

  // Keep local editor in sync when AI / form updates arrive
  useEffect(() => { setEditedTex(texSource); }, [texSource]);

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(editedTex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onTexSourceSave?.(editedTex);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 15, 175));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 15, 50));
  const handleResetZoom = () => setZoom(100);

  return (
    <aside className="w-full h-full bg-[#F7F7F9] flex flex-col shrink-0 overflow-hidden">
      {/* Top preview toolbar */}
      <div className="h-11 border-b border-[#E2E4E9] bg-white px-4 flex items-center justify-between text-xs">
        {/* Toggle PDF vs LaTeX View */}
        <div className="flex items-center gap-1 bg-[#F7F7F9] p-0.5 rounded-full border border-[#E2E4E9]">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-medium transition-all ${
              activeTab === 'pdf'
                ? 'bg-white text-[#17191C] shadow-2xs font-semibold'
                : 'text-[#595E68] hover:text-[#17191C]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Compiled PDF</span>
          </button>
          <button
            onClick={() => setActiveTab('latex')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-medium transition-all ${
              activeTab === 'latex'
                ? 'bg-white text-[#17191C] shadow-2xs font-semibold'
                : 'text-[#595E68] hover:text-[#17191C]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>LaTeX Source</span>
          </button>
        </div>

        {/* PDF Zoom Controls */}
        {activeTab === 'pdf' && (
          <div className="flex items-center gap-1.5 text-[#595E68]">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded-full hover:bg-[#F7F7F9]"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-0.5 rounded text-[11px] font-mono hover:bg-[#F7F7F9]"
            >
              {zoom}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded-full hover:bg-[#F7F7F9]"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
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
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#7C5CFF] text-white font-semibold text-xs hover:bg-[#6a4ee0] disabled:opacity-50 transition-colors"
                >
                  <Play className="w-3 h-3" />
                  <span>Apply & Compile</span>
                </button>
              )}
            </div>
          ) : (
            pdfPath && (
              <a
                href={pdfPath}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-[#595E68] hover:text-[#7C5CFF]"
                title="Open PDF in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )
          )}
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center relative">
        {isCompiling && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-20 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-[#7C5CFF] animate-spin" />
            <span className="text-xs font-semibold text-[#17191C]">Compiling LaTeX PDF...</span>
          </div>
        )}

        {activeTab === 'pdf' ? (
          pdfPath ? (
            <div
              key={pdfPath}
              className="bg-white shadow-2xl rounded-xs transition-all duration-150 origin-top overflow-hidden border border-[#E2E4E9]"
              style={{
                width: `${(8.5 * 96 * zoom) / 100}px`,
                height: `${(11 * 96 * zoom) / 100}px`,
              }}
            >
              <iframe
                src={`${pdfPath}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-none"
                title="Compiled PDF Resume"
              />
            </div>
          ) : (
            /* No PDF – show tectonic-not-installed notice + resume info card */
            <div
              className="flex flex-col gap-4 items-center"
              style={{ width: `${(8.5 * 96 * zoom) / 100}px` }}
            >
              {/* Compile failed banner – only shown if both tectonic and cloud failed */}
              <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-1">PDF not yet compiled</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Click <strong>Recompile</strong> in the header to generate the PDF via the cloud compiler.
                    If compilation keeps failing, copy the <strong>LaTeX Source</strong> and compile on{' '}
                    <a href="https://overleaf.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                      Overleaf
                    </a>.
                  </p>
                </div>
              </div>

              {/* Resume preview card */}
              <div
                className="bg-white text-[#17191C] shadow-2xl p-8 rounded-xs transition-all origin-top border border-[#E2E4E9] w-full"
                style={{ minHeight: `${(11 * 96 * zoom) / 100}px` }}
              >
                <div className="text-center border-b border-[#E2E4E9] pb-4 mb-4">
                  <h1 className="text-2xl font-bold tracking-tight text-[#17191C]">{data.personal.fullName}</h1>
                  <p className="text-sm font-medium text-[#595E68] mb-1">{data.personal.jobTitle}</p>
                  <p className="text-xs text-[#8A8F9B]">
                    {[data.personal.email, data.personal.phone, data.personal.location].filter(Boolean).join(' • ')}
                  </p>
                </div>

                {data.summary && (
                  <div className="mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C5CFF] border-b border-[#E2E4E9] pb-1 mb-2">Summary</h3>
                    <p className="text-xs text-[#595E68] leading-relaxed">{data.summary}</p>
                  </div>
                )}

                {data.experience.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C5CFF] border-b border-[#E2E4E9] pb-1 mb-2">Work Experience</h3>
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
                            {exp.highlights.map((h, i) => <li key={i}>{h}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.education.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C5CFF] border-b border-[#E2E4E9] pb-1 mb-2">Education</h3>
                    <div className="space-y-2">
                      {data.education.map((edu) => (
                        <div key={edu.id}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold">{edu.institution}</span>
                            <span className="text-[#8A8F9B] font-mono text-[11px]">{edu.startDate} – {edu.endDate}</span>
                          </div>
                          <p className="text-xs text-[#595E68]">{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.skills.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C5CFF] border-b border-[#E2E4E9] pb-1 mb-2">Skills</h3>
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
          )
        ) : (
          /* Editable LaTeX Source */
          <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-[#E2E4E9] shadow-inner overflow-hidden">
            {isDirty && (
              <div className="px-3 py-1.5 bg-[#7C5CFF]/10 border-b border-[#7C5CFF]/20 flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#7C5CFF]">Unsaved changes — click Apply &amp; Compile to update PDF</span>
                <button onClick={() => setEditedTex(texSource)} className="text-[11px] text-[#595E68] hover:text-red-500">Reset</button>
              </div>
            )}
            <textarea
              value={editedTex}
              onChange={(e) => setEditedTex(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full p-4 font-mono text-xs text-[#17191C] bg-white resize-none outline-none leading-relaxed"
              placeholder="Paste or edit your LaTeX source here…"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
