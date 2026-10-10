'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { LeftSidebar } from '@/components/workspace/LeftSidebar';
import { CenterChat } from '@/components/workspace/CenterChat';
import { RightPreview } from '@/components/workspace/RightPreview';
import { VersionHistoryModal } from '@/components/workspace/VersionHistoryModal';
import { ResumeData, RevisionMeta, ChatMessage, TemplateId } from '@/lib/types/resume';
import { MessageSquare, Eye } from 'lucide-react';

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [title, setTitle] = useState('Untitled Resume');
  const [template, setTemplate] = useState<TemplateId>('classic');
  const [pdfPath, setPdfPath] = useState<string | undefined>(undefined);
  const [texSource, setTexSource] = useState<string>('');
  const [revisions, setRevisions] = useState<RevisionMeta[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [compilationError, setCompilationError] = useState<string | undefined>(undefined);
  const [isRevisionsOpen, setIsRevisionsOpen] = useState(false);
  
  // Mobile responsive tab switcher ('chat' vs 'preview')
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');

  const fetchResumeDetails = async () => {
    try {
      const res = await fetch(`/api/resumes/${id}`);
      const json = await res.json();
      if (json.success && json.resume) {
        const r = json.resume;
        setResumeData(r.data);
        setTitle(r.title);
        setTemplate(r.template || 'classic');
        setPdfPath(r.pdfPath);
        setTexSource(r.texSource || '');
        setRevisions(r.revisions || []);
        setMessages(r.messages || []);
      }
    } catch (err) {
      console.error('Failed to load resume details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumeDetails();
  }, [id]);

  // Handle manual structured form edit
  const handleDataChange = async (updatedData: ResumeData) => {
    setResumeData(updatedData);
    setIsCompiling(true);
    setCompilationError(undefined);

    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData, prompt: 'Manual form update' }),
      });
      const json = await res.json();
      if (json.success && json.resume) {
        setPdfPath(json.resume.pdfPath);
        setTexSource(json.resume.texSource || '');
        setRevisions(json.resume.revisions || []);
      }
      if (json.compileResult && !json.compileResult.success) {
        setCompilationError(json.compileResult.error);
      }
    } catch (err: any) {
      setCompilationError(err.message || 'Failed to compile manual edit.');
    } finally {
      setIsCompiling(false);
    }
  };

  // Handle AI prompt instruction submission
  const handleSendMessage = async (instruction: string) => {
    setIsAiProcessing(true);
    setIsCompiling(true);
    setCompilationError(undefined);

    try {
      const res = await fetch(`/api/resumes/${id}/ai-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction }),
      });
      const json = await res.json();
      if (json.success && json.resume) {
        setResumeData(json.resume.data);
        setTemplate(json.resume.template || 'classic');
        setPdfPath(json.resume.pdfPath);
        setTexSource(json.resume.texSource || '');
        setRevisions(json.resume.revisions || []);
        setMessages(json.resume.messages || []);
      } else if (json.error) {
        setCompilationError(json.error);
        fetchResumeDetails(); // reload message log
      }
    } catch (err: any) {
      setCompilationError(err.message || 'AI processing encountered an error.');
    } finally {
      setIsAiProcessing(false);
      setIsCompiling(false);
    }
  };

  // Handle Template change
  const handleUpdateTemplate = (newTemplate: TemplateId) => {
    if (!resumeData) return;
    const updated = { ...resumeData, template: newTemplate };
    setTemplate(newTemplate);
    handleDataChange(updated);
  };

  // Handle Manual Recompile
  const handleManualCompile = async () => {
    setIsCompiling(true);
    setCompilationError(undefined);
    try {
      const res = await fetch(`/api/resumes/${id}/compile`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setPdfPath(json.pdfPath);
        setTexSource(json.texSource);
      } else {
        setCompilationError(json.error || 'Compilation failed');
      }
    } catch (err: any) {
      setCompilationError(err.message || 'Compilation error');
    } finally {
      setIsCompiling(false);
    }
  };

  // Restore revision snapshot
  const handleRestoreRevision = async (version: number) => {
    setIsCompiling(true);
    try {
      const res = await fetch(`/api/resumes/${id}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      const json = await res.json();
      if (json.success && json.resume) {
        setResumeData(json.resume.data);
        setTemplate(json.resume.template || 'classic');
        setPdfPath(json.resume.pdfPath);
        setTexSource(json.resume.texSource || '');
        setRevisions(json.resume.revisions || []);
      }
    } catch (err) {
      console.error('Failed to restore version:', err);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownloadPdf = () => {
    if (pdfPath) {
      const link = document.createElement('a');
      link.href = pdfPath;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      link.click();
    }
  };

  const handleDownloadTex = () => {
    const blob = new Blob([texSource], { type: 'text/x-tex' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.tex`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !resumeData) {
    return (
      <div className="h-screen bg-[#FAF8F5] dark:bg-[#121214] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-lg bg-[#FF6600] text-white flex items-center justify-center font-bold animate-pulse">
          YC
        </div>
        <p className="text-xs text-zinc-500 font-medium">Loading PromptCV Resume Workspace...</p>
      </div>
    );
  }

  const currentVersion = revisions.length > 0 ? revisions[0].version : 1;

  return (
    <div className="h-screen bg-[#FAF8F5] dark:bg-[#121214] text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden">
      <WorkspaceHeader
        title={title}
        template={template}
        onUpdateTitle={setTitle}
        onUpdateTemplate={handleUpdateTemplate}
        onOpenRevisions={() => setIsRevisionsOpen(true)}
        onOpenLatex={() => {}}
        onDownloadPdf={handleDownloadPdf}
        isCompiling={isCompiling}
        onManualCompile={handleManualCompile}
      />

      {/* Main 3-Panel Responsive Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Structured Data Form */}
        <div className="hidden lg:block">
          <LeftSidebar data={resumeData} onChange={handleDataChange} />
        </div>

        {/* Center Panel: AI Chat Interface (Visible on desktop or mobile 'chat' tab) */}
        <div className={`flex-1 flex flex-col ${mobileTab === 'chat' ? 'block' : 'hidden md:flex'}`}>
          <CenterChat
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isAiProcessing}
            compilationError={compilationError}
            onRetry={handleManualCompile}
          />
        </div>

        {/* Right Panel: Real Compiled PDF Preview & LaTeX Source (Visible on desktop or mobile 'preview' tab) */}
        <div className={`w-full md:w-[48%] ${mobileTab === 'preview' ? 'block' : 'hidden md:block'}`}>
          <RightPreview
            pdfPath={pdfPath}
            texSource={texSource}
            data={resumeData}
            isCompiling={isCompiling}
            onDownloadPdf={handleDownloadPdf}
            onDownloadTex={handleDownloadTex}
          />
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden border-t border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-[#18181B] flex items-center justify-around py-2">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg ${
            mobileTab === 'chat' ? 'bg-[#FF6600] text-white' : 'text-zinc-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> AI Chat
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg ${
            mobileTab === 'preview' ? 'bg-[#FF6600] text-white' : 'text-zinc-500'
          }`}
        >
          <Eye className="w-4 h-4" /> PDF Preview
        </button>
      </div>

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={isRevisionsOpen}
        onClose={() => setIsRevisionsOpen(false)}
        revisions={revisions}
        currentVersion={currentVersion}
        onRestore={handleRestoreRevision}
      />
    </div>
  );
}
