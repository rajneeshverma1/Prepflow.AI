'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, RefreshCw, Bot, User, CheckCircle2, ArrowRight, Paperclip, Upload } from 'lucide-react';
import { ChatMessage } from '@/lib/types/resume';

interface CenterChatProps {
  messages: ChatMessage[];
  onSendMessage: (instruction: string) => void;
  onUploadFile?: (file: File) => void;
  isProcessing: boolean;
  compilationError?: string;
  onRetry: () => void;
}

export function CenterChat({
  messages,
  onSendMessage,
  onUploadFile,
  isProcessing,
  compilationError,
  onRetry,
}: CenterChatProps) {
  const [inputPrompt, setInputPrompt] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultSuggestions = [
    'Add my latest internship',
    'Rewrite bullet points with STAR impact metrics',
    'Tailor resume for Senior Full-Stack Engineer',
    'Shorten resume to 1 page',
    'Highlight React & TypeScript experience',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadFile) {
      onUploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 h-[calc(100vh-3.5rem)] flex flex-col bg-[#F7F7F9]">
      {/* Top Section Header */}
      <div className="h-11 border-b border-[#E2E4E9] bg-white px-4 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md glow-purple flex items-center justify-center text-white">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-bold text-[#17191C]">AI Prompt Assistant</span>
        </div>
        <span className="text-[11px] font-semibold text-[#7C5CFF] bg-[#7C5CFF]/10 px-2.5 py-0.5 rounded-full border border-[#7C5CFF]/20">
          Prompt & Upload PDF
        </span>
      </div>

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

      {/* Suggested Prompts Pill Bar */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-[11px] font-semibold text-[#8A8F9B] uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#7C5CFF]" /> Suggested Editing Instructions
          </p>
          <div className="flex flex-wrap gap-2">
            {defaultSuggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => onSendMessage(sug)}
                disabled={isProcessing}
                className="text-xs px-3.5 py-1.5 rounded-full border border-[#E2E4E9] bg-white text-[#595E68] hover:border-[#7C5CFF] hover:text-[#7C5CFF] transition-colors shadow-2xs"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="p-4 border-t border-[#E2E4E9] bg-white">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <form onSubmit={handleSubmit} className="relative flex items-center">
          <textarea
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Prepflow.ai to edit resume, add internship, or upload a new PDF..."
            disabled={isProcessing}
            className="w-full pl-4 pr-20 py-3 text-xs rounded-2xl border border-[#E2E4E9] bg-[#F7F7F9] text-[#17191C] focus:outline-hidden focus:border-[#7C5CFF] resize-none"
          />
          <div className="absolute right-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="p-1.5 rounded-full text-[#8A8F9B] hover:text-[#7C5CFF] hover:bg-white transition-colors"
              title="Upload existing resume (PDF, Image, DOCX)"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isProcessing}
              className="p-2 rounded-full bg-[#17191C] text-white disabled:opacity-40 transition-transform hover:-translate-y-px"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
        <div className="flex items-center justify-between text-[10px] text-[#8A8F9B] mt-1.5 px-1">
          <span>Press Enter to send, Shift+Enter for newline</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Tectonic Worker Active
          </span>
        </div>
      </div>
    </div>
  );
}
