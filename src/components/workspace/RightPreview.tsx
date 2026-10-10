'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Download, Copy, Code, FileText, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { ResumeData } from '@/lib/types/resume';

interface RightPreviewProps {
  pdfPath?: string;
  texSource: string;
  data: ResumeData;
  isCompiling: boolean;
  onDownloadPdf: () => void;
  onDownloadTex: () => void;
}

export function RightPreview({
  pdfPath,
  texSource,
  data,
  isCompiling,
  onDownloadPdf,
  onDownloadTex,
}: RightPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'split' | 'pdf' | 'latex'>('split');
  const [copied, setCopied] = useState(false);

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(texSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 15, 175));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 15, 50));
  const handleResetZoom = () => setZoom(100);

  return (
    <section className="flex-1 h-[calc(100vh-3.5rem)] bg-[#F7F7F9] flex flex-col min-w-0 border-r border-[#E2E4E9]">
      {/* Top preview toolbar */}
      <div className="h-11 border-b border-[#E2E4E9] bg-white px-4 flex items-center justify-between text-xs shrink-0">
        {/* Toggle PDF vs LaTeX vs Split View */}
        <div className="flex items-center gap-1 bg-[#F7F7F9] p-0.5 rounded-full border border-[#E2E4E9]">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-white text-[#17191C] shadow-2xs font-semibold'
                : 'text-[#595E68] hover:text-[#17191C]'
            }`}
          >
            <span>Split (LaTeX + PDF)</span>
          </button>
          <button
            onClick={() => setViewMode('pdf')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
              viewMode === 'pdf'
                ? 'bg-white text-[#17191C] shadow-2xs font-semibold'
                : 'text-[#595E68] hover:text-[#17191C]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Only</span>
          </button>
          <button
            onClick={() => setViewMode('latex')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
              viewMode === 'latex'
                ? 'bg-white text-[#17191C] shadow-2xs font-semibold'
                : 'text-[#595E68] hover:text-[#17191C]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>LaTeX Only</span>
          </button>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-3">
          {viewMode !== 'latex' && (
            <div className="flex items-center gap-1 text-[#595E68]">
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

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyLatex}
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#E2E4E9] bg-white text-[#17191C] font-medium text-xs hover:border-[#7C5CFF]"
              title="Copy LaTeX source"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy .tex'}</span>
            </button>

            {pdfPath && (
              <a
                href={pdfPath}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full border border-[#E2E4E9] bg-white text-[#595E68] hover:text-[#7C5CFF]"
                title="Open PDF in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-hidden p-3 flex gap-3 relative">
        {isCompiling && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-20 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-[#7C5CFF] animate-spin" />
            <span className="text-xs font-semibold text-[#17191C]">
              Compiling LaTeX PDF with Tectonic...
            </span>
          </div>
        )}

        {/* LaTeX Code View (Visible in 'split' or 'latex' view) */}
        {(viewMode === 'split' || viewMode === 'latex') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full bg-white text-[#17191C] rounded-2xl p-4 font-mono text-xs overflow-auto border border-[#E2E4E9] shadow-inner flex flex-col`}>
            <div className="flex items-center justify-between border-b border-[#E2E4E9] pb-2 mb-2 text-[11px] text-[#8A8F9B]">
              <span className="font-semibold text-[#17191C]">resume.tex (LaTeX Source)</span>
              <span>{texSource.split('\n').length} lines</span>
            </div>
            <pre className="flex-1 whitespace-pre-wrap leading-relaxed select-text font-mono">{texSource}</pre>
          </div>
        )}

        {/* Compiled PDF View (Visible in 'split' or 'pdf' view) */}
        {(viewMode === 'split' || viewMode === 'pdf') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full overflow-hidden flex items-center justify-center relative`}>
            {pdfPath ? (
              <div
                className="bg-white shadow-2xl rounded-xs transition-all duration-150 overflow-hidden border border-[#E2E4E9] flex items-center justify-center"
                style={{
                  aspectRatio: '1 / 1.4142',
                  maxHeight: 'calc(100vh - 6.5rem)',
                  maxWidth: '100%',
                  width: `${(100 * zoom) / 100}%`,
                  height: '100%',
                }}
              >
                <iframe
                  src={`${pdfPath}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className="w-full h-full border-none"
                  title="Compiled PDF Resume"
                />
              </div>
            ) : (
              /* High-fidelity A4 Fallback Sheet */
              <div
                className="bg-white text-[#17191C] shadow-2xl p-6 sm:p-8 rounded-xs transition-all border border-[#E2E4E9] overflow-y-auto"
                style={{
                  aspectRatio: '1 / 1.4142',
                  maxHeight: 'calc(100vh - 6.5rem)',
                  maxWidth: '100%',
                  height: '100%',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {/* Header */}
                <div className="text-center border-b-2 border-[#17191C] pb-2 mb-3">
                  <h1 className="text-2xl font-bold tracking-tight uppercase text-[#17191C]">
                    {data?.personal?.fullName || 'Candidate Name'}
                  </h1>
                  <p className="text-xs text-[#595E68] mt-1 font-sans">
                    {[
                      data?.personal?.email,
                      data?.personal?.phone,
                      data?.personal?.location,
                      data?.personal?.linkedin ? 'LinkedIn' : undefined,
                      data?.personal?.github ? 'GitHub' : undefined,
                    ].filter(Boolean).join(' | ')}
                  </p>
                </div>

                {/* Summary */}
                {data?.summary && (
                  <div className="mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#17191C] border-b border-gray-300 pb-0.5 mb-1 font-sans">
                      Professional Summary
                    </h2>
                    <p className="text-[11px] text-[#2D3139] leading-relaxed font-sans">{data.summary}</p>
                  </div>
                )}

                {/* Experience */}
                {data?.experience && data.experience.length > 0 && (
                  <div className="mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#17191C] border-b border-gray-300 pb-0.5 mb-1.5 font-sans">
                      Work Experience
                    </h2>
                    <div className="space-y-2">
                      {data.experience.map((exp, idx) => (
                        <div key={exp.id || idx} className="text-[11px]">
                          <div className="flex justify-between font-bold text-[#17191C]">
                            <span>{exp.position} — {exp.company}</span>
                            <span className="font-normal text-[#595E68] font-sans">{exp.startDate} – {exp.endDate || 'Present'}</span>
                          </div>
                          {exp.highlights && exp.highlights.length > 0 && (
                            <ul className="list-disc list-inside mt-0.5 text-[#374151] space-y-0.5 font-sans">
                              {exp.highlights.map((h, hIdx) => (
                                <li key={hIdx} className="leading-snug">{h}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {data?.education && data.education.length > 0 && (
                  <div className="mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#17191C] border-b border-gray-300 pb-0.5 mb-1.5 font-sans">
                      Education
                    </h2>
                    <div className="space-y-1.5">
                      {data.education.map((edu, idx) => (
                        <div key={edu.id || idx} className="text-[11px]">
                          <div className="flex justify-between font-bold text-[#17191C]">
                            <span>{edu.institution}</span>
                            <span className="font-normal text-[#595E68] font-sans">{edu.startDate} – {edu.endDate}</span>
                          </div>
                          <div className="text-[#4B5563] italic">{edu.degree}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {data?.skills && data.skills.length > 0 && (
                  <div className="mb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#17191C] border-b border-gray-300 pb-0.5 mb-1 font-sans">
                      Technical Skills
                    </h2>
                    <div className="space-y-0.5 text-[11px] font-sans">
                      {data.skills.map((sk, idx) => (
                        <div key={sk.id || idx}>
                          <span className="font-semibold text-[#17191C]">{sk.category}: </span>
                          <span className="text-[#374151]">{sk.items.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
