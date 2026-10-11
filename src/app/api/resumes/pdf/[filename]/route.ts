import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Security: sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);

    const uploadPath = path.join(process.cwd(), 'public', 'uploads', safeFilename);
    const compiledPath = path.join(process.cwd(), 'public', 'compiled', safeFilename);

    let filePath: string | null = null;
    try {
      await fs.access(uploadPath);
      filePath = uploadPath;
    } catch {
      try {
        await fs.access(compiledPath);
        filePath = compiledPath;
      } catch {
        // Neither location has the file
        return new NextResponse('PDF document not found', { status: 404 });
      }
    }

    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error('Error serving PDF:', err);
    return new NextResponse('Error loading PDF document', { status: 500 });
  }
}
