'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { LeftSidebar } from '@/components/workspace/LeftSidebar';
import { CenterChat } from '@/components/workspace/CenterChat';
import { RightPreview } from '@/components/workspace/RightPreview';
import { VersionHistoryModal } from '@/components/workspace/VersionHistoryModal';
import { ResumeData, RevisionMeta, ChatMessage, TemplateId } from '@/lib/types/resume';
import { MessageSquare, Eye } from 'lucide-react';

export default function EditorPage() {
  const router = useRouter();
  const routeParams = useParams();
  const id = typeof routeParams?.id === 'string' ? routeParams.id : (Array.isArray(routeParams?.id) ? routeParams.id[0] : '');

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
    if (!id) return;
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

        if (!r.pdfPath) {
          handleManualCompile();
        }
      }
    } catch (err) {
      console.error('Failed to load resume details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchResumeDetails();
    }
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

  // Handle File Upload from Chat Prompt
  const handleUploadFile = async (file: File) => {
    setIsAiProcessing(true);
    setIsCompiling(true);
    setCompilationError(undefined);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/resumes/parse-upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.resume) {
        handleDataChange(json.resume.data);
        handleSendMessage(`Uploaded and parsed new resume file: ${file.name}`);
      } else {
        setCompilationError(json.error || 'Failed to parse uploaded resume.');
      }
    } catch (err: any) {
      setCompilationError(err.message || 'Error uploading file.');
    } finally {
      setIsAiProcessing(false);
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
      <div className="h-screen bg-white text-[#17191C] flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-8 h-8 rounded-xl glow-purple text-white flex items-center justify-center font-bold animate-pulse">
          CV
        </div>
        <p className="text-xs text-[#595E68] font-medium">Loading Prepflow.ai Resume Workspace...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white text-[#17191C] flex flex-col overflow-hidden font-sans">
      <WorkspaceHeader
        title={title}
        template={template}
        onUpdateTitle={setTitle}
        onUpdateTemplate={handleUpdateTemplate}
        onOpenRevisions={() => {}}
        onOpenLatex={() => {}}
        onDownloadPdf={handleDownloadPdf}
        isCompiling={isCompiling}
        onManualCompile={handleManualCompile}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Canvas (Left/Center): LaTeX Source & Large PDF Resume Preview */}
        <div className={`w-full md:w-[65%] lg:w-[70%] flex flex-col ${mobileTab === 'preview' ? 'block' : 'hidden md:flex'}`}>
          <RightPreview
            pdfPath={pdfPath}
            texSource={texSource}
            data={resumeData}
            isCompiling={isCompiling}
            onDownloadPdf={handleDownloadPdf}
            onDownloadTex={handleDownloadTex}
          />
        </div>

        {/* Side Panel (Right): AI Prompting Section & PDF Upload */}
        <div className={`w-full md:w-[35%] lg:w-[30%] flex flex-col ${mobileTab === 'chat' ? 'block' : 'hidden md:flex'}`}>
          <CenterChat
            messages={messages}
            onSendMessage={handleSendMessage}
            onUploadFile={handleUploadFile}
            isProcessing={isAiProcessing}
            compilationError={compilationError}
            onRetry={handleManualCompile}
          />
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden border-t border-[#E2E4E9] bg-white flex items-center justify-around py-2">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full ${
            mobileTab === 'chat' ? 'bg-[#17191C] text-white' : 'text-[#595E68]'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> AI Chat
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full ${
            mobileTab === 'preview' ? 'bg-[#17191C] text-white' : 'text-[#595E68]'
          }`}
        >
          <Eye className="w-4 h-4" /> PDF Preview
        </button>
      </div>
    </div>
  );
}
