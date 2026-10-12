'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ChevronDown } from 'lucide-react';

interface DashboardHeaderProps {
  onCreateNew: () => void;
}

export function DashboardHeader({ onCreateNew }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#E2E4E9] bg-white/80 backdrop-blur-md px-6 py-3.5 transition-all">
      <nav className="max-w-[1200px] mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-[#17191C]">
              Prepflow.ai
            </span>
            <span className="text-[11px] font-semibold tracking-wider px-2.5 py-0.5 rounded-full bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#7C5CFF]/20">
              AI-Native ERP
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-7 text-[15px] font-normal text-[#17191C]">
          <a href="#how-it-works" className="hover:opacity-60 transition-opacity">
            How it works
          </a>
          <div className="flex items-center gap-1 cursor-pointer hover:opacity-60 transition-opacity">
            <span>Solutions</span>
            <ChevronDown className="w-4 h-4 text-[#8A8F9B]" />
          </div>
          <a href="#integrations" className="hover:opacity-60 transition-opacity">
            Integrations
          </a>
          <a href="#company" className="hover:opacity-60 transition-opacity">
            Company
          </a>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-5">
          <button
            onClick={onCreateNew}
            className="hidden sm:block text-[15px] font-normal text-[#17191C] hover:opacity-60 transition-opacity"
          >
            Sign In
          </button>
          <button
            onClick={onCreateNew}
            className="rounded-full bg-[#17191C] text-white px-5 py-2 text-[15px] font-medium transition-transform hover:-translate-y-px shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Resume</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
