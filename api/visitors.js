import { list, put } from '@vercel/blob';

const VISIT_PREFIX = 'portfolio-visits/';
const PAGE_SIZE = 1000;

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

async function findVisitRecord(pathname) {
  let cursor;

  do {
    const page = await list({ prefix: VISIT_PREFIX, limit: PAGE_SIZE, cursor });
    if (page.blobs.some((blob) => blob.pathname === pathname)) return true;
    cursor = page.cursor;
    if (!page.hasMore) break;
  } while (cursor);

  return false;
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

  let body = request.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return sendJson(response, 400, { error: 'invalid_json' });
    }
  }

  const sessionId = body && body.sessionId;
  if (typeof sessionId !== 'string' || !/^[a-zA-Z0-9_-]{20,80}$/.test(sessionId)) {
    return sendJson(response, 400, { error: 'invalid_session_id' });
  }

  const pathname = `${VISIT_PREFIX}${sessionId}.json`;

  try {
    await put(pathname, JSON.stringify({ createdAt: new Date().toISOString() }), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/json'
    });
  } catch (error) {
    try {
      if (!(await findVisitRecord(pathname))) throw error;
    } catch {
      return sendJson(response, 503, { error: 'visit_record_failed' });
    }
  }

  return sendJson(response, 200, { recorded: true });
}