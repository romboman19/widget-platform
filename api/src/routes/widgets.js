import { sanitizeDeep, isValidWidgetType, isAllowedWebhookUrl } from '../lib/security.js';

export default async function widgetRoutes(app) {

  // ─── Helper: verify site ownership ───
  async function verifySite(request, reply) {
    const site = await app.prisma.site.findFirst({
      where: { id: request.params.siteId, userId: request.user.id },
    });
    if (!site) { reply.status(404).send({ error: 'Site not found' }); return null; }
    return site;
  }

  async function verifyWidget(request, reply) {
    const widget = await app.prisma.widget.findFirst({
      where: { id: request.params.widgetId, site: { id: request.params.siteId, userId: request.user.id } },
    });
    if (!widget) { reply.status(404).send({ error: 'Widget not found' }); return null; }
    return widget;
  }

  // ─── Validate and sanitize config (SSRF protection for webhookUrl) ───
  function validateConfig(config) {
    if (!config || typeof config !== 'object') return config;
    const sanitized = sanitizeDeep(config);
    // Validate webhook URL if present
    if (sanitized.webhookUrl) {
      if (!isAllowedWebhookUrl(sanitized.webhookUrl)) {
        throw { statusCode: 400, message: 'Invalid webhook URL — must be external HTTPS URL' };
      }
    }
    return sanitized;
  }

  // ─── List widgets ───
  app.get('/:siteId/widgets', { preHandler: [app.authenticate] }, async (request, reply) => {
    const site = await verifySite(request, reply);
    if (!site) return;
    return app.prisma.widget.findMany({
      where: { siteId: request.params.siteId },
      orderBy: { priority: 'asc' },
    });
  });

  // ─── Get single widget ───
  app.get('/:siteId/widgets/:widgetId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const widget = await verifyWidget(request, reply);
    if (!widget) return;
    return widget;
  });

  // ─── Create widget ───
  app.post('/:siteId/widgets', { preHandler: [app.authenticate] }, async (request, reply) => {
    const site = await verifySite(request, reply);
    if (!site) return;

    const { type, name, config, rules, position, triggers, enabled, priority } = request.body || {};

    if (!isValidWidgetType(type)) {
      return reply.status(400).send({ error: 'Invalid widget type' });
    }

    // Limit widgets per site to prevent abuse
    const count = await app.prisma.widget.count({ where: { siteId: site.id } });
    if (count >= 50) {
      return reply.status(400).send({ error: 'Maximum 50 widgets per site' });
    }

    const widget = await app.prisma.widget.create({
      data: {
        siteId: site.id,
        type,
        name: (name || type).slice(0, 200),
        config: validateConfig(config) || {},
        rules: rules ? sanitizeDeep(rules) : null,
        position: position ? sanitizeDeep(position) : null,
        triggers: triggers ? sanitizeDeep(triggers) : null,
        enabled: enabled !== undefined ? !!enabled : true,
        priority: Math.max(0, Math.min(parseInt(priority) || 0, 999)),
      },
    });
    return widget;
  });

  // ─── Update widget ───
  app.put('/:siteId/widgets/:widgetId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const widget = await verifyWidget(request, reply);
    if (!widget) return;

    const { name, config, rules, position, triggers, enabled, priority } = request.body || {};

    const updated = await app.prisma.widget.update({
      where: { id: request.params.widgetId },
      data: {
        ...(name !== undefined && { name: String(name).slice(0, 200) }),
        ...(config !== undefined && { config: validateConfig(config) }),
        ...(rules !== undefined && { rules: rules ? sanitizeDeep(rules) : null }),
        ...(position !== undefined && { position: position ? sanitizeDeep(position) : null }),
        ...(triggers !== undefined && { triggers: triggers ? sanitizeDeep(triggers) : null }),
        ...(enabled !== undefined && { enabled: !!enabled }),
        ...(priority !== undefined && { priority: Math.max(0, Math.min(parseInt(priority) || 0, 999)) }),
      },
    });
    return updated;
  });

  // ─── Delete widget ───
  app.delete('/:siteId/widgets/:widgetId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const widget = await verifyWidget(request, reply);
    if (!widget) return;
    await app.prisma.widget.delete({ where: { id: request.params.widgetId } });
    return { success: true };
  });

  // ─── Duplicate widget ───
  app.post('/:siteId/widgets/:widgetId/duplicate', { preHandler: [app.authenticate] }, async (request, reply) => {
    const widget = await verifyWidget(request, reply);
    if (!widget) return;
    const { id, createdAt, updatedAt, ...data } = widget;
    const duplicate = await app.prisma.widget.create({
      data: { ...data, name: `${data.name} (copy)`.slice(0, 200) },
    });
    return duplicate;
  });

  // ─── Reorder widgets ───
  app.post('/:siteId/widgets/reorder', { preHandler: [app.authenticate] }, async (request, reply) => {
    const site = await verifySite(request, reply);
    if (!site) return;

    const { updates } = request.body || {};
    if (!Array.isArray(updates)) {
      return reply.status(400).send({ error: 'Updates must be an array' });
    }

    // Validate all widget IDs belong to this site
    const widgetIds = updates.map(u => u.id);
    const widgets = await app.prisma.widget.findMany({
      where: { id: { in: widgetIds }, siteId: site.id },
      select: { id: true },
    });
    const validIds = new Set(widgets.map(w => w.id));

    // Update priorities in transaction
    const transactions = updates
      .filter(u => validIds.has(u.id))
      .map(u =>
        app.prisma.widget.update({
          where: { id: u.id },
          data: { priority: Math.max(0, Math.min(parseInt(u.priority) || 0, 999)) },
        })
      );

    await app.prisma.$transaction(transactions);

    return { success: true };
  });

  // ─── Templates: list global templates ───
  app.get('/templates', async (request, reply) => {
    const templates = await app.prisma.template.findMany({
      orderBy: { usageCount: 'desc' },
      take: 50,
    });
    return templates;
  });

  // ─── Templates: list user templates ───
  app.get('/:siteId/templates', { preHandler: [app.authenticate] }, async (request, reply) => {
    const site = await verifySite(request, reply);
    if (!site) return;

    const templates = await app.prisma.template.findMany({
      where: {
        OR: [
          { userId: request.user.id },
          { isGlobal: true },
        ],
      },
      orderBy: [
        { isGlobal: 'desc' },
        { usageCount: 'desc' },
      ],
      take: 100,
    });
    return templates;
  });

  // ─── Templates: create from widget ───
  app.post('/:siteId/widgets/:widgetId/template', { preHandler: [app.authenticate] }, async (request, reply) => {
    const widget = await verifyWidget(request, reply);
    if (!widget) return;

    const { name, description, isGlobal } = request.body || {};

    const template = await app.prisma.template.create({
      data: {
        userId: request.user.id,
        name: (name || widget.name).slice(0, 100),
        description: (description || '').slice(0, 500),
        type: widget.type,
        config: widget.config || {},
        position: widget.position,
        triggers: widget.triggers,
        rules: widget.rules,
        isGlobal: !!isGlobal,
      },
    });

    return template;
  });

  // ─── Templates: create widget from template ───
  app.post('/:siteId/widgets/from-template/:templateId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const site = await verifySite(request, reply);
    if (!site) return;

    // Support both URL param and body.id
    const templateId = request.params.templateId || request.body?.id;
    
    if (!templateId) {
      return reply.status(400).send({ error: 'templateId or id is required' });
    }

    const template = await app.prisma.template.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId: request.user.id },
          { isGlobal: true },
        ],
      },
    });

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    // Increment usage count
    await app.prisma.template.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    const widget = await app.prisma.widget.create({
      data: {
        siteId: site.id,
        type: template.type,
        name: `${template.name} (from template)`.slice(0, 200),
        config: template.config || {},
        position: template.position,
        triggers: template.triggers,
        rules: template.rules,
        enabled: true,
      },
    });

    return widget;
  });

  // ─── Templates: create widget from template (legacy body.id support) ───
  app.post('/:siteId/widgets/from-template', { preHandler: [app.authenticate] }, async (request, reply) => {
    const site = await verifySite(request, reply);
    if (!site) return;

    const { id: templateId } = request.body || {};
    
    if (!templateId) {
      return reply.status(400).send({ error: 'id is required' });
    }

    const template = await app.prisma.template.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId: request.user.id },
          { isGlobal: true },
        ],
      },
    });

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    // Increment usage count
    await app.prisma.template.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    const widget = await app.prisma.widget.create({
      data: {
        siteId: site.id,
        type: template.type,
        name: `${template.name} (from template)`.slice(0, 200),
        config: template.config || {},
        position: template.position,
        triggers: template.triggers,
        rules: template.rules,
        enabled: true,
      },
    });

    return widget;
  });
}
