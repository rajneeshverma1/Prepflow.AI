import { ResumeData, TemplateId } from '../types/resume';
import { renderClassicTemplate } from './templates/classic';
import { renderModernTemplate } from './templates/modern';
import { renderTechnicalTemplate } from './templates/technical';
import { renderMinimalTemplate } from './templates/minimal';

export function generateLatexSource(data: ResumeData): string {
  const template: TemplateId = data.template || 'classic';

  switch (template) {
    case 'modern':
      return renderModernTemplate(data);
    case 'technical':
      return renderTechnicalTemplate(data);
    case 'minimal':
      return renderMinimalTemplate(data);
    case 'classic':
    default:
      return renderClassicTemplate(data);
  }
}
