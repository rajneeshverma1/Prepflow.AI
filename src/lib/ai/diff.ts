import { ResumeData, WorkExperience, Project, SkillCategory } from '../types/resume';

export interface ResumeDiffItem {
  id: string;
  section: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects';
  type: 'modify' | 'add' | 'remove';
  title: string;
  oldValue: string;
  newValue: string;
  status: 'pending' | 'accepted' | 'rejected';
  path: string; // internal path to apply change: e.g. "summary", "experience.0.highlights.1"
}

/**
 * Computes granular line-by-line diffs between original and AI-proposed resume data
 */
export function computeResumeDiffs(original: ResumeData, proposed: ResumeData): ResumeDiffItem[] {
  const diffs: ResumeDiffItem[] = [];

  // 1. Personal fields
  const personalFields: Array<{ key: keyof typeof original.personal; label: string }> = [
    { key: 'name', label: 'Full Name' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'location', label: 'Location' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'website', label: 'Website / GitHub' },
  ];
  for (const { key, label } of personalFields) {
    const origVal = String(original.personal[key] || '');
    const propVal = String(proposed.personal[key] || '');
    if (origVal !== propVal && propVal) {
      diffs.push({
        id: `personal-${key}`,
        section: 'personal',
        type: origVal ? 'modify' : 'add',
        title: label,
        oldValue: origVal || '(empty)',
        newValue: propVal,
        status: 'pending',
        path: `personal.${key}`,
      });
    }
  }

  // 2. Summary
  if ((original.summary || '') !== (proposed.summary || '') && proposed.summary) {
    diffs.push({
      id: 'summary',
      section: 'summary',
      type: original.summary ? 'modify' : 'add',
      title: 'Professional Summary',
      oldValue: original.summary || '(empty)',
      newValue: proposed.summary,
      status: 'pending',
      path: 'summary',
    });
  }

  // 3. Experience Highlights
  const maxExp = Math.max(original.experience.length, proposed.experience.length);
  for (let i = 0; i < maxExp; i++) {
    const origExp = original.experience[i];
    const propExp = proposed.experience[i];

    if (!origExp && propExp) {
      diffs.push({
        id: `exp-new-${i}`,
        section: 'experience',
        type: 'add',
        title: `Work Experience: ${propExp.position} at ${propExp.company}`,
        oldValue: '(not present)',
        newValue: `${propExp.position} at ${propExp.company}\n${propExp.highlights.join('\n')}`,
        status: 'pending',
        path: `experience.${i}`,
      });
      continue;
    }

    if (origExp && propExp) {
      const maxH = Math.max(origExp.highlights.length, propExp.highlights.length);
      for (let h = 0; h < maxH; h++) {
        const origH = origExp.highlights[h];
        const propH = propExp.highlights[h];

        if (origH !== propH) {
          if (!origH && propH) {
            diffs.push({
              id: `exp-${i}-h-${h}`,
              section: 'experience',
              type: 'add',
              title: `${propExp.company} (${propExp.position})`,
              oldValue: '(new bullet)',
              newValue: propH,
              status: 'pending',
              path: `experience.${i}.highlights.${h}`,
            });
          } else if (origH && !propH) {
            diffs.push({
              id: `exp-${i}-h-${h}`,
              section: 'experience',
              type: 'remove',
              title: `${origExp.company} (${origExp.position})`,
              oldValue: origH,
              newValue: '(removed)',
              status: 'pending',
              path: `experience.${i}.highlights.${h}`,
            });
          } else if (origH && propH) {
            diffs.push({
              id: `exp-${i}-h-${h}`,
              section: 'experience',
              type: 'modify',
              title: `${origExp.company}: Bullet ${h + 1}`,
              oldValue: origH,
              newValue: propH,
              status: 'pending',
              path: `experience.${i}.highlights.${h}`,
            });
          }
        }
      }
    }
  }

  // 4. Skills
  const maxSkills = Math.max(original.skills.length, proposed.skills.length);
  for (let i = 0; i < maxSkills; i++) {
    const origSkill = original.skills[i];
    const propSkill = proposed.skills[i];

    if (!origSkill && propSkill) {
      diffs.push({
        id: `skill-new-${i}`,
        section: 'skills',
        type: 'add',
        title: `Skills: ${propSkill.category}`,
        oldValue: '(new category)',
        newValue: propSkill.items.join(', '),
        status: 'pending',
        path: `skills.${i}`,
      });
    } else if (origSkill && propSkill) {
      const origList = origSkill.items.join(', ');
      const propList = propSkill.items.join(', ');
      if (origList !== propList) {
        diffs.push({
          id: `skill-${i}`,
          section: 'skills',
          type: 'modify',
          title: `Skills: ${origSkill.category}`,
          oldValue: origList,
          newValue: propList,
          status: 'pending',
          path: `skills.${i}.items`,
        });
      }
    }
  }

  // 5. Projects Highlights
  const maxProj = Math.max(original.projects.length, proposed.projects.length);
  for (let i = 0; i < maxProj; i++) {
    const origP = original.projects[i];
    const propP = proposed.projects[i];
    if (!origP && propP) {
      diffs.push({
        id: `proj-new-${i}`,
        section: 'projects',
        type: 'add',
        title: `Project: ${propP.name}`,
        oldValue: '(new project)',
        newValue: `${propP.name} (${propP.highlights.join('; ')})`,
        status: 'pending',
        path: `projects.${i}`,
      });
    } else if (origP && propP) {
      const maxH = Math.max(origP.highlights.length, propP.highlights.length);
      for (let h = 0; h < maxH; h++) {
        const origH = origP.highlights[h];
        const propH = propP.highlights[h];
        if (origH !== propH) {
          diffs.push({
            id: `proj-${i}-h-${h}`,
            section: 'projects',
            type: origH ? 'modify' : 'add',
            title: `Project ${origP.name}: Bullet ${h + 1}`,
            oldValue: origH || '(new bullet)',
            newValue: propH || '(removed)',
            status: 'pending',
            path: `projects.${i}.highlights.${h}`,
          });
        }
      }
    }
  }

  return diffs;
}

