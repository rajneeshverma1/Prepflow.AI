import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFilePromise = promisify(execFile);

/**
 * Extracts clean UTF-8 text from any PDF buffer using pure Node.js runtime worker
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-parse-'));
  const tempPdfPath = path.join(tmpDir, 'input.pdf');
  const tempWorkerPath = path.join(tmpDir, 'worker.cjs');
  const pdfParsePath = path.resolve(process.cwd(), 'node_modules', 'pdf-parse');

  try {
    await fs.writeFile(tempPdfPath, buffer);

    const workerScript = `
const fs = require('fs');
const { PDFParse } = require(${JSON.stringify(pdfParsePath)});

async function run() {
  try {
    const pdfPath = process.argv[2];
    const buf = fs.readFileSync(pdfPath);
    const parser = new PDFParse(new Uint8Array(buf));
    const res = await parser.getText();
    const text = res && typeof res.text === 'string' ? res.text : '';
    process.stdout.write(JSON.stringify({ success: true, text }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ success: false, error: err.message }));
  }
}
run();
`;

    await fs.writeFile(tempWorkerPath, workerScript, 'utf8');

    const { stdout } = await execFilePromise(process.execPath, [tempWorkerPath, tempPdfPath], {
      cwd: process.cwd(),
      timeout: 15000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const parsed = JSON.parse(stdout.trim());
    if (parsed.success && typeof parsed.text === 'string' && parsed.text.trim().length > 5) {
      return parsed.text;
    }
  } catch (err) {
    console.warn('Node PDF worker error:', err);
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }

  // Fallback regex text extractor
  try {
    const rawStr = buffer.toString('binary');
    const strings = rawStr.match(/[\x20-\x7E\s]{4,}/g) || [];
    const text = strings.filter((s) => !s.startsWith('/') && !s.startsWith('%') && s.length > 5).join(' ');
    if (text.length > 20) return text;
  } catch (fallbackErr) {
    console.warn('Fallback string extraction failed:', fallbackErr);
  }

  return '';
}
