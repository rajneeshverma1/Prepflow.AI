'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, RefreshCw, Bot, User, CheckCircle2, ArrowRight, Briefcase, Upload, X, FileText } from 'lucide-react';
import { ChatMessage } from '@/lib/types/resume';

interface CenterChatProps {
  messages: ChatMessage[];
  onSendMessage: (instruction: string) => void;
  isProcessing: boolean;
  compilationError?: string;
  onRetry: () => void;
}

export function CenterChat({
  messages,
  onSendMessage,
  isProcessing,
  compilationError,
  onRetry,
}: CenterChatProps) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [showJdModal, setShowJdModal] = useState(false);
  const [jdText, setJdText] = useState('');
  const [jdRole, setJdRole] = useState('');
  const [isReadingJd, setIsReadingJd] = useState(false);
  const jdFileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleJdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingJd(true);
    try {
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setJdText(text);
      } else {
        // Use parse upload route
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/resumes/parse-upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.extractedText) {
          setJdText(json.extractedText);
        } else if (json.data) {
          setJdText(JSON.stringify(json.data, null, 2));
        }
      }
    } catch (err: any) {
      console.warn('Failed to parse JD file:', err);
    } finally {
      setIsReadingJd(false);
    }
  };

  const handleApplyJd = () => {
    if (!jdText.trim() || isProcessing) return;
    const instruction = `Tailor my resume specifically for this job description${jdRole ? ` (${jdRole})` : ''}. Align skills, project highlights, and experience bullet points to match these requirements:\n\n${jdText.trim()}`;
    onSendMessage(instruction);
    setShowJdModal(false);
    setJdText('');
    setJdRole('');
  };

  const defaultSuggestions = [
    'Add my latest internship',
    'Rewrite bullet points with STAR impact metrics',
    'Tailor resume for Senior Full-Stack Engineer',
    'Shorten resume to 1 page',
    'Switch template to Modern',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPrompt.trim() && !isProcessing) {
      onSendMessage(inputPrompt.trim());
      setInputPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 h-[calc(100vh-3.5rem)] flex flex-col bg-[#F7F7F9]">
      {/* Top Error Notice */}
      {compilationError && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 px-4 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">{compilationError}</span>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-600 text-white font-semibold text-[11px] hover:bg-amber-700 transition-colors shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Retry Compilation
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? 'bg-[#17191C] text-white'
                    : 'glow-purple text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2">
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#17191C] text-white rounded-tr-xs'
                      : msg.isError
                      ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-xs'
                      : 'bg-white border border-[#E2E4E9] text-[#17191C] rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Suggested Action Pills */}
                {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSendMessage(action)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium border border-[#E2E4E9] bg-white text-[#595E68] hover:border-[#7C5CFF] hover:text-[#7C5CFF] transition-all shadow-2xs"
                      >
                        <span>{action}</span>
                        <ArrowRight className="w-3 h-3 text-[#8A8F9B]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* AI Loading State */}
        {isProcessing && (
          <div className="flex gap-3 mr-auto max-w-md animate-pulse">
            <div className="w-7 h-7 rounded-lg glow-purple text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white border border-[#E2E4E9] text-xs text-[#595E68] flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-[#7C5CFF] animate-spin" />
              <span>Analyzing instruction & compiling LaTeX PDF...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Action / Suggestion Bar */}
      <div className="px-4 pb-2 pt-1 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowJdModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#7C5CFF]/30 hover:bg-[#7C5CFF]/20 transition-all shadow-2xs"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Tailor with Job Description</span>
          </button>
          {defaultSuggestions.slice(0, 3).map((sug, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(sug)}
              disabled={isProcessing}
              className="text-xs px-3 py-1 rounded-full border border-[#E2E4E9] bg-white text-[#595E68] hover:border-[#7C5CFF] hover:text-[#7C5CFF] transition-colors shadow-2xs"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-[#E2E4E9] bg-white">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <textarea
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Prepflow.ai to add internships, rewrite bullet points, tailor to job description..."
            disabled={isProcessing}
            className="w-full pl-4 pr-12 py-3 text-xs rounded-2xl border border-[#E2E4E9] bg-[#F7F7F9] text-[#17191C] focus:outline-hidden focus:border-[#7C5CFF] resize-none"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isProcessing}
            className="absolute right-3 p-2 rounded-full bg-[#17191C] text-white disabled:opacity-40 transition-transform hover:-translate-y-px"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-[#8A8F9B] mt-1.5 px-1">
          <span>Press Enter to send, Shift+Enter for newline</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> AI Engine Ready (gemini-3.8-flash)
          </span>
        </div>
      </div>

      {/* Job Description Upload / Paste Modal */}
      {showJdModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E4E9] max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowJdModal(false)}
              className="absolute top-4 right-4 text-[#8A8F9B] hover:text-[#17191C] p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#7C5CFF]/10 text-[#7C5CFF] flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17191C]">Tailor Resume to Job Description</h3>
                <p className="text-[11px] text-[#595E68]">Upload or paste a target job posting to align skills &amp; keywords</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <label className="text-xs font-semibold text-[#17191C] block mb-1">Target Job Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer, ML Engineer"
                  value={jdRole}
                  onChange={(e) => setJdRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E4E9] outline-hidden focus:border-[#7C5CFF]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#17191C]">Job Description Text</label>
                  <button
                    type="button"
                    onClick={() => jdFileInputRef.current?.click()}
                    disabled={isReadingJd}
                    className="text-[11px] text-[#7C5CFF] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isReadingJd ? 'Reading file...' : 'Upload JD (.txt, .pdf)'}</span>
                  </button>
                  <input
                    ref={jdFileInputRef}
                    type="file"
                    accept=".txt,.pdf,.docx,.doc"
                    onChange={handleJdFileUpload}
                    className="hidden"
                  />
                </div>
                <textarea
                  rows={6}
                  placeholder="Paste the full job posting, required qualifications, and key responsibilities here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-[#E2E4E9] outline-hidden focus:border-[#7C5CFF] resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJdModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#595E68] hover:bg-[#F7F7F9]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyJd}
                  disabled={!jdText.trim() || isProcessing}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#17191C] text-white hover:bg-[#272A30] disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" />
                  <span>Tailor Resume with AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
