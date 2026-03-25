import type { APIRoute } from 'astro';
import { readFileSync } from 'fs';
import { join } from 'path';

export const GET: APIRoute = () => {
  try {
    const data = readFileSync(join(process.cwd(), 'to_evaluate', 'responses.json'), 'utf-8');
    return new Response(data, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'responses.json not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
