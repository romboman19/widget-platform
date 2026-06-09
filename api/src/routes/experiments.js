import { sanitizeDeep } from '../lib/security.js';

export default async function experimentRoutes(app) {

  // ─── Helper: verify site ownership ───
  async function verifySite(request, reply) {
    const site = await app.prisma.site.findFirst({
      where: { id: request.params.siteId, userId: request.user.id },
    });
    if (!site) { reply.status(404).send({ error: 'Site not found' }); return null; }
    return site;
  }

  async function verifyExperiment(request, reply) {
    const experiment = await app.prisma.experiment.findFirst({
      where: { 
        id: request.params.experimentId, 
        site: { id: request.params.siteId, userId: request.user.id } 
      },
    });
    if (!experiment) { reply.status(404).send({ error: 'Experiment not found' }); return null; }
    return experiment;
  }

  // ─── List experiments ───
  app.get('/:siteId/experiments', { preHandler: [app.authenticate] }, async (request, reply) => {
    const site = await verifySite(request, reply);
    if (!site) return;
    
    return app.prisma.experiment.findMany({
      where: { siteId: request.params.siteId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { analytics: true } }
      }
    });
  });

  // ─── Get single experiment ───
  app.get('/:siteId/experiments/:experimentId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const experiment = await verifyExperiment(request, reply);
    if (!experiment) return;
    
    // Get analytics summary
    const variantStats = await app.prisma.analyticsEvent.groupBy({
      by: ['variantId'],
      where: { experimentId: experiment.id },
      _count: true,
    });
    
    return { ...experiment, variantStats };
  });

  // ─── Create experiment ───
  app.post('/:siteId/experiments', { preHandler: [app.authenticate] }, async (request, reply) => {
    const site = await verifySite(request, reply);
    if (!site) return;

    const { name, trafficAllocation, variants, startDate, endDate } = request.body || {};

    // Validate variants
    if (!Array.isArray(variants) || variants.length < 2) {
      return reply.status(400).send({ error: 'Experiment requires at least 2 variants' });
    }

    // Verify all widget IDs belong to this site
    const widgetIds = variants.map(v => v.widgetId);
    const widgets = await app.prisma.widget.findMany({
      where: { id: { in: widgetIds }, siteId: site.id },
      select: { id: true },
    });
    
    if (widgets.length !== widgetIds.length) {
      return reply.status(400).send({ error: 'All variant widgets must belong to this site' });
    }

    const experiment = await app.prisma.experiment.create({
      data: {
        siteId: site.id,
        name: (name || 'New Experiment').slice(0, 200),
        status: 'DRAFT',
        trafficAllocation: Math.max(0, Math.min(parseInt(trafficAllocation) || 50, 100)),
        variants: sanitizeDeep(variants),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    
    // Update widgets with experimentId
    await app.prisma.widget.updateMany({
      where: { id: { in: widgetIds } },
      data: { experimentId: experiment.id },
    });
    
    return experiment;
  });

  // ─── Update experiment ───
  app.put('/:siteId/experiments/:experimentId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const experiment = await verifyExperiment(request, reply);
    if (!experiment) return;

    const { name, trafficAllocation, variants, startDate, endDate, status } = request.body || {};
    
    // Remove experimentId from old variants if variants changed
    if (variants !== undefined) {
      const oldWidgetIds = (experiment.variants || []).map(v => v.widgetId).filter(Boolean);
      const newWidgetIds = (variants || []).map(v => v.widgetId).filter(Boolean);
      
      // Clear old
      await app.prisma.widget.updateMany({
        where: { id: { in: oldWidgetIds } },
        data: { experimentId: null },
      });
      
      // Set new
      await app.prisma.widget.updateMany({
        where: { id: { in: newWidgetIds } },
        data: { experimentId: experiment.id },
      });
    }

    const updated = await app.prisma.experiment.update({
      where: { id: request.params.experimentId },
      data: {
        ...(name !== undefined && { name: String(name).slice(0, 200) }),
        ...(trafficAllocation !== undefined && { 
          trafficAllocation: Math.max(0, Math.min(parseInt(trafficAllocation) || 50, 100)) 
        }),
        ...(variants !== undefined && { variants: sanitizeDeep(variants) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status !== undefined && { status: ['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED'].includes(status) ? status : experiment.status }),
      },
    });
    return updated;
  });

  // ─── Start experiment ───
  app.post('/:siteId/experiments/:experimentId/start', { preHandler: [app.authenticate] }, async (request, reply) => {
    const experiment = await verifyExperiment(request, reply);
    if (!experiment) return;

    if (experiment.status !== 'DRAFT' && experiment.status !== 'PAUSED') {
      return reply.status(400).send({ error: 'Experiment can only be started from DRAFT or PAUSED state' });
    }

    const updated = await app.prisma.experiment.update({
      where: { id: experiment.id },
      data: { status: 'RUNNING', startDate: new Date() },
    });
    return updated;
  });

  // ─── Pause experiment ───
  app.post('/:siteId/experiments/:experimentId/pause', { preHandler: [app.authenticate] }, async (request, reply) => {
    const experiment = await verifyExperiment(request, reply);
    if (!experiment) return;

    if (experiment.status !== 'RUNNING') {
      return reply.status(400).send({ error: 'Only running experiments can be paused' });
    }

    const updated = await app.prisma.experiment.update({
      where: { id: experiment.id },
      data: { status: 'PAUSED' },
    });
    return updated;
  });

  // ─── Complete experiment ───
  app.post('/:siteId/experiments/:experimentId/complete', { preHandler: [app.authenticate] }, async (request, reply) => {
    const experiment = await verifyExperiment(request, reply);
    if (!experiment) return;

    if (experiment.status === 'COMPLETED') {
      return reply.status(400).send({ error: 'Experiment already completed' });
    }

    const { winnerId } = request.body || {};

    const updated = await app.prisma.experiment.update({
      where: { id: experiment.id },
      data: { 
        status: 'COMPLETED', 
        endDate: new Date(),
        ...(winnerId && { winnerId }),
      },
    });
    
    // Clear experimentId from all widgets
    const widgetIds = (experiment.variants || []).map(v => v.widgetId).filter(Boolean);
    await app.prisma.widget.updateMany({
      where: { id: { in: widgetIds } },
      data: { experimentId: null },
    });
    
    return updated;
  });

  // ─── Delete experiment ───
  app.delete('/:siteId/experiments/:experimentId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const experiment = await verifyExperiment(request, reply);
    if (!experiment) return;
    
    // Clear experimentId from widgets
    const widgetIds = (experiment.variants || []).map(v => v.widgetId).filter(Boolean);
    await app.prisma.widget.updateMany({
      where: { id: { in: widgetIds } },
      data: { experimentId: null },
    });

    await app.prisma.experiment.delete({ where: { id: experiment.id } });
    return { success: true };
  });

  // ─── Get experiment results ───
  app.get('/:siteId/experiments/:experimentId/results', { preHandler: [app.authenticate] }, async (request, reply) => {
    const experiment = await verifyExperiment(request, reply);
    if (!experiment) return;

    // Aggregate stats per variant
    const stats = await app.prisma.analyticsEvent.groupBy({
      by: ['variantId', 'event'],
      where: { experimentId: experiment.id },
      _count: { _all: true },
    });

    // Format for frontend
    const results = {};
    (experiment.variants || []).forEach(v => {
      results[v.widgetId] = {
        views: 0,
        clicks: 0,
        conversions: 0,
      };
    });

    stats.forEach(s => {
      if (!results[s.variantId]) results[s.variantId] = {};
      if (s.event === 'view') results[s.variantId].views = s._count._all;
      if (s.event === 'click') results[s.variantId].clicks = s._count._all;
      if (s.event === 'submit') results[s.variantId].conversions = s._count._all;
    });

    return { experiment, results };
  });
}
