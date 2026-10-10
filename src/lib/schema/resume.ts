import { z } from 'zod';

export const personalDetailsSchema = z.object({
  fullName: z.string().default('Applicant Name'),
  jobTitle: z.string().default('Professional'),
  email: z.string().default(''),
  phone: z.string().default(''),
  location: z.string().default(''),
  website: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
});

export const workExperienceSchema = z.object({
  id: z.string().default(() => `exp-${Date.now()}`),
  company: z.string().default('Company'),
  position: z.string().default('Role'),
  location: z.string().optional(),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  current: z.boolean().default(false),
  highlights: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
  id: z.string().default(() => `edu-${Date.now()}`),
  institution: z.string().default('University'),
  degree: z.string().default('Degree'),
  fieldOfStudy: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  gpa: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

export const projectSchema = z.object({
  id: z.string().default(() => `proj-${Date.now()}`),
  name: z.string().default('Project'),
  description: z.string().default(''),
  highlights: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  link: z.string().optional(),
});

export const skillCategorySchema = z.object({
  id: z.string().default(() => `sk-${Date.now()}`),
  category: z.string().default('Skills'),
  items: z.array(z.string()).default([]),
});

export const certificationSchema = z.object({
  id: z.string().default(() => `cert-${Date.now()}`),
  name: z.string().default('Certification'),
  issuer: z.string().default('Issuer'),
  date: z.string().default(''),
  url: z.string().optional(),
});

export const customSectionSchema = z.object({
  id: z.string().default(() => `custom-${Date.now()}`),
  title: z.string().default('Custom Section'),
  items: z.array(z.string()).default([]),
});

export const templateIdSchema = z.enum(['classic', 'modern', 'technical', 'minimal']);

export const resumeDataSchema = z.object({
  personal: personalDetailsSchema.default({ fullName: 'Applicant Name', jobTitle: 'Professional', email: '', phone: '', location: '' }),
  summary: z.string().default(''),
  experience: z.array(workExperienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  projects: z.array(projectSchema).default([]),
  skills: z.array(skillCategorySchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  customSections: z.array(customSectionSchema).optional(),
  template: templateIdSchema.default('classic'),
});

export type ResumeDataSchema = z.infer<typeof resumeDataSchema>;
