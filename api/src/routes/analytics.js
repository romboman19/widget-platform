import { sanitize, isValidPhone, isValidEvent, isAllowedWebhookUrl, createRateLimiter } from '../lib/security.js';

const formLimiter = createRateLimiter(5, 60000);  // 5 forms per IP per minute

export default async function analyticsRoutes(app) {

  // ─── Track event ───
  app.post('/track', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', request.headers.origin || '*');

    const { siteId, widgetId, event, channel, page, device, meta } = request.body || {};

    // Validate required fields
    if (!siteId || typeof siteId !== 'string' || siteId.length > 50) {
      return reply.status(400).send({ error: 'Invalid siteId' });
    }
    if (!isValidEvent(event)) {
      return reply.status(400).send({ error: 'Invalid event type' });
    }

    // Validate siteId exists (prevents fake siteId spam)
    const site = await app.prisma.site.findUnique({ where: { id: siteId }, select: { id: true } });
    if (!site) {
      return reply.status(404).send({ error: 'Site not found' });
    }

    // Fire and forget with sanitized data
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
        // Don't store arbitrary meta from public endpoint
        meta: null,
      },
    }).catch(err => app.log.error('Analytics write failed:', err));

    return { ok: true };
  });

  // ─── Form submission ───
  app.post('/form', { preHandler: [formLimiter] }, async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', request.headers.origin || '*');

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
      reply.header('Access-Control-Allow-Origin', request.headers.origin || '*');
      reply.header('Access-Control-Allow-Methods', 'POST');
      reply.header('Access-Control-Allow-Headers', 'Content-Type');
      reply.header('Access-Control-Max-Age', '86400');
      return reply.status(204).send();
    });
  }
}
