interface Env {
  ASSETS: Fetcher;
  INQUIRIES: KVNamespace;
  /** Optional: set with `wrangler secret put NOTIFY_WEBHOOK` to forward every
   *  submission (email/Slack/Make/Zapier webhook) in addition to storing it. */
  NOTIFY_WEBHOOK?: string;
}

const CANONICAL_HOST = 'ailegalguard.com';
const MAX_BODY_BYTES = 10_000;
const MIN_FILL_MS = 1_500;
const RATE_LIMIT_WINDOW_S = 60;

type InquiryType = 'inquiry' | 'offer' | 'newsletter';

interface InquiryRecord {
  id: string;
  type: InquiryType;
  receivedAt: string;
  ip: string;
  country: string | null;
  userAgent: string | null;
  referrer: string | null;
  path: string | null;
  name: string | null;
  email: string;
  organization: string | null;
  offer: number | null;
  timeline: string | null;
  message: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      ...extra,
    },
  });
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

async function handleInquiry(
  request: Request,
  env: Env,
  url: URL,
  ctx: ExecutionContext,
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        allow: 'POST, OPTIONS',
        'access-control-allow-methods': 'POST',
        'access-control-allow-headers': 'content-type',
        'access-control-allow-origin': url.origin,
        'access-control-max-age': '86400',
      },
    });
  }

  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' }, { allow: 'POST' });
  }

  // Same-origin only — reject cross-site JSON posts.
  const origin = request.headers.get('origin');
  if (origin) {
    let originHost: string;
    try {
      originHost = new URL(origin).hostname;
    } catch {
      return json(403, { ok: false, error: 'bad_origin' });
    }
    if (originHost !== CANONICAL_HOST && originHost !== `www.${CANONICAL_HOST}`) {
      return json(403, { ok: false, error: 'bad_origin' });
    }
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json(415, { ok: false, error: 'expected_json' });
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: 'payload_too_large' });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const email = str(body.email, 254);
  if (!email || !EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: 'invalid_email' });
  }

  // Honeypot + time-to-submit: silently accept so bots cannot learn anything,
  // but never persist the submission (protects the free-plan KV write quota).
  const honeypot = str(body.website, 200);
  const elapsed = typeof body.elapsed === 'number' ? body.elapsed : Number(body.elapsed);
  if (honeypot || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
    return json(200, { ok: true, id: 'ignored' });
  }

  const rawType = str(body.type, 20);
  const type: InquiryType =
    rawType === 'offer' || rawType === 'newsletter' ? rawType : 'inquiry';

  const name = str(body.name, 120);
  const message = str(body.message, 4000);
  if ((type === 'inquiry' || type === 'offer') && !name) {
    return json(400, { ok: false, error: 'name_required' });
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const rateKey = `rl:${ip}`;
  if (await env.INQUIRIES.get(rateKey)) {
    return json(429, { ok: false, error: 'too_many_requests' }, { 'retry-after': String(RATE_LIMIT_WINDOW_S) });
  }

  const offerRaw = str(body.offer, 24);
  const offer = offerRaw ? Number(offerRaw.replace(/[^0-9.]/g, '')) : null;

  const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const record: InquiryRecord = {
    id,
    type,
    receivedAt: new Date().toISOString(),
    ip,
    country: request.headers.get('cf-ipcountry'),
    userAgent: str(request.headers.get('user-agent'), 300),
    referrer: str(request.headers.get('referer'), 500),
    path: str(body.path, 300),
    name,
    email,
    organization: str(body.organization, 200),
    offer: offer !== null && Number.isFinite(offer) ? offer : null,
    timeline: str(body.timeline, 60),
    message,
  };

  try {
    await env.INQUIRIES.put(`inq:${record.receivedAt}:${id}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365,
    });
    await env.INQUIRIES.put(rateKey, id, { expirationTtl: RATE_LIMIT_WINDOW_S });
  } catch {
    return json(503, { ok: false, error: 'storage_unavailable' });
  }

  if (env.NOTIFY_WEBHOOK) {
    ctx.waitUntil(
      fetch(env.NOTIFY_WEBHOOK, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(record),
      }).catch(() => undefined),
    );
  }

  return json(201, { ok: true, id });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    let redirect = false;

    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      redirect = true;
    }

    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      redirect = true;
    }

    if (redirect) {
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/api/inquiry') {
      return handleInquiry(request, env, url, ctx);
    }

    if (url.pathname.startsWith('/api/')) {
      return json(404, { ok: false, error: 'not_found' });
    }

    const response = await env.ASSETS.fetch(request);

    // HTML documents must not be cached long-term at the edge.
    if (response.headers.get('content-type')?.includes('text/html')) {
      const headers = new Headers(response.headers);
      headers.set('cache-control', 'public, max-age=0, must-revalidate');
      return new Response(response.body, { status: response.status, headers });
    }

    return response;
  },
};
