import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
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
 * Compiles LaTeX source text into a PDF using tectonic CLI
 */
export async function compileLatexToPdf(
  texSource: string,
  resumeId: string = 'temp'
): Promise<CompileResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'promptcv-'));
  const texFilePath = path.join(tmpDir, 'resume.tex');

  try {
    await fs.writeFile(texFilePath, texSource, 'utf8');

    // Execute tectonic compilation with 30s timeout
    const { stdout, stderr } = await execPromise(
      `tectonic "${texFilePath}" --outdir "${tmpDir}"`,
      { timeout: 30000 }
    );

    const pdfFilePath = path.join(tmpDir, 'resume.pdf');
    const pdfBuffer = await fs.readFile(pdfFilePath);

    // Save compiled PDF to public/compiled folder for serving directly over HTTP
    const publicCompiledDir = path.join(process.cwd(), 'public', 'compiled');
    await fs.mkdir(publicCompiledDir, { recursive: true });
    
    const fileName = `${resumeId}-${Date.now()}.pdf`;
    const publicPdfPath = path.join(publicCompiledDir, fileName);
    await fs.writeFile(publicPdfPath, pdfBuffer);

    // Clean up temporary compilation directory asynchronously
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    return {
      success: true,
      pdfBuffer,
      pdfRelativePath: `/compiled/${fileName}`,
      latexLogs: stdout || stderr,
    };
  } catch (err: any) {
    // Clean up temporary directory
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    const errorMessage = err.stderr || err.stdout || err.message || 'LaTeX compilation failed';
    
    // Friendly LaTeX error parser
    let userFriendlyError = 'Failed to compile LaTeX document.';
    if (errorMessage.includes('Undefined control sequence')) {
      userFriendlyError = 'Compilation Error: Undefined control sequence found in LaTeX template.';
    } else if (errorMessage.includes('File not found')) {
      userFriendlyError = 'Compilation Error: Required LaTeX package or file missing.';
    } else if (errorMessage.includes('ETIMEDOUT') || err.killed) {
      userFriendlyError = 'Compilation Timeout: LaTeX compilation took longer than 15 seconds.';
    } else {
      userFriendlyError = `Compilation Error: ${errorMessage.split('\n')[0]}`;
    }

    return {
      success: false,
      error: userFriendlyError,
      latexLogs: errorMessage,
    };
  }
}