/**
 * Applies accepted diffs onto original resume data to produce final merged state
 */
export function applyAcceptedDiffs(
  original: ResumeData,
  proposed: ResumeData,
  diffs: ResumeDiffItem[]
): ResumeData {
  // Start with a clone of original
  const result: ResumeData = JSON.parse(JSON.stringify(original));

  for (const diff of diffs) {
    if (diff.status !== 'accepted') continue;

    const parts = diff.path.split('.');

    // e.g. path = "summary"
    if (parts.length === 1 && parts[0] === 'summary') {
      result.summary = diff.newValue;
    }
    // e.g. path = "personal.name", "personal.jobTitle", "personal.email", etc.
    else if (parts[0] === 'personal' && parts.length === 2) {
      const field = parts[1] as keyof ResumeData['personal'];
      (result.personal as any)[field] = diff.newValue;
    }
    // e.g. path = "experience.0.highlights.1"
    else if (parts[0] === 'experience' && parts[2] === 'highlights') {
      const expIdx = parseInt(parts[1], 10);
      const hIdx = parseInt(parts[3], 10);
      if (result.experience[expIdx]) {
        if (diff.type === 'remove') {
          result.experience[expIdx].highlights.splice(hIdx, 1);
        } else if (diff.type === 'add') {
          result.experience[expIdx].highlights[hIdx] = diff.newValue;
        } else {
          result.experience[expIdx].highlights[hIdx] = diff.newValue;
        }
      }
    }
    // e.g. path = "experience.0" (new experience)
    else if (parts[0] === 'experience' && parts.length === 2) {
      const expIdx = parseInt(parts[1], 10);
      if (proposed.experience[expIdx]) {
        result.experience.splice(expIdx, 0, JSON.parse(JSON.stringify(proposed.experience[expIdx])));
      }
    }
    // e.g. path = "skills.0.items"
    else if (parts[0] === 'skills' && parts[2] === 'items') {
      const skillIdx = parseInt(parts[1], 10);
      if (result.skills[skillIdx]) {
        result.skills[skillIdx].items = diff.newValue.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    // e.g. path = "skills.0" (new skill category)
    else if (parts[0] === 'skills' && parts.length === 2) {
      const sIdx = parseInt(parts[1], 10);
      if (proposed.skills[sIdx]) {
        result.skills.splice(sIdx, 0, JSON.parse(JSON.stringify(proposed.skills[sIdx])));
      }
    }
    // e.g. path = "projects.0.highlights.1"
    else if (parts[0] === 'projects' && parts[2] === 'highlights') {
      const pIdx = parseInt(parts[1], 10);
      const hIdx = parseInt(parts[3], 10);
      if (result.projects[pIdx]) {
        result.projects[pIdx].highlights[hIdx] = diff.newValue;
      }
    }
  }

  return result;
}
