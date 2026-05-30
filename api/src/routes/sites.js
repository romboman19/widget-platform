export default async function siteRoutes(app) {
  // List sites
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const sites = await app.prisma.site.findMany({
      where: { userId: request.user.id },
      include: { _count: { select: { widgets: { where: { enabled: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return sites;
  });

  // Get site by id
  app.get('/:siteId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const site = await app.prisma.site.findFirst({
      where: { id: request.params.siteId, userId: request.user.id },
      include: { widgets: { orderBy: { priority: 'asc' } } },
    });
    if (!site) return reply.status(404).send({ error: 'Site not found' });
    return site;
  });

  // Create site
  app.post('/', { preHandler: [app.authenticate] }, async (request) => {
    const { name, slug, domain } = request.body;
    const site = await app.prisma.site.create({
      data: { name, slug, domain, userId: request.user.id },
    });
    return site;
  });

  // Update site
  app.put('/:siteId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const existing = await app.prisma.site.findFirst({
      where: { id: request.params.siteId, userId: request.user.id },
    });
    if (!existing) return reply.status(404).send({ error: 'Site not found' });

    const { name, domain } = request.body;
    const site = await app.prisma.site.update({
      where: { id: request.params.siteId },
      data: { name, domain },
    });
    return site;
  });

  // Delete site
  app.delete('/:siteId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const existing = await app.prisma.site.findFirst({
      where: { id: request.params.siteId, userId: request.user.id },
    });
    if (!existing) return reply.status(404).send({ error: 'Site not found' });

    await app.prisma.site.delete({ where: { id: request.params.siteId } });
    return { success: true };
  });

  // Analytics summary for site
  app.get('/:siteId/analytics', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { siteId } = request.params;
    const { days = 30 } = request.query;

    const existing = await app.prisma.site.findFirst({
      where: { id: siteId, userId: request.user.id },
    });
    if (!existing) return reply.status(404).send({ error: 'Site not found' });

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    // Events by day
    const dailyEvents = await app.prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        event,
        COUNT(*)::int as count
      FROM "AnalyticsEvent"
      WHERE site_id = ${siteId} AND created_at >= ${since}
      GROUP BY DATE(created_at), event
      ORDER BY date ASC
    `;

    // Top channels
    const topChannels = await app.prisma.$queryRaw`
      SELECT
        channel,
        COUNT(*)::int as count
      FROM "AnalyticsEvent"
      WHERE site_id = ${siteId} AND created_at >= ${since} AND channel IS NOT NULL
      GROUP BY channel
      ORDER BY count DESC
      LIMIT 20
    `;

    // Totals
    const totals = await app.prisma.analyticsEvent.groupBy({
      by: ['event'],
      where: { siteId, createdAt: { gte: since } },
      _count: true,
    });

    return { dailyEvents, topChannels, totals };
  });
}
