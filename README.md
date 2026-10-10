# SyncCV (ResumeSync)

> **AI-powered resume tailoring with real-time visual feedback, ATS optimization, and production-grade LaTeX typesetting.**

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-orange?style=flat-square&logo=googlegemini)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tectonic](https://img.shields.io/badge/LaTeX%20Engine-Tectonic-teal?style=flat-square)](https://tectonic-typesetting.github.io/)

---

## Table of Contents

- [Overview](#overview)
- [The Problem vs. The Solution](#the-problem-vs-the-solution)
- [Core Architecture & Capabilities](#core-architecture--capabilities)
- [Workspace Layout](#workspace-layout)
- [Key Features](#key-features)
- [System Architecture & Data Flow](#system-architecture--data-flow)
- [Project Directory Structure](#project-directory-structure)
- [API Reference](#api-reference)
- [Product & Monetization Strategy](#product--monetization-strategy)
- [Getting Started](#getting-started)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [License](#license)

---

## Overview

**SyncCV** is an AI-native resume engineering platform engineered to eliminate the friction of tailoring job applications. Rather than forcing candidates to manually rewrite bullet points or rely on generic AI generators that obliterate personal voice and formatting, SyncCV delivers granular, prompt-driven refinement backed by a **zero-hallucination structured schema**, **instant side-by-side previews**, and **sub-second LaTeX PDF compilation**.

With SyncCV, candidates can import an existing resume (PDF, DOCX, TXT, or image), supply target role requirements, and guide an intelligent editor to optimize bullet points with quantifiable STAR-framework impact, align technical keywords for Applicant Tracking Systems (ATS), and switch between publication-grade typographical templates in real time.

---

## The Problem vs. The Solution

### The Dilemma
In modern recruitment, standard corporate openings attract hundreds of applicants, making precise job-description alignment essential to clear automated ATS filters. However:
- **Manual tailoring is exhausting:** Customizing work history, bullet metrics, and keyword density for dozens of positions takes hours per application.
- **Generic AI chat tools fail:** Pasting resumes into standard chatbots frequently invents unverified achievements, destroys formatting, and introduces awkward phrasing that dilutes the candidate's authentic background.
- **Clunky WYSIWYG editors break layouts:** Web-based document editors frequently introduce margin errors, irregular line breaks, and formatting inconsistencies that fail ATS parsers and look unprofessional to hiring managers.

### The SyncCV Solution
SyncCV bridges the gap between conversational AI agility and typographical precision:
1. **Factual Integrity First:** Resumes are parsed into an explicit, validated TypeScript/Zod schema. Edits modify structured data entities rather than unformatted markdown strings, preserving factual accuracy.
2. **Surgical AI Prompting:** Users command the AI Copilot to refine specific sections (e.g., *"Make bullet points more technical"*, *"Condense to 1 page"*, *"Tailor for Senior Cloud Architect"*).
3. **Automated LaTeX Typography:** Changes are dynamically rendered into pure LaTeX source and compiled using the embedded **Tectonic** engine, generating ATS-compliant, pixel-perfect PDFs ready for submission.

---

## Core Architecture & Capabilities

### 1. Robust Multi-Format Document Ingestion
- Upload resumes as **PDF**, **DOCX**, **TXT**, or **Image**.
- Polyfilled PDF stream parser extracts textual tokens with regex fallback handlers for corrupt streams.
- Structured LLM parser converts raw content into typed `ResumeData` entities (personal details, experience records, education, technical skills, projects, and certifications).

### 2. Multi-Model AI Engine with Resilient Fallback
- **Primary:** Powered by **Google Gemini 2.5 Flash** (`@google/genai`) for high-throughput, low-latency structured JSON generation.
- **Secondary:** Integrated with **OpenAI GPT-4o-mini** for automatic failover.
- **Smart Offline Engine:** Includes a zero-dependency, rule-based transformation engine that enables full local testing and editing even when external API keys are not configured.

### 3. Native LaTeX Rendering & Compilation Pipeline
- Dynamic template generator transforms `ResumeData` into clean, compilable LaTeX syntax.
- Integrated **Tectonic** compiler produces print-ready PDFs without requiring full TeX Live installations.
- Four built-in typography templates:
  - `classic`: Standard single-column corporate layout with clean section dividers.
  - `modern`: Polished contemporary layout with accent headings.
  - `technical`: Engineered for software developers, emphasizing architecture, toolchains, and skill matrices.
  - `minimal`: High-density minimalist design inspired by top-tier tech standards.

### 4. Resilient Dual-Tier Storage Layer
- **Production Mode:** Backed by **Prisma ORM** and PostgreSQL, supporting users, resume documents, revision snapshots, and persistent chat logs.
- **Local Dev / In-Memory Mode:** An automated in-memory store activates if the database connection is offline, ensuring zero friction during local onboarding.

---

## Workspace Layout

The editor provides a unified three-panel workspace designed for rapid iteration:

```
┌───────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
│     LEFT: STRUCTURED FORM     │       CENTER: AI COPILOT      │       RIGHT: LIVE PREVIEW     │
│ ───────────────────────────── │ ───────────────────────────── │ ───────────────────────────── │
│ • Personal Details            │ • Conversational edit feed    │ • Compiled PDF (with zoom)    │
│ • Professional Summary        │ • Quick-action suggestion pills│ • Raw LaTeX source code       │
│ • Experience (add / reorder)  │ • STAR method rewrite trigger │ • One-click PDF download      │
│ • Education & Projects        │ • Error boundary & retries    │ • One-click .tex download     │
│ • Skills Categorization       │ • Tone & density toggles      │ • External tab inspector      │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────────┘
```

- **Left Sidebar:** Direct access to edit granular JSON fields manually without interacting with AI.
- **Center Chat:** Interactive prompt interface with suggested instruction pills, real-time compilation status, and clear assistant summaries.
- **Right Preview:** Synchronized PDF viewer running inside an embedded sandbox, togglable with an inspection tab for raw generated `.tex` code.

---

## Key Features

### Version History & Snapshot Rollback
Every prompt-driven edit and manual adjustment increments a revision version. Candidates can inspect historical versions and restore earlier drafts with a single click, eliminating the risk of losing preferred phrasing.

### Single-Page Density Enforcement
An intelligent single-page constraint module automatically trims extraneous bullets, condenses margins, and prioritizes flagship achievements to ensure the resume fits cleanly on one page.

### ATS-Optimized Structure
All templates adhere to ATS parsing best practices:
- Standardized section headers recognized by major enterprise scanners.
- Clean text streams free of multi-column clipping issues.
- Linear chronological ordering for work history and degrees.

### Instant Artifact Export
- **Compiled PDF:** Directly downloaded with a custom file name based on the candidate's name.
- **Raw LaTeX Source:** Exportable `.tex` file for candidates who wish to edit in Overleaf or local LaTeX environments.

---

## System Architecture & Data Flow

```mermaid
flowchart TD
    A[User Document Upload / Prompt] --> B{Upload Route}
    B -->|Raw PDF / Text| C[Document Text Extractor]
    C --> D[LLM Parser: Gemini 2.5 / Fallback]
    D --> E[Zod Schema Validation: ResumeData]
    E --> F[(Database / In-Memory Store)]
    
    F --> G[Interactive 3-Panel Workspace]
    G -->|User Prompt / Quick Toggle| H[AI Edit Engine]
    H -->|Updated JSON| E
    
    E --> I[LaTeX Renderer: 4 Templates]
    I --> J[Tectonic Compiler Process]
    J -->|Binary Stream| K[Public PDF Asset Store]
    K --> L[Live PDF Preview / Download]
```

---

## Project Directory Structure

```
SyncCV/
├── prisma/
│   └── schema.prisma            # PostgreSQL schema (User, Resume, ResumeRevision, ChatMessage)
├── public/
│   └── compiled/                # Compiled PDF artifacts served to the previewer
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── resumes/
│   │   │       ├── route.ts                 # List & Create resume endpoints
│   │   │       ├── parse-upload/route.ts    # File parser & initial LaTeX compiler
│   │   │       └── [id]/
│   │   │           ├── route.ts             # Get, update, delete, duplicate
│   │   │           ├── ai-edit/route.ts     # Natural language AI instruction handler
│   │   │           ├── compile/route.ts     # Standalone LaTeX compilation endpoint
│   │   │           └── revisions/route.ts   # Snapshot restoration & version history
│   │   ├── editor/
│   │   │   └── [id]/page.tsx   # Three-panel interactive workspace
│   │   ├── globals.css         # Styling system & Sintropix spotlight themes
│   │   ├── layout.tsx          # Root Next.js layout & theme providers
│   │   └── page.tsx            # Landing page with hero upload dropzone
│   ├── components/
│   │   ├── dashboard/          # Landing header, upload modal, resume cards
│   │   ├── theme/              # Light / Dark theme context provider
│   │   └── workspace/          # WorkspaceHeader, LeftSidebar, CenterChat, RightPreview
│   └── lib/
│       ├── ai/
│       │   ├── engine.ts       # Gemini 2.5 / OpenAI / Rule-based edit processor
│       │   ├── parser.ts       # Structured resume parser
│       │   └── prompts.ts      # System prompts & STAR guidelines
│       ├── db/
│       │   ├── client.ts       # Prisma Client singleton
│       │   └── resumeStore.ts  # Dual-mode persistent & in-memory cache
│       ├── latex/
│       │   ├── compiler.ts     # Tectonic child process runner
│       │   ├── renderer.ts     # Template selector
│       │   └── templates/      # Classic, Modern, Technical, Minimal .tex generators
│       ├── sample/             # Default demonstration resumes
│       ├── schema/             # Zod validation schemas
│       └── types/              # TypeScript interfaces for all data structures
├── package.json
└── tsconfig.json
```

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/resumes` | `GET` | Retrieve all resumes ordered by last update. |
| `/api/resumes` | `POST` | Create a new resume from template or initial data. |
| `/api/resumes/parse-upload` | `POST` | Accepts `multipart/form-data` (file or text), extracts text, parses to schema, and compiles initial PDF. |
| `/api/resumes/[id]` | `GET` | Retrieve full resume metadata, revision history, and chat messages. |
| `/api/resumes/[id]` | `PUT` | Update structured resume data or trigger resume duplication. |
| `/api/resumes/[id]` | `DELETE` | Permanently delete a resume record. |
| `/api/resumes/[id]/ai-edit` | `POST` | Execute a natural language instruction against the resume data via Gemini/LLM. |
| `/api/resumes/[id]/compile` | `POST` | Manually recompile the current LaTeX document into PDF. |
| `/api/resumes/[id]/revisions` | `GET` / `POST` | Inspect revision history or restore a specified revision snapshot. |

---

## Product & Monetization Strategy

### 1. Market Opportunity
With average corporate postings receiving 250+ applications, job seekers face a competitive landscape where relevance directly impacts interview conversion rates. Candidates actively invest in tools that improve their efficiency and application quality without compromising accuracy.

### 2. B2C Model
- **Free Tier:** 3 free tailored applications per month with standard templates and full PDF export.
- **Targeted Application Packs:** Low-friction pay-per-application micro-transactions for single-role targeted packages (custom resume + matched cover letter).
- **Pro Tier:** Monthly subscription providing unlimited AI prompt iterations, advanced ATS keyword coverage analysis, and all premium typographical templates.

### 3. B2B Institutional SaaS
- **University Placement Offices & Bootcamps:** White-label licensing for university career centers and accelerator cohorts, enabling students to optimize their credentials for campus hiring drives while giving institutions placement analytics.

---

## Getting Started

### Prerequisites
- **Node.js:** `v18.18+` or `v20+` recommended
- **Package Manager:** `npm`, `pnpm`, or `yarn`
- **Tectonic CLI (Optional for local LaTeX compilation):**
  - macOS: `brew install tectonic`
  - Linux: `cargo install tectonic` or package manager
  - Windows: `winget install tectonic` or download precompiled binary to PATH
  *(Note: If Tectonic is not installed, the platform safely renders the structured resume preview and LaTeX source code directly.)*

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/SyncCV.git
   cd SyncCV
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` or `.env.local` file in the root directory:
   ```env
   # Database (Optional - falls back to high-speed in-memory store if unset)
   DATABASE_URL="postgresql://user:password@localhost:5432/synccv?schema=public"

   # AI Engines (Optional - smart fallback engine activates if unset)
   GEMINI_API_KEY="your-gemini-api-key"
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Initialize Prisma (Optional when using PostgreSQL):**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

---

## Configuration & Environment Variables

| Variable | Description | Required | Default Fallback |
|---|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key used for parsing and prompt-based edits (`gemini-2.5-flash`). | No | Falls back to OpenAI key, then to smart rule-based engine. |
| `OPENAI_API_KEY` | OpenAI API key used for parsing and edits (`gpt-4o-mini`). | No | Falls back to smart rule-based engine. |
| `DATABASE_URL` | PostgreSQL connection string for Prisma ORM. | No | In-memory cache with pre-populated sample profiles. |

---

## License

This project is licensed under the [MIT License](LICENSE).
