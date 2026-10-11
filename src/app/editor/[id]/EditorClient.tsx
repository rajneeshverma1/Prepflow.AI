'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { LeftSidebar } from '@/components/workspace/LeftSidebar';
import { CenterChat } from '@/components/workspace/CenterChat';
import { RightPreview } from '@/components/workspace/RightPreview';
import { VersionHistoryModal } from '@/components/workspace/VersionHistoryModal';
import { DiffReviewBar } from '@/components/workspace/DiffReviewBar';
import { ResumeDiffItem, applyAcceptedDiffs } from '@/lib/ai/diff';
import { ResumeData, RevisionMeta, ChatMessage, TemplateId } from '@/lib/types/resume';
import { MessageSquare, Eye, SlidersHorizontal } from 'lucide-react';

export function EditorClient({ id }: { id: string }) {
  const router = useRouter();

  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [title, setTitle] = useState('Untitled Resume');
  const [template, setTemplate] = useState<TemplateId>('classic');
  const [pdfPath, setPdfPath] = useState<string | undefined>(undefined);
  const [originalPdfPath, setOriginalPdfPath] = useState<string | undefined>(undefined);
  const [activePdfUrl, setActivePdfUrl] = useState<string | undefined>(undefined);
  const [texSource, setTexSource] = useState<string>('');
  const [revisions, setRevisions] = useState<RevisionMeta[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [compilationError, setCompilationError] = useState<string | undefined>(undefined);
  const [isRevisionsOpen, setIsRevisionsOpen] = useState(false);
  
  // Leftmost form sidebar collapsed by default in main view as requested
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mobile responsive tab switcher ('chat' vs 'preview' vs 'form')
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview' | 'form'>('chat');

  // Google Docs Gemini-style Diff Suggestion Review states
  const [pendingDiffs, setPendingDiffs] = useState<ResumeDiffItem[]>([]);
  const [proposedData, setProposedData] = useState<ResumeData | null>(null);
  const [isApplyingDiffs, setIsApplyingDiffs] = useState(false);

  const fetchResumeDetails = async () => {
    try {
      const res = await fetch(`/api/resumes/${id}`);
      const json = await res.json();
      if (json.success && json.resume) {
        const r = json.resume;
        setResumeData(r.data);
        setTitle(r.title);
        const initPdf = r.originalPdfPath || r.data?.originalPdfPath || r.pdfPath;
        setPdfPath(r.pdfPath);
        setOriginalPdfPath(r.originalPdfPath || r.data?.originalPdfPath || undefined);
        setActivePdfUrl(initPdf);
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

  // Handle uploading or replacing a PDF document directly in the editor or chat
  const handleUploadPdf = async (file: File, instruction?: string) => {
    setIsUploadingPdf(true);
    setCompilationError(undefined);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resumeId', id);
      if (instruction?.trim()) {
        formData.append('instruction', instruction.trim());
      }

      const res = await fetch('/api/resumes/parse-upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setOriginalPdfPath(json.originalPdfPath);
        setPdfPath(json.pdfPath);
        // Newly uploaded PDF (from chat) immediately replaces previous upload and opens
        setActivePdfUrl(json.originalPdfPath || json.pdfPath);
        if (json.texSource) setTexSource(json.texSource);
        if (json.resume?.data) setResumeData(json.resume.data);
        if (json.resume?.title) setTitle(json.resume.title);
        if (json.resume?.revisions) setRevisions(json.resume.revisions);
        if (json.resume?.messages) setMessages(json.resume.messages);
        setMobileTab('preview');
      } else {
        setCompilationError(json.error || 'Failed to parse uploaded PDF');
      }
    } catch (err: any) {
      setCompilationError(err.message || 'Error uploading file');
    } finally {
      setIsUploadingPdf(false);
    }
  };

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
        setActivePdfUrl(json.resume.pdfPath);
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
    setCompilationError(undefined);

    try {
      const res = await fetch(`/api/resumes/${id}/ai-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction }),
      });
      const json = await res.json();

      if (json.success && json.requiresReview) {
        // Show Google Docs Gemini-style diff suggestions
        setPendingDiffs(json.diffs || []);
        setProposedData(json.proposedData);
        if (json.latestMessage) {
          setMessages((prev) => [...prev, json.latestMessage]);
        }
      } else if (json.success && json.resume) {
        setResumeData(json.resume.data);
        setTemplate(json.resume.template || 'classic');
        setPdfPath(json.resume.pdfPath);
        setActivePdfUrl(json.resume.pdfPath);
        setTexSource(json.resume.texSource || '');
        setRevisions(json.resume.revisions || []);
        setMessages(json.resume.messages || []);
      } else if (json.error) {
        setCompilationError(json.error);
        fetchResumeDetails();
      }
    } catch (err: any) {
      setCompilationError(err.message || 'AI processing encountered an error.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Diff Review Handlers (Accept / Reject per line or all at once)
  const handleAcceptDiffItem = (diffId: string) => {
    setPendingDiffs((prev) =>
      prev.map((d) => (d.id === diffId ? { ...d, status: 'accepted' as const } : d))
    );
  };

  const handleRejectDiffItem = (diffId: string) => {
    setPendingDiffs((prev) =>
      prev.map((d) => (d.id === diffId ? { ...d, status: 'rejected' as const } : d))
    );
  };

  const handleApplyDiffs = async (diffsToApply = pendingDiffs) => {
    if (!resumeData || !proposedData) return;
    setIsApplyingDiffs(true);
    setIsCompiling(true);
    try {
      const merged = applyAcceptedDiffs(resumeData, proposedData, diffsToApply);
      await handleDataChange(merged);
      setPendingDiffs([]);
      setProposedData(null);
    } catch (err: any) {
      setCompilationError(err.message || 'Failed to apply accepted changes.');
    } finally {
      setIsApplyingDiffs(false);
      setIsCompiling(false);
    }
  };

  const handleAcceptAllDiffs = async () => {
    if (!resumeData || !proposedData) return;
    const allAccepted = pendingDiffs.map((d) => ({ ...d, status: 'accepted' as const }));
    setPendingDiffs(allAccepted);
    await handleApplyDiffs(allAccepted);
  };

  const handleRejectAllDiffs = () => {
    setPendingDiffs([]);
    setProposedData(null);
  };

  // Handle Template change
  const handleUpdateTemplate = (newTemplate: TemplateId) => {
    if (!resumeData) return;
    const updated = { ...resumeData, template: newTemplate };
    setTemplate(newTemplate);
    handleDataChange(updated);
  };

  // Handle Manual Recompile — preserves current texSource (including manual edits)
  const handleManualCompile = async () => {
    setIsCompiling(true);
    setCompilationError(undefined);
    try {
      const res = await fetch(`/api/resumes/${id}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texSource }),   // send current state, not regenerated
      });
      const json = await res.json();
      if (json.success) {
        setPdfPath(json.pdfPath);
        setActivePdfUrl(json.pdfPath);
        if (json.texSource) setTexSource(json.texSource);
      } else {
        setCompilationError(json.error || 'Compilation failed');
      }
    } catch (err: any) {
      setCompilationError(err.message || 'Compilation error');
    } finally {
      setIsCompiling(false);
    }
  };

  // Compile custom (manually-edited) LaTeX source
  const handleTexSourceSave = async (newSource: string) => {
    setTexSource(newSource);
    setIsCompiling(true);
    setCompilationError(undefined);
    try {
      const res = await fetch(`/api/resumes/${id}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texSource: newSource }),
      });
      const json = await res.json();
      if (json.success) {
        setPdfPath(json.pdfPath);
        setActivePdfUrl(json.pdfPath);
        if (json.texSource) setTexSource(json.texSource);
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
        setActivePdfUrl(json.resume.pdfPath || json.resume.originalPdfPath);
        setTexSource(json.resume.texSource || '');
        setRevisions(json.resume.revisions || []);
      }
    } catch (err) {
      console.error('Failed to restore revision:', err);
    } finally {
      setIsCompiling(false);
      setIsRevisionsOpen(false);
    }
  };

  const handleDownloadPdf = () => {
    const targetUrl = pdfPath || originalPdfPath;
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    } else {
      handleManualCompile();
    }
  };

  const handleDownloadTex = () => {
    const blob = new Blob([texSource], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F7F9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#7C5CFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#595E68]">Loading your resume workspace...</p>
        </div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F7F9]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-[#E2E4E9] max-w-sm">
          <h2 className="text-lg font-bold text-[#17191C] mb-2">Resume Not Found</h2>
          <p className="text-xs text-[#595E68] mb-4">
            Could not locate this resume in your workspace.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#17191C] hover:bg-black text-white text-xs font-semibold rounded-xl"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentVersion = revisions.length > 0 ? revisions[0].version : 1;

  return (
    <div className="h-screen bg-[#F7F7F9] text-[#17191C] flex flex-col overflow-hidden font-sans">
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
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Google Docs Gemini-style Diff Suggestion Review Bar */}
      {pendingDiffs.length > 0 && (
        <DiffReviewBar
          diffs={pendingDiffs}
          onAcceptItem={handleAcceptDiffItem}
          onRejectItem={handleRejectDiffItem}
          onAcceptAll={handleAcceptAllDiffs}
          onRejectAll={handleRejectAllDiffs}
          onApply={() => handleApplyDiffs()}
          isApplying={isApplyingDiffs}
        />
      )}

      {/* Main Resizable Workspace Layout (Desktop) */}
      <div className="flex-1 hidden md:flex overflow-hidden relative">
        <Group key={isSidebarOpen ? 'layout-3' : 'layout-2'} orientation="horizontal" className="w-full h-full flex">
          {/* Left Panel: Structured Data Form (Collapsible via button or drag) */}
          {isSidebarOpen && (
            <>
              <Panel
                id="left-form"
                defaultSize={26}
                minSize={18}
                maxSize={45}
                className="h-full overflow-hidden"
              >
                <LeftSidebar
                  data={resumeData}
                  onChange={handleDataChange}
                  onClose={() => setIsSidebarOpen(false)}
                />
              </Panel>
              <Separator className="w-1.5 bg-[#E2E4E9] hover:bg-[#7C5CFF] active:bg-[#7C5CFF] transition-colors cursor-col-resize flex items-center justify-center group relative z-10 shrink-0">
                <div className="w-0.5 h-6 bg-[#8A8F9B] group-hover:bg-white rounded-full transition-colors" />
              </Separator>
            </>
          )}

          {/* Center Panel: AI Chat Interface */}
          <Panel
            id="center-chat"
            defaultSize={isSidebarOpen ? 34 : 45}
            minSize={25}
            className="h-full overflow-hidden"
          >
            <CenterChat
              messages={messages}
              onSendMessage={handleSendMessage}
              onUploadResume={handleUploadPdf}
              isProcessing={isAiProcessing}
              isUploading={isUploadingPdf}
              compilationError={compilationError}
              onRetry={handleManualCompile}
            />
          </Panel>

          <Separator className="w-1.5 bg-[#E2E4E9] hover:bg-[#7C5CFF] active:bg-[#7C5CFF] transition-colors cursor-col-resize flex items-center justify-center group relative z-10 shrink-0">
            <div className="w-0.5 h-6 bg-[#8A8F9B] group-hover:bg-white rounded-full transition-colors" />
          </Separator>

          {/* Right Panel: Real PDF Preview (Uploaded & Compiled) & LaTeX Source */}
          <Panel
            id="right-preview"
            defaultSize={isSidebarOpen ? 40 : 55}
            minSize={25}
            className="h-full overflow-hidden"
          >
            <RightPreview
              pdfUrl={activePdfUrl}
              originalPdfPath={originalPdfPath}
              pdfPath={pdfPath}
              texSource={texSource}
              data={resumeData}
              isCompiling={isCompiling}
              onDownloadPdf={handleDownloadPdf}
              onDownloadTex={handleDownloadTex}
              onTexSourceSave={handleTexSourceSave}
              onChangeTexSource={setTexSource}
              onUploadPdf={handleUploadPdf}
              isUploadingPdf={isUploadingPdf}
            />
          </Panel>
        </Group>
      </div>

      {/* Mobile Single Tab View (< md screens) */}
      <div className="flex-1 md:hidden flex flex-col overflow-hidden">
        {mobileTab === 'form' && (
          <div className="flex-1 overflow-hidden">
            <LeftSidebar data={resumeData} onChange={handleDataChange} />
          </div>
        )}
        {mobileTab === 'chat' && (
          <div className="flex-1 overflow-hidden">
            <CenterChat
              messages={messages}
              onSendMessage={handleSendMessage}
              onUploadResume={handleUploadPdf}
              isProcessing={isAiProcessing}
              isUploading={isUploadingPdf}
              compilationError={compilationError}
              onRetry={handleManualCompile}
            />
          </div>
        )}
        {mobileTab === 'preview' && (
          <div className="flex-1 overflow-hidden">
            <RightPreview
              pdfUrl={activePdfUrl}
              originalPdfPath={originalPdfPath}
              pdfPath={pdfPath}
              texSource={texSource}
              data={resumeData}
              isCompiling={isCompiling}
              onDownloadPdf={handleDownloadPdf}
              onDownloadTex={handleDownloadTex}
              onTexSourceSave={handleTexSourceSave}
              onChangeTexSource={setTexSource}
              onUploadPdf={handleUploadPdf}
              isUploadingPdf={isUploadingPdf}
            />
          </div>
        )}

        {/* Mobile Tab Switcher */}
        <div className="border-t border-[#E2E4E9] bg-white flex items-center justify-around py-2 shrink-0">
          <button
            onClick={() => setMobileTab('form')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              mobileTab === 'form' ? 'bg-[#7C5CFF] text-white' : 'text-[#595E68]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Form
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              mobileTab === 'chat' ? 'bg-[#7C5CFF] text-white' : 'text-[#595E68]'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> AI Chat
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              mobileTab === 'preview' ? 'bg-[#7C5CFF] text-white' : 'text-[#595E68]'
            }`}
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>
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
