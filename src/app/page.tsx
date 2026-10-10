'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { NewResumeModal } from '@/components/dashboard/NewResumeModal';
import { Sparkles, ArrowRight, Upload, FileText, Paperclip, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(undefined);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/resumes/parse-upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.resumeId) {
        router.push(`/editor/${json.resumeId}`);
      } else {
        setUploadError(json.error || 'Failed to parse resume.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-white text-[#17191C] flex flex-col font-sans">
      <DashboardHeader onCreateNew={() => setIsModalOpen(true)} />

      {/* Sintropix Pure Light Hero Section - Clean & Centered */}
      <section className="relative flex-1 overflow-hidden px-6 sintropix-spotlight flex flex-col justify-center items-center">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col justify-center items-center">
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Main Hero Content */}
          <div className="text-center space-y-6 max-w-3xl mx-auto relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E4E9] shadow-2xs text-xs font-semibold text-[#595E68]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Upload PDF / Image & Edit by Prompt</span>
            </div>

            {/* Headline with Rust Underline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#17191C] leading-[1.08]">
              Your LaTeX Resume{' '}
              <span className="whitespace-nowrap font-normal">
                <span className="relative inline-block">
                  ready
                  <svg viewBox="0 0 120 10" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-3 w-full text-[#843924]">
                    <path d="M3 7 Q 40 2, 62 5 T 117 4" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
                ,
              </span>{' '}
              every single day.
            </h1>

            <p className="max-w-xl mx-auto text-base sm:text-lg text-[#595E68] font-normal leading-relaxed">
              Upload your old resume (PDF, DOCX, or Image). Prepflow.ai parses it into LaTeX and compiles a PDF ready for instant prompt editing.
            </p>

            {/* Hero CTA Buttons */}
            <div className="pt-2 flex items-center justify-center gap-5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="whitespace-nowrap rounded-full bg-[#17191C] px-6 py-3 text-[15px] font-medium text-white shadow-[0_12px_32px_-12px_rgba(23,25,28,0.5)] transition-transform hover:-translate-y-px flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#7C5CFF]" />
                    <span>Parsing Resume...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Resume</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="whitespace-nowrap text-[15px] font-medium text-[#17191C] transition-opacity hover:opacity-60 flex items-center gap-1"
              >
                <span>Browse Options</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sintropix AI Command & Upload Bar */}
            <div className="pt-6 max-w-xl mx-auto">
              <div className="flex items-center gap-3 rounded-2xl border border-[#E2E4E9] bg-white p-3.5 shadow-float">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full glow-purple text-white">
                  <Sparkles className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Upload resume or paste text to open in AI editor..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsModalOpen(true);
                  }}
                  className="flex-1 text-sm bg-transparent border-none text-[#17191C] focus:outline-hidden placeholder:text-[#8A8F9B]"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-[#8A8F9B] hover:text-[#7C5CFF]"
                  title="Upload resume file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              {/* Action Pills */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {[
                  'Upload PDF Resume',
                  'Upload Image/DOCX Resume',
                  'Add my latest internship',
                  'Tailor for Senior Role',
                ].map((pill, i) => (
                  <button
                    key={i}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-[#E2E4E9] bg-white px-3.5 py-1.5 text-[13px] text-[#595E68] hover:text-[#17191C] hover:border-[#7C5CFF] transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <Upload className="w-3 h-3 text-[#7C5CFF]" />
                    <span>{pill}</span>
                  </button>
                ))}
              </div>

              {uploadError && (
                <p className="mt-2 text-xs text-red-600 font-medium text-center">{uploadError}</p>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Upload Resume Modal */}
      <NewResumeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
