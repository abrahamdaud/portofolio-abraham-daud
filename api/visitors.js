import { createHash, randomUUID } from 'node:crypto';
import { list, put } from '@vercel/blob';

const VISIT_PREFIX = 'portfolio-visits/';
const RATE_PREFIX = 'portfolio-rate/';
const PAGE_SIZE = 1000;

const COOKIE_NAME = 'ad_visitor';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 730; // 2 tahun
const VISITOR_ID_PATTERN = /^[a-zA-Z0-9_-]{20,64}$/;
const RATE_WINDOW_MS = 60 * 1000; // 1 kunjungan baru per menit per IP

function sendJson(response, status, data) {
  response.status(status).setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.json(data);
}

function hasBlobStore() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
  );
}

async function blobExists(pathname) {
  try {
    const page = await list({ prefix: pathname, limit: 1 });
    return page.blobs.some((blob) => blob.pathname === pathname);
  } catch {
    return false;
  }
}

async function getVisitCount() {
  let total = 0;
  let cursor;

  do {
    const page = await list({ prefix: VISIT_PREFIX, limit: PAGE_SIZE, cursor });
    total += page.blobs.length;
    cursor = page.cursor;
    if (!page.hasMore) break;
  } while (cursor);

  return total;
}

function readCookie(header, name) {
  if (!header) return null;

  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    return decodeURIComponent(part.slice(index + 1).trim());
  }

  return null;
}

function buildVisitorCookie(id, secure) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(id)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${COOKIE_MAX_AGE}`
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function getClientIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return (request.socket && request.socket.remoteAddress) || 'unknown';
}

// Batasi pembuatan kunjungan baru: satu per IP per menit.
// Penanda disimpan sebagai blob terpisah agar tidak ikut terhitung sebagai kunjungan.
async function isRateLimited(request) {
  const windowId = Math.floor(Date.now() / RATE_WINDOW_MS);
  const ipHash = createHash('sha256').update(getClientIp(request)).digest('hex').slice(0, 40);
  const pathname = `${RATE_PREFIX}${windowId}/${ipHash}`;

  if (await blobExists(pathname)) return true;

  try {
    await put(pathname, '1', {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'text/plain'
    });
    return false;
  } catch {
    return true;
  }
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method !== 'GET' && request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return sendJson(response, 405, { error: 'method_not_allowed' });
  }

  if (!hasBlobStore()) {
    return sendJson(response, 503, { error: 'vercel_blob_not_configured' });
  }

  if (request.method === 'GET') {
    try {
      const total = await getVisitCount();
      return sendJson(response, 200, { total });
    } catch {
      return sendJson(response, 503, { error: 'visitor_count_unavailable' });
    }
  }

  const origin = request.headers.origin;
  const requestHost = request.headers['x-forwarded-host'] || request.headers.host;
  if (origin && requestHost) {
    try {
      if (new URL(origin).host !== requestHost) {
        return sendJson(response, 403, { error: 'origin_not_allowed' });
      }
    } catch {
      return sendJson(response, 403, { error: 'origin_not_allowed' });
    }
  }

  const secure = (request.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
  const cookieVisitor = readCookie(request.headers.cookie, COOKIE_NAME);
  const hasVisitorCookie = typeof cookieVisitor === 'string' && VISITOR_ID_PATTERN.test(cookieVisitor);
  const visitorId = hasVisitorCookie ? cookieVisitor : randomUUID().replace(/-/g, '');
  const pathname = `${VISIT_PREFIX}${visitorId}.json`;

  // Pengunjung yang sama (cookie bertahan 2 tahun) tidak dihitung lagi,
  // meskipun membuka tab baru atau memulai ulang browser.
  if (await blobExists(pathname)) {
    if (!hasVisitorCookie) response.setHeader('Set-Cookie', buildVisitorCookie(visitorId, secure));
    return sendJson(response, 200, { recorded: false });
  }

  if (await isRateLimited(request)) {
    response.setHeader('Retry-After', '60');
    return sendJson(response, 429, { error: 'rate_limited' });
  }

  let recorded = false;

  try {
    await put(pathname, JSON.stringify({ createdAt: new Date().toISOString() }), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/json'
    });
    recorded = true;
  } catch (error) {
    if (!(await blobExists(pathname))) {
      return sendJson(response, 503, { error: 'visit_record_failed' });
    }
  }

  if (!hasVisitorCookie) response.setHeader('Set-Cookie', buildVisitorCookie(visitorId, secure));

  return sendJson(response, 200, { recorded });
}
