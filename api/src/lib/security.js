/**
 * Security utilities — input validation, sanitization, SSRF protection
 */

// ─── Input sanitization ───
export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, 1000);
}

export function sanitizeDeep(obj) {
  if (typeof obj === 'string') return sanitize(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeDeep);
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
      result[sanitize(key)] = sanitizeDeep(val);
    }
    return result;
  }
  return obj;
}

// ─── Phone validation ───
export function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return /^\+?\d{7,15}$/.test(cleaned);
}

// ─── URL validation for webhooks (SSRF protection) ───
const BLOCKED_HOSTS = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./, /^169\.254\./, /^0\./, /^fc00:/i,
  /^fe80:/i, /^::1$/, /^localhost$/i,
];

const DOCKER_NAMES = ['postgres', 'api', 'admin', 'nginx', 'host.docker.internal', 'redis', 'db'];

export async function isAllowedWebhookUrl(url) {
  if (typeof url !== 'string') return false;
  let parsed;
  try { parsed = new URL(url); } catch { return false; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') return false;
  const h = parsed.hostname.toLowerCase();
  if (DOCKER_NAMES.includes(h)) return false;
  for (const p of BLOCKED_HOSTS) { if (p.test(h)) return false; }
  // DNS rebinding protection — resolve and check IP
  try {
    const dns = await import('dns/promises');
    const addresses = await dns.resolve4(h);
    for (const ip of addresses) {
      for (const p of BLOCKED_HOSTS) {
        if (p.test(ip)) return false;
      }
    }
  } catch { return false; }
  return true;
}

// ─── Allowed event types ───
const ALLOWED_EVENTS = ['view', 'click', 'submit', 'open', 'close'];
export function isValidEvent(event) {
  return typeof event === 'string' && ALLOWED_EVENTS.includes(event);
}

// ─── Application-level rate limiter (backup to nginx) ───
export function normalizeSiteOrigin(value) {
  if (!value || typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  try {
    const url = raw.startsWith('http://') || raw.startsWith('https://') ? new URL(raw) : new URL(`https://${raw}`);
    return `${url.protocol}//${url.hostname}`.toLowerCase();
  } catch {
    return null;
  }
}

export function originMatchesSite(origin, siteDomain) {
  const normalizedOrigin = normalizeSiteOrigin(origin);
  const normalizedSite = normalizeSiteOrigin(siteDomain);
  if (!normalizedOrigin || !normalizedSite) return false;
  const originUrl = new URL(normalizedOrigin);
  const siteUrl = new URL(normalizedSite);
  if (originUrl.hostname === siteUrl.hostname) return true;
  return originUrl.hostname === `www.${siteUrl.hostname}` || siteUrl.hostname === `www.${originUrl.hostname}`;
}

export function createRateLimiter(maxRequests, windowMs) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of hits) {
      if (now - data.start > windowMs) hits.delete(key);
    }
  }, 60000).unref();

  return async function rateLimit(request, reply) {
    const ip = request.headers['x-real-ip'] || request.ip;
    const now = Date.now();
    const data = hits.get(ip);
    if (!data || now - data.start > windowMs) {
      hits.set(ip, { start: now, count: 1 });
      return;
    }
    data.count++;
    if (data.count > maxRequests) {
      reply.status(429).send({ error: 'Too many requests' });
      throw new Error('rate limited');
    }
  };
}

// ─── Widget type validation ───
const ALLOWED_WIDGET_TYPES = ['FLOATING_MENU', 'POPUP_CALLBACK', 'POPUP_BANNER', 'STICKY_BAR', 'SIDE_TAB', 'CUSTOM_IFRAME'];
export function isValidWidgetType(type) {
  return typeof type === 'string' && ALLOWED_WIDGET_TYPES.includes(type);
}
