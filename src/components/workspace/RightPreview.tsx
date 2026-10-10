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
  const [activeTab, setActiveTab] = useState<'pdf' | 'latex'>('pdf');
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
    <aside className="w-[48%] h-[calc(100vh-3.5rem)] border-l border-[#E2E4E9] bg-[#F7F7F9] flex flex-col shrink-0">
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
            <button
              onClick={handleCopyLatex}
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#E2E4E9] bg-white text-[#17191C] font-medium text-xs hover:border-[#7C5CFF]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy .tex'}</span>
            </button>
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
            <span className="text-xs font-semibold text-[#17191C]">
              Compiling LaTeX PDF with Tectonic...
            </span>
          </div>
        )}

        {activeTab === 'pdf' ? (
          pdfPath ? (
            <div
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
            /* Fallback Sheet */
            <div
              className="bg-white text-[#17191C] shadow-2xl p-8 rounded-xs transition-all origin-top border border-[#E2E4E9]"
              style={{
                width: `${(8.5 * 96 * zoom) / 100}px`,
                minHeight: `${(11 * 96 * zoom) / 100}px`,
              }}
            >
              <div className="text-center border-b border-[#E2E4E9] pb-4 mb-4">
                <h1 className="text-2xl font-bold tracking-tight text-[#17191C]">{data.personal.fullName}</h1>
                <p className="text-sm font-medium text-[#595E68] mb-1">{data.personal.jobTitle}</p>
                <p className="text-xs text-[#8A8F9B]">
                  {data.personal.email} • {data.personal.phone} • {data.personal.location}
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

              {data.experience.length > 0 && (
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
                            {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
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

              {data.skills.length > 0 && (
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
          )
        ) : (
          /* Light LaTeX Source View */
          <div className="w-full h-full bg-white text-[#17191C] rounded-2xl p-4 font-mono text-xs overflow-auto border border-[#E2E4E9] shadow-inner">
            <pre className="whitespace-pre-wrap">{texSource}</pre>
          </div>
        )}
      </div>
    </aside>
  );
}
