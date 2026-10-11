'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewResumeModal } from '@/components/dashboard/NewResumeModal';
import { ResumeCard } from '@/components/dashboard/ResumeCard';
import {
  Sparkles, Upload, FileText, Paperclip, RefreshCw,
  FolderOpen, Plus, GitBranch, Target
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);

  // Load saved resumes to display progress
  const fetchResumes = async () => {
    try {
      const res = await fetch('/api/resumes');
      const json = await res.json();
      if (json.success && Array.isArray(json.resumes)) {
        setResumes(json.resumes);
      }
    } catch (err) {
      console.warn('Failed to load resumes:', err);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' }),
      });
      const json = await res.json();
      if (json.success) {
        fetchResumes();
      }
    } catch (err) {
      console.error('Failed to duplicate:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setResumes((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      const target = resumes.find((r) => r.id === id);
      if (!target) return;
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { ...target.data, title: newTitle }, prompt: `Renamed to ${newTitle}` }),
      });
      const json = await res.json();
      if (json.success) {
        fetchResumes();
      }
    } catch (err) {
      console.error('Failed to rename:', err);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25MB limit. Please upload a smaller file.');
      return;
    }
    const isAllowed =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.type.startsWith('image/') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.txt');
    if (!isAllowed) {
      setUploadError('Unsupported file format. Please upload a PDF resume.');
      return;
    }

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

  const handleStartBlank = async () => {
    setIsUploading(true);
    setUploadError(undefined);
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
        router.push(`/editor/${json.resume.id}`);
      } else {
        setUploadError(json.error || 'Failed to initialize blank resume.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error initializing blank resume.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'Gemini AI Tailoring',
      desc: 'Paste a job description. AI rewrites your resume to match, with diff review before applying.',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'ATS-Ready LaTeX',
      desc: 'Every resume compiles to a clean, recruiter-proof PDF from a structured LaTeX template.',
    },
    {
      icon: <GitBranch className="w-5 h-5" />,
      title: 'Version History',
      desc: 'Every save creates a snapshot. Restore any previous version in one click.',
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Job-Specific Edits',
      desc: 'Upload a JD and let AI suggest targeted changes — accept or reject each suggestion.',
    },
  ];

  return (
    <div className="min-h-screen pf-bg text-[#130e30] flex flex-col" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-black/[0.07] pf-glass px-6 py-3.5">
        <nav className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.jpg" alt="Prepflow.ai logo" className="w-8 h-8 rounded-full object-cover" />
            <span className="font-bold text-xl tracking-tight text-[#130e30]">Prepflow.ai</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#ffe228] text-[#130e30]">
              AI-Native
            </span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-[15px] text-[#130e30]">
            <a href="#how-it-works" className="hover:opacity-60 transition-opacity">How it works</a>
            <a href="#resumes" className="hover:opacity-60 transition-opacity">My Resumes</a>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#ffe228] text-[#130e30] px-5 py-2.5 text-[15px] font-semibold hover:-translate-y-px transition-transform shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Resume
          </button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative px-6 py-24 flex flex-col items-center overflow-hidden pf-hero-bg">
        {/* Blobs */}
        <div className="absolute top-[-80px] left-[-100px] w-[500px] h-[500px] rounded-full bg-[#ffe228]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-80px] w-[400px] h-[400px] rounded-full bg-[#ffe228]/15 blur-3xl pointer-events-none" />

        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,image/*" onChange={handleFileChange} className="hidden" />

        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-7">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur border border-black/[0.08] text-sm font-medium text-[#130e30] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#ffe228] animate-pulse" />
            ATS-Compliant LaTeX · Gemini AI · Job-Targeted Edits
          </div>

          {/* Heading */}
          <h1 style={{ fontFamily: '"Hedvig Letters Serif", "Times New Roman", serif', fontWeight: 400, fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: '1.14', letterSpacing: '-0.48px', color: '#130e30' }}>
            Your resume, tailored<br />
            for every <em style={{ fontStyle: 'italic' }}>job description.</em>
          </h1>

          <p className="max-w-lg mx-auto text-lg text-[#130e30]/65 leading-relaxed">
            Upload your resume or start fresh. Prepflow.ai compiles professional LaTeX PDFs and uses
            Gemini AI to tailor each version to a specific job — with accept/reject diff review.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={handleStartBlank}
              disabled={isUploading}
              id="btn-start-blank"
              className="flex items-center gap-2 rounded-full bg-[#130e30] text-white px-6 py-3 text-[15px] font-semibold hover:-translate-y-px transition-transform shadow-md disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              Start with Blank Template
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              id="btn-upload-resume"
              className="flex items-center gap-2 rounded-full bg-white/80 border border-black/[0.1] text-[#130e30] px-6 py-3 text-[15px] font-semibold hover:-translate-y-px transition-transform shadow-sm disabled:opacity-50"
            >
              {isUploading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /><span>Processing...</span></>
              ) : (
                <><Upload className="w-4 h-4" /><span>Upload Existing Resume</span></>
              )}
            </button>
          </div>

          {/* Smart Input Bar */}
          <div className="pt-2 max-w-xl mx-auto">
            <div className="flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur border border-black/[0.08] p-3.5 shadow-md">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffe228] text-[#130e30]">
                <Sparkles className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Describe your target role or paste a job description..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setIsModalOpen(true); }}
                className="flex-1 text-sm bg-transparent border-none text-[#130e30] focus:outline-none placeholder:text-[#130e30]/40"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-[#130e30]/40 hover:text-[#130e30] transition-colors"
                title="Upload resume file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            {uploadError && <p className="mt-2 text-xs text-red-600 font-medium text-center">{uploadError}</p>}
          </div>
        </div>
      </section>

      {/* ── Ditto-style colorful decorative band ── */}
      <div className="w-full overflow-hidden leading-none" style={{ height: '120px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-band.jpg"
          alt="Colorful abstract shapes"
          className="w-full h-full object-cover object-center"
          style={{ display: 'block' }}
        />
      </div>


      <section id="how-it-works" className="px-6 py-16 pf-bg">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: '"Hedvig Letters Serif", "Times New Roman", serif', fontWeight: 400, fontSize: '2.56rem', lineHeight: '1.15', letterSpacing: '-0.4096px', color: '#130e30' }}>
              How Prepflow.ai works
            </h2>
            <p className="mt-3 text-[#130e30]/55 text-base max-w-md mx-auto">
              From raw resume to tailored, ATS-proof PDF in minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-6 rounded-[22px] transition-transform hover:-translate-y-1 cursor-default"
                style={{ background: 'rgba(255,255,255,0.62)', boxShadow: 'rgba(64,58,45,0.1) 0px 10px 30px 0px, rgba(255,255,255,0.5) 0px 0px 0px 1px inset' }}
              >
                <div className="w-10 h-10 rounded-full bg-[#ffe228] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-[#130e30] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#130e30]/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Saved Resumes ── */}
      <section id="resumes" className="px-6 py-12 border-t border-black/[0.06] flex-1 pf-bg">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-[#130e30]/50" />
              <h2 className="text-xl font-bold tracking-tight text-[#130e30]">Your Resumes</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#ffe228] text-[#130e30]">
                {resumes.length} saved
              </span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#ffe228] text-[#130e30] px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
            >
              <Plus className="w-3.5 h-3.5" />
              New Resume
            </button>
          </div>

          {isLoadingResumes ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-[22px] animate-pulse" style={{ background: 'rgba(255,255,255,0.62)' }} />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#130e30]/15 p-12 text-center" style={{ background: 'rgba(255,255,255,0.62)' }}>
              <div className="w-12 h-12 rounded-full bg-[#ffe228]/60 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-[#130e30]" />
              </div>
              <h3 className="text-base font-semibold text-[#130e30]">No resumes yet</h3>
              <p className="text-sm text-[#130e30]/50 mt-1 mb-5">
                Start with a blank LaTeX template or upload your existing resume.
              </p>
              <button
                onClick={handleStartBlank}
                className="rounded-full bg-[#ffe228] text-[#130e30] px-5 py-2.5 text-sm font-semibold hover:-translate-y-px transition-transform"
              >
                Create First Resume
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  id={resume.id}
                  title={resume.title || 'Untitled Resume'}
                  targetRole={resume.targetRole || resume.data?.personal?.jobTitle}
                  template={resume.template || 'classic'}
                  updatedAt={resume.updatedAt}
                  pdfPath={resume.pdfPath}
                  data={resume.data}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-black/[0.06] px-6 py-5 pf-bg">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between text-sm text-[#130e30]/40">
          <span className="font-semibold text-[#130e30]">Prepflow.ai</span>
          <span>AI-powered LaTeX resume editor · Gemini-powered</span>
        </div>
      </footer>

      <NewResumeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); fetchResumes(); }}
      />
    </div>
  );
}
