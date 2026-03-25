import type { APIRoute } from 'astro';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export const GET: APIRoute = ({ params }) => {
  const filename = params.filename;
  if (!filename) {
    return new Response('Not found', { status: 404 });
  }

  // Prevent path traversal
  if (filename.includes('..') || filename.includes('/')) {
    return new Response('Forbidden', { status: 403 });
  }

  const filePath = join(process.cwd(), 'to_evaluate', filename);
  if (!existsSync(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const ext = extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const buffer = readFileSync(filePath);
  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
