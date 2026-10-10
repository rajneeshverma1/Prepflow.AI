'use client';

import React, { useState } from 'react';
import { User, Briefcase, GraduationCap, Code, Award, FileText, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { ResumeData, WorkExperience, Education, Project, SkillCategory } from '@/lib/types/resume';

interface LeftSidebarProps {
  data: ResumeData;
  onChange: (updated: ResumeData) => void;
}

export function LeftSidebar({ data, onChange }: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'summary' | 'experience' | 'education' | 'projects' | 'skills'>('personal');

  const updatePersonal = (field: string, val: string) => {
    onChange({
      ...data,
      personal: {
        ...data.personal,
        [field]: val,
      },
    });
  };

  const updateSummary = (val: string) => {
    onChange({
      ...data,
      summary: val,
    });
  };

  // Experience handlers
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      company: 'New Company',
      position: 'Software Engineer',
      startDate: '2024',
      endDate: 'Present',
      current: true,
      highlights: ['Developed high-performance features utilizing modern tech stack.'],
    };
    onChange({
      ...data,
      experience: [newExp, ...data.experience],
    });
  };

  const updateExp = (index: number, updatedItem: WorkExperience) => {
    const expCopy = [...data.experience];
    expCopy[index] = updatedItem;
    onChange({ ...data, experience: expCopy });
  };

  const removeExp = (index: number) => {
    const expCopy = data.experience.filter((_, i) => i !== index);
    onChange({ ...data, experience: expCopy });
  };

  // Project handlers
  const addProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: 'New Project',
      description: 'Project description showcasing engineering impact.',
      highlights: ['Key achievement or metric achieved in project.'],
      techStack: ['TypeScript', 'React'],
    };
    onChange({ ...data, projects: [newProj, ...data.projects] });
  };

  const removeProj = (index: number) => {
    onChange({ ...data, projects: data.projects.filter((_, i) => i !== index) });
  };

  return (
    <aside className="w-80 h-[calc(100vh-3.5rem)] border-r border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-[#18181B] flex flex-col shrink-0">
      {/* Navigation tabs */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 p-2 overflow-x-auto text-xs font-medium">
        {[
          { id: 'personal', label: 'Personal', icon: User },
          { id: 'summary', label: 'Summary', icon: FileText },
          { id: 'experience', label: 'Experience', icon: Briefcase },
          { id: 'education', label: 'Education', icon: GraduationCap },
          { id: 'projects', label: 'Projects', icon: Code },
          { id: 'skills', label: 'Skills', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#7C5CFF]/10 text-[#7C5CFF] font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Form Editor */}
      <div className="p-4 overflow-y-auto flex-1 text-xs space-y-4">
        {activeTab === 'personal' && (
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
              Personal Information
            </h4>
            <div>
              <label className="block text-zinc-500 mb-1">Full Name</label>
              <input
                type="text"
                value={data.personal.fullName}
                onChange={(e) => updatePersonal('fullName', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Target Job Title</label>
              <input
                type="text"
                value={data.personal.jobTitle}
                onChange={(e) => updatePersonal('jobTitle', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-500 mb-1">Email</label>
                <input
                  type="email"
                  value={data.personal.email}
                  onChange={(e) => updatePersonal('email', e.target.value)}
                  className="w-full px-2 py-1 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Phone</label>
                <input
                  type="text"
                  value={data.personal.phone}
                  onChange={(e) => updatePersonal('phone', e.target.value)}
                  className="w-full px-2 py-1 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Location</label>
              <input
                type="text"
                value={data.personal.location}
                onChange={(e) => updatePersonal('location', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">GitHub URL</label>
              <input
                type="text"
                value={data.personal.github || ''}
                onChange={(e) => updatePersonal('github', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">LinkedIn URL</label>
              <input
                type="text"
                value={data.personal.linkedin || ''}
                onChange={(e) => updatePersonal('linkedin', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
              Professional Summary
            </h4>
            <textarea
              rows={8}
              value={data.summary}
              onChange={(e) => updateSummary(e.target.value)}
              className="w-full p-3 rounded-lg border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#7C5CFF]"
              placeholder="Write a concise overview of your background, technical skills, and career highlights..."
            />
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
                Work Experience ({data.experience.length})
              </h4>
              <button
                onClick={addExperience}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#7C5CFF]/10 text-[#7C5CFF] hover:bg-[#7C5CFF]/20 font-medium text-[11px]"
              >
                <Plus className="w-3 h-3" /> Add Position
              </button>
            </div>

            {data.experience.map((exp, idx) => (
              <div
                key={exp.id || idx}
                className="p-3 rounded-lg border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {exp.position || 'Position'}
                  </span>
                  <button
                    onClick={() => removeExp(idx)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Company Name"
                  value={exp.company}
                  onChange={(e) => updateExp(idx, { ...exp, company: e.target.value })}
                  className="w-full px-2 py-1 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-zinc-900"
                />

                <input
                  type="text"
                  placeholder="Position Title"
                  value={exp.position}
                  onChange={(e) => updateExp(idx, { ...exp, position: e.target.value })}
                  className="w-full px-2 py-1 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-zinc-900"
                />

                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="Start Date"
                    value={exp.startDate}
                    onChange={(e) => updateExp(idx, { ...exp, startDate: e.target.value })}
                    className="px-2 py-1 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-zinc-900"
                  />
                  <input
                    type="text"
                    placeholder="End Date"
                    value={exp.endDate}
                    onChange={(e) => updateExp(idx, { ...exp, endDate: e.target.value })}
                    className="px-2 py-1 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Highlights (One per line)</label>
                  <textarea
                    rows={4}
                    value={exp.highlights.join('\n')}
                    onChange={(e) =>
                      updateExp(idx, {
                        ...exp,
                        highlights: e.target.value.split('\n').filter((h) => h.trim()),
                      })
                    }
                    className="w-full p-2 text-[11px] rounded border border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
              Education & Degrees
            </h4>
            {data.education.map((edu, idx) => (
              <div key={edu.id || idx} className="p-3 rounded-lg border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
                <input
                  type="text"
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={(e) => {
                    const copy = [...data.education];
                    copy[idx].institution = e.target.value;
                    onChange({ ...data, education: copy });
                  }}
                  className="w-full px-2 py-1 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-zinc-900 font-medium"
                />
                <input
                  type="text"
                  placeholder="Degree (e.g. B.S. in Computer Science)"
                  value={edu.degree}
                  onChange={(e) => {
                    const copy = [...data.education];
                    copy[idx].degree = e.target.value;
                    onChange({ ...data, education: copy });
                  }}
                  className="w-full px-2 py-1 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-zinc-900"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
                Key Projects ({data.projects.length})
              </h4>
              <button
                onClick={addProject}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#7C5CFF]/10 text-[#7C5CFF] hover:bg-[#7C5CFF]/20 font-medium text-[11px]"
              >
                <Plus className="w-3 h-3" /> Add Project
              </button>
            </div>

            {data.projects.map((proj, idx) => (
              <div key={proj.id || idx} className="p-3 rounded-lg border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={proj.name}
                    onChange={(e) => {
                      const copy = [...data.projects];
                      copy[idx].name = e.target.value;
                      onChange({ ...data, projects: copy });
                    }}
                    className="font-semibold px-2 py-1 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-zinc-900 w-full"
                  />
                  <button onClick={() => removeProj(idx)} className="ml-2 text-zinc-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <textarea
                  rows={2}
                  placeholder="Project Description"
                  value={proj.description}
                  onChange={(e) => {
                    const copy = [...data.projects];
                    copy[idx].description = e.target.value;
                    onChange({ ...data, projects: copy });
                  }}
                  className="w-full p-2 text-[11px] rounded border border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-zinc-900"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
              Technical Skills Matrix
            </h4>
            {data.skills.map((sk, idx) => (
              <div key={sk.id || idx} className="p-3 rounded-lg border border-[#E6E1D7] dark:border-[#27272A] bg-zinc-50/50 dark:bg-zinc-900/50 space-y-1.5">
                <input
                  type="text"
                  value={sk.category}
                  onChange={(e) => {
                    const copy = [...data.skills];
                    copy[idx].category = e.target.value;
                    onChange({ ...data, skills: copy });
                  }}
                  className="font-semibold px-2 py-1 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-zinc-900 w-full"
                />
                <input
                  type="text"
                  placeholder="Items separated by commas"
                  value={sk.items.join(', ')}
                  onChange={(e) => {
                    const copy = [...data.skills];
                    copy[idx].items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    onChange({ ...data, skills: copy });
                  }}
                  className="w-full px-2 py-1 rounded border border-[#E6E1D7] dark:border-[#27272A] bg-white dark:bg-zinc-900 text-[11px]"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
