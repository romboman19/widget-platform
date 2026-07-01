import { sanitize, isValidPhone, isValidEvent, isAllowedWebhookUrl, createRateLimiter, originMatchesSite } from '../lib/security.js';

const formLimiter = createRateLimiter(5, 60000);  // 5 forms per IP per minute

export default async function analyticsRoutes(app) {

  function applyCorsForSite(reply, requestOrigin, site) {
    if (!requestOrigin || !site?.domain) return;
    if (originMatchesSite(requestOrigin, site.domain)) {
      reply.header('Access-Control-Allow-Origin', requestOrigin);
      reply.header('Vary', 'Origin');
    }
  }

  async function persistTrack(app, payload, request) {
    const { siteId, widgetId, event, channel, page, device } = payload || {};

    if (!siteId || typeof siteId !== 'string' || siteId.length > 50) {
      return { status: 400, body: { error: 'Invalid siteId' } };
    }
    if (!isValidEvent(event)) {
      return { status: 400, body: { error: 'Invalid event type' } };
    }

    const site = await app.prisma.site.findUnique({ where: { id: siteId }, select: { id: true, domain: true } });
    if (!site) {
      return { status: 404, body: { error: 'Site not found' } };
    }

    app.prisma.analyticsEvent.create({
      data: {
        siteId,
        widgetId: (typeof widgetId === 'string' && widgetId.length <= 50) ? widgetId : null,
        event,
        channel: sanitize(channel) || null,
        page: sanitize(page)?.slice(0, 500) || null,
        device: ['desktop', 'mobile'].includes(device) ? device : null,
        ip: request.headers['x-real-ip'] || request.ip,
        userAgent: (request.headers['user-agent'] || '').slice(0, 500) || null,
        meta: null,
      },
    }).catch(err => app.log.error('Analytics write failed:', err));

    return { status: 200, body: { ok: true }, site };
  }

  // ─── Track event ───
  app.post('/track', async (request, reply) => {
    const result = await persistTrack(app, request.body || {}, request);
    if (result.site) applyCorsForSite(reply, request.headers.origin, result.site);
    return reply.status(result.status).send(result.body);
  });

  app.get('/pixel.gif', async (request, reply) => {
    const result = await persistTrack(app, request.query || {}, request);
    const gif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
    reply.header('Content-Type', 'image/gif');
    reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    reply.header('Content-Length', String(gif.length));
    if (result.status !== 200) return reply.status(200).send(gif);
    return reply.status(200).send(gif);
  });

  app.post('/track', async (request, reply) => {
    const { siteId, widgetId, event, channel, page, device, meta } = request.body || {};


  // ─── Form submission ───
  app.post('/form', { preHandler: [formLimiter] }, async (request, reply) => {
    const { siteId, widgetId, name, phone, page, device, message } = request.body || {};

    // Validate required fields
    if (!siteId || typeof siteId !== 'string') {
      return reply.status(400).send({ error: 'siteId required' });
    }
    if (!isValidPhone(phone)) {
      return reply.status(400).send({ error: 'Invalid phone number' });
    }

    // Validate siteId exists
    const site = await app.prisma.site.findUnique({ where: { id: siteId }, select: { id: true, name: true, domain: true } });
    if (!site) {
      return reply.status(404).send({ error: 'Site not found' });
    }
    applyCorsForSite(reply, request.headers.origin, site);

    const cleanName = sanitize(name)?.slice(0, 100) || '';
    const cleanPhone = sanitize(phone)?.slice(0, 20) || '';
    const cleanMessage = sanitize(message)?.slice(0, 500) || '';
    const cleanPage = sanitize(page)?.slice(0, 500) || '';

    // Track as analytics event
    await app.prisma.analyticsEvent.create({
      data: {
        siteId,
        widgetId: (typeof widgetId === 'string' && widgetId.length <= 50) ? widgetId : null,
        event: 'submit',
        channel: 'callback_form',
        page: cleanPage || null,
        device: ['desktop', 'mobile'].includes(device) ? device : null,
        ip: request.headers['x-real-ip'] || request.ip,
        userAgent: (request.headers['user-agent'] || '').slice(0, 500) || null,
        meta: { name: cleanName, phone: cleanPhone, message: cleanMessage },
      },
    });

    // Forward to n8n webhook if configured
    if (widgetId) {
      const widget = await app.prisma.widget.findUnique({
        where: { id: widgetId },
        select: { config: true },
      });
      const webhookUrl = widget?.config?.webhookUrl;

      if (webhookUrl && isAllowedWebhookUrl(webhookUrl)) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000), // 10s timeout
          body: JSON.stringify({
            site: site.name,
            domain: site.domain,
            name: cleanName,
            phone: cleanPhone,
            message: cleanMessage,
            page: cleanPage,
            device,
            timestamp: new Date().toISOString(),
          }),
        }).catch(err => app.log.error('Webhook forward failed:', err));
      }
    }

    return { ok: true };
  });

  // CORS preflight
  for (const path of ['/track', '/form']) {
    app.options(path, async (request, reply) => {
      const siteId = request.query?.siteId || request.headers['x-site-id'] || request.body?.siteId;
      let site = null;
      if (siteId && typeof siteId === 'string') {
        site = await app.prisma.site.findUnique({ where: { id: siteId }, select: { id: true, domain: true } });
      }
      applyCorsForSite(reply, request.headers.origin, site);
      reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type');
      reply.header('Access-Control-Max-Age', '86400');
      return reply.status(204).send();
    });
  }
}
