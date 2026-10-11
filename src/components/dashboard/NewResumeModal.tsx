'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, FileText, Sparkles, RefreshCw, Code2, PlusCircle, Check } from 'lucide-react';

interface NewResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (params: any) => void;
}

export function NewResumeModal({ isOpen, onClose }: NewResumeModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'blank' | 'upload' | 'paste'>('blank');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastedLatex, setPastedLatex] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  // Option 1: Start with hardcoded minimal blank resume template
  const handleStartBlank = async () => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'My Resume',
          template: 'blank',
        }),
      });

      const json = await res.json();
      if (json.success && json.resume) {
        onClose();
        router.push(`/editor/${json.resume.id}`);
      } else {
        setErrorMessage(json.error || 'Failed to initialize blank template.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating blank resume.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Option 2: Upload file (PDF / DOCX / Image)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      uploadAndParseResume(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      uploadAndParseResume(file);
    }
  };

  const uploadAndParseResume = async (file: File) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB limit. Please upload a smaller file.');
      return;
    }
    const isAllowed =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.type.startsWith('image/') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.txt');
    if (!isAllowed) {
      setErrorMessage('Unsupported file format. Please upload a PDF resume.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(undefined);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/resumes/parse-upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.resumeId) {
        onClose();
        router.push(`/editor/${json.resumeId}`);
      } else {
        setErrorMessage(json.error || 'Failed to parse uploaded resume.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while uploading.');
    } finally {
      setIsUploading(false);
    }
  };

  // Option 3: Paste custom LaTeX code
  const handlePasteSubmit = async () => {
    if (!pastedLatex.trim()) {
      setErrorMessage('Please paste your LaTeX resume code before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Imported LaTeX Resume',
          template: 'classic',
          texSource: pastedLatex.trim(),
        }),
      });

      const json = await res.json();
      if (json.success && json.resume) {
        onClose();
        router.push(`/editor/${json.resume.id}`);
      } else {
        setErrorMessage(json.error || 'Failed to import LaTeX code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error importing LaTeX code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E4E9] rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl glow-purple flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#17191C]">Create or Load Resume</h2>
              <p className="text-xs text-[#595E68]">Choose how you want to start building</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading || isSubmitting}
            className="p-1.5 rounded-full text-[#8A8F9B] hover:text-[#17191C] hover:bg-[#F7F7F9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-[#F7F7F9] p-1 rounded-2xl border border-[#E2E4E9] mb-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('blank')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'blank'
                ? 'bg-white text-[#17191C] shadow-2xs'
                : 'text-[#595E68] hover:text-[#17191C]'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#7C5CFF]" />
            <span>Blank Template</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-white text-[#17191C] shadow-2xs'
                : 'text-[#595E68] hover:text-[#17191C]'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-[#7C5CFF]" />
            <span>Upload PDF</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-white text-[#17191C] shadow-2xs'
                : 'text-[#595E68] hover:text-[#17191C]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-[#7C5CFF]" />
            <span>Paste LaTeX</span>
          </button>
        </div>

        {/* Tab 1: Blank Minimal Template */}
        {activeTab === 'blank' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#E2E4E9] bg-[#F7F7F9] p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E4E9] flex items-center justify-center text-[#7C5CFF] shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#17191C]">Minimal ATS LaTeX Template</h3>
                  <p className="text-xs text-[#595E68] leading-relaxed">
                    Starts with a pre-configured, single-page LaTeX resume with standard sections (Experience, Education, Projects, Skills).
                  </p>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-[#E2E4E9]/60 flex flex-wrap gap-2 text-[11px] text-[#595E68]">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> 100% ATS Compliant
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Guaranteed 1-Page Format
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Instant Prompt Editing
                </span>
              </div>
            </div>

            <button
              onClick={handleStartBlank}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-2xl bg-[#17191C] hover:bg-black text-white text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#7C5CFF]" />
                  <span>Loading Template...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-[#7C5CFF]" />
                  <span>Start with Blank Template</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Upload File */}
        {activeTab === 'upload' && (
          <div>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                dragActive
                  ? 'border-[#7C5CFF] bg-[#7C5CFF]/5'
                  : 'border-[#E2E4E9] bg-[#F7F7F9] hover:border-[#7C5CFF]/50 hover:bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {isUploading ? (
                <div className="py-4 space-y-3 flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 text-[#7C5CFF] animate-spin" />
                  <p className="font-semibold text-sm text-[#17191C]">
                    Parsing {selectedFile?.name}...
                  </p>
                  <p className="text-xs text-[#8A8F9B]">
                    AI is extracting details & compiling LaTeX PDF...
                  </p>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#E2E4E9] flex items-center justify-center shadow-xs text-[#7C5CFF]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#17191C]">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-xs text-[#595E68] mt-1">
                      Supports PDF, DOCX, TXT, or Image files
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white border border-[#E2E4E9] text-[#7C5CFF]">
                    Auto-converts to AI Editable Resume
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Paste LaTeX Code */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <p className="text-xs text-[#595E68]">
              Paste your raw LaTeX (<code className="font-mono text-[#17191C]">.tex</code>) code from Overleaf or local files:
            </p>
            <textarea
              value={pastedLatex}
              onChange={(e) => setPastedLatex(e.target.value)}
              placeholder="\documentclass{article}&#10;\begin{document}&#10;...&#10;\end{document}"
              rows={7}
              className="w-full text-xs font-mono p-3 rounded-2xl border border-[#E2E4E9] bg-[#F7F7F9] focus:bg-white focus:outline-hidden focus:border-[#7C5CFF] text-[#17191C] placeholder:text-[#8A8F9B]"
            />
            <button
              onClick={handlePasteSubmit}
              disabled={isSubmitting || !pastedLatex.trim()}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#17191C] hover:bg-black text-white text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#7C5CFF]" />
                  <span>Importing LaTeX...</span>
                </>
              ) : (
                <>
                  <Code2 className="w-4 h-4 text-[#7C5CFF]" />
                  <span>Import & Open in Editor</span>
                </>
              )}
            </button>
          </div>
        )}

        {errorMessage && (
          <p className="mt-3 text-xs text-red-600 font-medium text-center">{errorMessage}</p>
        )}

        <div className="mt-5 flex items-center justify-between text-xs text-[#8A8F9B] border-t border-[#E2E4E9] pt-4">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" /> Instant AI Prompt Editing
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full border border-[#E2E4E9] text-[#595E68] font-medium hover:bg-[#F7F7F9]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
