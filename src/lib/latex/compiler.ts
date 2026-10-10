import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execPromise = promisify(exec);

export interface CompileResult {
  success: boolean;
  pdfBuffer?: Buffer;
  pdfRelativePath?: string;
  error?: string;
  latexLogs?: string;
}

/**
 * Compile LaTeX → PDF.
 * Strategy (in order):
 *   1. Local tectonic binary (if installed)
 *   2. YtoTech latex-on-http cloud API (no install needed)
 */
export async function compileLatexToPdf(
  texSource: string,
  resumeId: string = 'temp'
): Promise<CompileResult> {
  // ── 1. Try local tectonic ──────────────────────────────────────────────────
  if (await checkTectonic()) {
    return compileTectonic(texSource, resumeId);
  }
  // ── 2. Fallback: YtoTech latex-on-http (open-source, free, reliable) ──────
  return compileCloud(texSource, resumeId);
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function checkTectonic(): Promise<boolean> {
  try {
    await execPromise('tectonic --version', { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

async function compileTectonic(texSource: string, resumeId: string): Promise<CompileResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'promptcv-'));
  const texFilePath = path.join(tmpDir, 'resume.tex');
  try {
    await fs.writeFile(texFilePath, texSource, 'utf8');
    const { stdout, stderr } = await execPromise(
      `tectonic "${texFilePath}" --outdir "${tmpDir}"`,
      { timeout: 30000 }
    );
    const pdfBuffer = await fs.readFile(path.join(tmpDir, 'resume.pdf'));
    const relPath = await savePdf(pdfBuffer, resumeId);
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    return { success: true, pdfBuffer, pdfRelativePath: relPath, latexLogs: stdout || stderr };
  } catch (err: any) {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    const msg = err.stderr || err.stdout || err.message || 'tectonic failed';
    return { success: false, error: friendlyError(msg), latexLogs: msg };
  }
}

async function compileCloud(texSource: string, resumeId: string): Promise<CompileResult> {
  // YtoTech latex-on-http: POST JSON, returns PDF binary
  // Docs: https://github.com/YtoTech/latex-on-http
  const ENDPOINTS = [
    'https://latex.ytotech.com/builds/sync',
    // Fallback: texlive2021.latexonline.cc (GET with base64 body)
  ];

  for (const endpoint of ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 50000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiler: 'pdflatex',
          resources: [
            { main: true, content: texSource },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        console.warn(`Cloud compile ${endpoint} failed (${res.status}):`, errText.slice(0, 200));
        continue; // try next endpoint
      }

      const arrayBuf = await res.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuf);

      // Sanity check — PDF starts with %PDF
      if (!pdfBuffer.slice(0, 4).toString().startsWith('%PDF')) {
        const snippet = pdfBuffer.slice(0, 300).toString('utf8');
        console.warn('Cloud returned non-PDF:', snippet);
        continue;
      }

      const relPath = await savePdf(pdfBuffer, resumeId);
      return {
        success: true,
        pdfBuffer,
        pdfRelativePath: relPath,
        latexLogs: `Compiled via ${endpoint}`,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('Cloud compile timed out at', endpoint);
        continue;
      }
      console.warn('Cloud compile error at', endpoint, err.message);
    }
  }

  return {
    success: false,
    error:
      'PDF compilation failed. Tectonic is not installed and cloud compiler is unreachable. ' +
      'Copy the LaTeX source and paste it on overleaf.com to compile.',
  };
}

async function savePdf(pdfBuffer: Buffer, resumeId: string): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'compiled');
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${resumeId}-${Date.now()}.pdf`;
  await fs.writeFile(path.join(dir, fileName), pdfBuffer);
  return `/compiled/${fileName}`;
}

function friendlyError(msg: string): string {
  if (msg.includes('Undefined control sequence')) return 'LaTeX Error: Undefined control sequence.';
  if (msg.includes('File not found')) return 'LaTeX Error: Required package or file missing.';
  if (msg.includes('ETIMEDOUT')) return 'Compile timeout (30s).';
  return `Compile Error: ${msg.split('\n')[0]}`;
}
