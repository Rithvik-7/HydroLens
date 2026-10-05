import { createServer } from 'node:http';
import { prepareRequest } from './advisor.ts';

const origins = new Set((process.env.ALLOWED_ORIGINS || 'https://hydrolens-water-planner.onrender.com,https://rithvik-7.github.io,http://localhost:4173,http://127.0.0.1:4173').split(','));
const buckets = new Map<string, {start: number; count: number}>();
let active = 0;
function allowed(id: string, limit: number) {
  const now = Date.now();
  for (const [key, value] of buckets) if (now - value.start > 60000) buckets.delete(key);
  const bucket = buckets.get(id) || {start: now, count: 0};
  bucket.count++; buckets.set(id, bucket);
  return bucket.count <= limit;
}
createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const reply = (status: number, data: object) => {res.writeHead(status); res.end(JSON.stringify(data));};
  const origin = req.headers.origin;
  if (origin && !origins.has(origin)) return reply(403, {error: 'Origin not allowed.'});
  if (origin) {res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin');}
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(204); res.end(); return;
  }
  if (req.url === '/health' && req.method === 'GET') return reply(200, {status: 'ok', configured: Boolean(process.env.GEMINI_API_KEY), provider: 'Google Gemini'});
  if (req.url !== '/api/chat' || req.method !== 'POST') return reply(404, {error: 'Not found.'});
  if (!process.env.GEMINI_API_KEY) return reply(503, {error: 'AI is being configured. Please try later.'});
  if (active >= 5 || !allowed('global', 30) || !allowed(req.socket.remoteAddress || 'unknown', 15)) return reply(429, {error: 'The advisor is busy. Please try again in a minute.'});
  if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, {error: 'JSON required.'});
  let payload;
  try {
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of req) {size += chunk.length; if (size > 32000) {reply(413, {error: 'Request too large.'}); return;} chunks.push(chunk);}
    payload = prepareRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  } catch {return reply(400, {error: 'Please send a valid plan and a question of up to 500 characters.'});}
  active++;
  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY},
      body: JSON.stringify(payload), signal: AbortSignal.timeout(45000),
    });
    if (!upstream.ok) {reply(upstream.status === 429 ? 429 : 502, {error: upstream.status === 429 ? 'Google AI quota is temporarily busy. Please retry later.' : 'The AI provider is unavailable. Please retry shortly.'}); return;}
    const data = await upstream.json() as {candidates?: {content?: {parts?: {text?: string}[]}}[]};
    const answer = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!answer) return reply(502, {error: 'The AI could not answer that question. Try rephrasing it.'});
    reply(200, {answer, provider: 'Google Gemini'});
  } catch {reply(502, {error: 'The AI request timed out or could not connect. Please retry.'});}
  finally {active--;}
}).listen(Number(process.env.PORT || 3001), '0.0.0.0', () => console.log('HydroLens advisor server listening'));
