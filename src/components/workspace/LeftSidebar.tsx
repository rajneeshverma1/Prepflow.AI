'use client';

import React, { useState } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResumeData,
  WorkExperience,
  Education,
  Project,
  SkillCategory,
} from '@/lib/types/resume';

interface LeftSidebarProps {
  data: ResumeData;
  onChange: (updated: ResumeData) => void;
  onClose?: () => void;
}

export function LeftSidebar({ data, onChange, onClose }: LeftSidebarProps) {
  // Collapsible accordion state for each section
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    summary: false,
    experience: true,
    education: false,
    projects: false,
    skills: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
    setOpenSections((prev) => ({ ...prev, experience: true }));
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

  // Education handlers
  const addEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      institution: 'University Name',
      degree: 'B.S. in Computer Science',
      startDate: '2020',
      endDate: '2024',
      gpa: '3.8',
    };
    onChange({
      ...data,
      education: [...data.education, newEdu],
    });
    setOpenSections((prev) => ({ ...prev, education: true }));
  };

  const removeEdu = (index: number) => {
    onChange({
      ...data,
      education: data.education.filter((_, i) => i !== index),
    });
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
    setOpenSections((prev) => ({ ...prev, projects: true }));
  };

  const removeProj = (index: number) => {
    onChange({ ...data, projects: data.projects.filter((_, i) => i !== index) });
  };

  // Skills handlers
  const addSkillCategory = () => {
    const newCategory: SkillCategory = {
      id: `skill-${Date.now()}`,
      category: 'New Category',
      items: ['Skill 1', 'Skill 2'],
    };
    onChange({
      ...data,
      skills: [...data.skills, newCategory],
    });
    setOpenSections((prev) => ({ ...prev, skills: true }));
  };

  const removeSkillCategory = (index: number) => {
    onChange({
      ...data,
      skills: data.skills.filter((_, i) => i !== index),
    });
  };

  return (
    <aside className="w-full h-full bg-white border-r border-[#E2E4E9] flex flex-col overflow-hidden text-[#17191C]">
      {/* Top Header */}
      <div className="h-11 px-3.5 border-b border-[#E2E4E9] flex items-center justify-between shrink-0 bg-[#F7F7F9]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#7C5CFF]" />
          <span className="text-xs font-bold text-[#17191C]">Structured Form Editor</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#8A8F9B] hover:text-[#17191C] hover:bg-white transition-colors"
            title="Collapse Form Editor"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Accordion List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {/* 1. PERSONAL INFORMATION */}
        <div className="border border-[#E2E4E9] rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => toggleSection('personal')}
            className="w-full px-3 py-2.5 bg-[#F7F7F9] hover:bg-[#F0F1F5] flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#7C5CFF]" />
              <span className="font-semibold text-xs text-[#17191C]">Personal Information</span>
            </div>
            {openSections.personal ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#8A8F9B]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#8A8F9B]" />
            )}
          </button>

          {openSections.personal && (
            <div className="p-3 space-y-2.5 border-t border-[#E2E4E9]">
              <div>
                <label className="block text-[11px] font-medium text-[#595E68] mb-1">Full Name</label>
                <input
                  type="text"
                  value={data.personal.fullName}
                  onChange={(e) => updatePersonal('fullName', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] focus:bg-white focus:border-[#7C5CFF] text-[#17191C] focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#595E68] mb-1">Target Job Title</label>
                <input
                  type="text"
                  value={data.personal.jobTitle}
                  onChange={(e) => updatePersonal('jobTitle', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] focus:bg-white focus:border-[#7C5CFF] text-[#17191C] focus:outline-hidden text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#595E68] mb-1">Email</label>
                  <input
                    type="email"
                    value={data.personal.email}
                    onChange={(e) => updatePersonal('email', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] focus:bg-white focus:border-[#7C5CFF] text-[#17191C] focus:outline-hidden text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#595E68] mb-1">Phone</label>
                  <input
                    type="text"
                    value={data.personal.phone}
                    onChange={(e) => updatePersonal('phone', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] focus:bg-white focus:border-[#7C5CFF] text-[#17191C] focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#595E68] mb-1">Location</label>
                <input
                  type="text"
                  value={data.personal.location}
                  onChange={(e) => updatePersonal('location', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] focus:bg-white focus:border-[#7C5CFF] text-[#17191C] focus:outline-hidden text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#595E68] mb-1">GitHub</label>
                  <input
                    type="text"
                    value={data.personal.github || ''}
                    onChange={(e) => updatePersonal('github', e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-2 py-1.5 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] focus:bg-white focus:border-[#7C5CFF] text-[#17191C] focus:outline-hidden text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#595E68] mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={data.personal.linkedin || ''}
                    onChange={(e) => updatePersonal('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-2 py-1.5 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] focus:bg-white focus:border-[#7C5CFF] text-[#17191C] focus:outline-hidden text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. PROFESSIONAL SUMMARY */}
        <div className="border border-[#E2E4E9] rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => toggleSection('summary')}
            className="w-full px-3 py-2.5 bg-[#F7F7F9] hover:bg-[#F0F1F5] flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#7C5CFF]" />
              <span className="font-semibold text-xs text-[#17191C]">Professional Summary</span>
            </div>
            {openSections.summary ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#8A8F9B]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#8A8F9B]" />
            )}
          </button>

          {openSections.summary && (
            <div className="p-3 border-t border-[#E2E4E9]">
              <textarea
                rows={4}
                value={data.summary}
                onChange={(e) => updateSummary(e.target.value)}
                placeholder="Brief summary of your professional background and key achievements..."
                className="w-full p-2.5 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] focus:bg-white focus:border-[#7C5CFF] text-[#17191C] focus:outline-hidden leading-relaxed text-xs"
              />
            </div>
          )}
        </div>

        {/* 3. WORK EXPERIENCE */}
        <div className="border border-[#E2E4E9] rounded-xl overflow-hidden bg-white">
          <div className="w-full px-3 py-2.5 bg-[#F7F7F9] flex items-center justify-between">
            <button
              onClick={() => toggleSection('experience')}
              className="flex items-center gap-2 flex-1 text-left"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#7C5CFF]" />
              <span className="font-semibold text-xs text-[#17191C]">
                Work Experience ({data.experience.length})
              </span>
              {openSections.experience ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#8A8F9B] ml-1" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#8A8F9B] ml-1" />
              )}
            </button>
            <button
              onClick={addExperience}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#7C5CFF]/10 text-[#7C5CFF] hover:bg-[#7C5CFF]/20 font-semibold text-[11px]"
              title="Add Experience"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {openSections.experience && (
            <div className="p-3 space-y-3 border-t border-[#E2E4E9]">
              {data.experience.map((exp, idx) => (
                <div
                  key={exp.id || idx}
                  className="p-3 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={exp.company}
                      onChange={(e) => updateExp(idx, { ...exp, company: e.target.value })}
                      className="font-bold text-xs px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C] flex-1"
                    />
                    <button
                      onClick={() => removeExp(idx)}
                      className="text-[#8A8F9B] hover:text-red-500 p-1"
                      title="Delete experience"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Job Title"
                    value={exp.position}
                    onChange={(e) => updateExp(idx, { ...exp, position: e.target.value })}
                    className="w-full text-xs px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C]"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Start (e.g. 2022)"
                      value={exp.startDate}
                      onChange={(e) => updateExp(idx, { ...exp, startDate: e.target.value })}
                      className="w-full text-xs px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C]"
                    />
                    <input
                      type="text"
                      placeholder="End (e.g. Present)"
                      value={exp.endDate}
                      onChange={(e) => updateExp(idx, { ...exp, endDate: e.target.value })}
                      className="w-full text-xs px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C]"
                    />
                  </div>

                  {/* Bullet points */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] uppercase font-bold text-[#8A8F9B]">Highlights / Bullets</label>
                    {exp.highlights.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-1">
                        <textarea
                          rows={2}
                          value={bullet}
                          onChange={(e) => {
                            const newHighlights = [...exp.highlights];
                            newHighlights[bIdx] = e.target.value;
                            updateExp(idx, { ...exp, highlights: newHighlights });
                          }}
                          className="flex-1 text-[11px] p-1.5 rounded border border-[#E2E4E9] bg-white text-[#17191C] leading-snug"
                        />
                        <button
                          onClick={() => {
                            const newHighlights = exp.highlights.filter((_, i) => i !== bIdx);
                            updateExp(idx, { ...exp, highlights: newHighlights });
                          }}
                          className="text-[#8A8F9B] hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        updateExp(idx, {
                          ...exp,
                          highlights: [...exp.highlights, 'New achievement highlight...'],
                        });
                      }}
                      className="text-[11px] text-[#7C5CFF] hover:underline font-medium flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3 h-3" /> Add bullet point
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. EDUCATION */}
        <div className="border border-[#E2E4E9] rounded-xl overflow-hidden bg-white">
          <div className="w-full px-3 py-2.5 bg-[#F7F7F9] flex items-center justify-between">
            <button
              onClick={() => toggleSection('education')}
              className="flex items-center gap-2 flex-1 text-left"
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#7C5CFF]" />
              <span className="font-semibold text-xs text-[#17191C]">
                Education ({data.education.length})
              </span>
              {openSections.education ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#8A8F9B] ml-1" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#8A8F9B] ml-1" />
              )}
            </button>
            <button
              onClick={addEducation}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#7C5CFF]/10 text-[#7C5CFF] hover:bg-[#7C5CFF]/20 font-semibold text-[11px]"
              title="Add Education"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {openSections.education && (
            <div className="p-3 space-y-3 border-t border-[#E2E4E9]">
              {data.education.map((edu, idx) => (
                <div
                  key={edu.id || idx}
                  className="p-3 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => {
                        const copy = [...data.education];
                        copy[idx].institution = e.target.value;
                        onChange({ ...data, education: copy });
                      }}
                      className="font-bold text-xs px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C] flex-1"
                    />
                    <button
                      onClick={() => removeEdu(idx)}
                      className="text-[#8A8F9B] hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Degree (e.g. B.S. in Computer Science)"
                    value={edu.degree}
                    onChange={(e) => {
                      const copy = [...data.education];
                      copy[idx].degree = e.target.value;
                      onChange({ ...data, education: copy });
                    }}
                    className="w-full text-xs px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C]"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Start (e.g. 2019)"
                      value={edu.startDate}
                      onChange={(e) => {
                        const copy = [...data.education];
                        copy[idx].startDate = e.target.value;
                        onChange({ ...data, education: copy });
                      }}
                      className="w-full text-xs px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C]"
                    />
                    <input
                      type="text"
                      placeholder="End (e.g. 2023)"
                      value={edu.endDate}
                      onChange={(e) => {
                        const copy = [...data.education];
                        copy[idx].endDate = e.target.value;
                        onChange({ ...data, education: copy });
                      }}
                      className="w-full text-xs px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. PROJECTS */}
        <div className="border border-[#E2E4E9] rounded-xl overflow-hidden bg-white">
          <div className="w-full px-3 py-2.5 bg-[#F7F7F9] flex items-center justify-between">
            <button
              onClick={() => toggleSection('projects')}
              className="flex items-center gap-2 flex-1 text-left"
            >
              <Code className="w-3.5 h-3.5 text-[#7C5CFF]" />
              <span className="font-semibold text-xs text-[#17191C]">
                Key Projects ({data.projects.length})
              </span>
              {openSections.projects ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#8A8F9B] ml-1" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#8A8F9B] ml-1" />
              )}
            </button>
            <button
              onClick={addProject}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#7C5CFF]/10 text-[#7C5CFF] hover:bg-[#7C5CFF]/20 font-semibold text-[11px]"
              title="Add Project"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {openSections.projects && (
            <div className="p-3 space-y-3 border-t border-[#E2E4E9]">
              {data.projects.map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  className="p-3 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={proj.name}
                      onChange={(e) => {
                        const copy = [...data.projects];
                        copy[idx].name = e.target.value;
                        onChange({ ...data, projects: copy });
                      }}
                      className="font-bold text-xs px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C] flex-1"
                    />
                    <button
                      onClick={() => removeProj(idx)}
                      className="text-[#8A8F9B] hover:text-red-500 p-1"
                    >
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
                    className="w-full p-2 text-xs rounded border border-[#E2E4E9] bg-white text-[#17191C]"
                  />

                  <input
                    type="text"
                    placeholder="Tech Stack (comma separated)"
                    value={proj.techStack?.join(', ') || ''}
                    onChange={(e) => {
                      const copy = [...data.projects];
                      copy[idx].techStack = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      onChange({ ...data, projects: copy });
                    }}
                    className="w-full text-xs px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. TECHNICAL SKILLS */}
        <div className="border border-[#E2E4E9] rounded-xl overflow-hidden bg-white">
          <div className="w-full px-3 py-2.5 bg-[#F7F7F9] flex items-center justify-between">
            <button
              onClick={() => toggleSection('skills')}
              className="flex items-center gap-2 flex-1 text-left"
            >
              <Award className="w-3.5 h-3.5 text-[#7C5CFF]" />
              <span className="font-semibold text-xs text-[#17191C]">
                Skills Matrix ({data.skills.length})
              </span>
              {openSections.skills ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#8A8F9B] ml-1" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#8A8F9B] ml-1" />
              )}
            </button>
            <button
              onClick={addSkillCategory}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#7C5CFF]/10 text-[#7C5CFF] hover:bg-[#7C5CFF]/20 font-semibold text-[11px]"
              title="Add Skill Category"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {openSections.skills && (
            <div className="p-3 space-y-2 border-t border-[#E2E4E9]">
              {data.skills.map((sk, idx) => (
                <div
                  key={sk.id || idx}
                  className="p-2.5 rounded-lg border border-[#E2E4E9] bg-[#F7F7F9] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={sk.category}
                      onChange={(e) => {
                        const copy = [...data.skills];
                        copy[idx].category = e.target.value;
                        onChange({ ...data, skills: copy });
                      }}
                      className="font-bold text-xs px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C] flex-1"
                    />
                    <button
                      onClick={() => removeSkillCategory(idx)}
                      className="text-[#8A8F9B] hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Items separated by commas"
                    value={sk.items.join(', ')}
                    onChange={(e) => {
                      const copy = [...data.skills];
                      copy[idx].items = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      onChange({ ...data, skills: copy });
                    }}
                    className="w-full px-2 py-1 rounded border border-[#E2E4E9] bg-white text-[#17191C] text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
