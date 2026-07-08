// Vercel serverless function — replaces the Vite proxy in production.
// Keeps the Gemini API key server-side only; the browser never sees it.
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const key = process.env.GEMINI_KEY ?? '';
  if (!key) {
    return new Response(JSON.stringify({ error: 'Gemini key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const target = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

  const upstream = await fetch(target, {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const responseBody = await upstream.text();
  return new Response(responseBody, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  });
}
