'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, FileText, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

interface NewResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (params: any) => void;
}

export function NewResumeModal({ isOpen, onClose }: NewResumeModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E4E9] rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl glow-purple flex items-center justify-center text-white">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#17191C]">Upload Existing Resume</h2>
              <p className="text-xs text-[#595E68]">Upload your PDF/Document to open in AI editor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-full text-[#8A8F9B] hover:text-[#17191C] hover:bg-[#F7F7F9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Upload Zone */}
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
                <FileText className="w-6 h-6" />
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
