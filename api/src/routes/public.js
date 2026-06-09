export default async function publicRoutes(app) {
  // Get widget config for a site — called by widget.js on visitor's browser
  // Accepts both slug (legacy) and siteId (CUID)
  app.get('/:id', async (request, reply) => {
    const { id } = request.params;

    // Try to find by id first (CUID), then by slug
    let site = await app.prisma.site.findUnique({
      where: { id },
      include: {
        widgets: {
          where: { enabled: true },
          orderBy: { priority: 'asc' },
          select: {
            id: true,
            type: true,
            config: true,
            rules: true,
            position: true,
            triggers: true,
            experimentId: true,
          },
        },
        experiments: {
          where: { status: 'RUNNING' },
          select: {
            id: true,
            trafficAllocation: true,
            variants: true,
          },
        },
      },
    });

    // If not found by id, try by slug
    if (!site) {
      site = await app.prisma.site.findUnique({
        where: { slug: id },
        include: {
          widgets: {
            where: { enabled: true },
            orderBy: { priority: 'asc' },
            select: {
              id: true,
              type: true,
              config: true,
              rules: true,
              position: true,
              triggers: true,
              experimentId: true,
            },
          },
          experiments: {
            where: { status: 'RUNNING' },
            select: {
              id: true,
              trafficAllocation: true,
              variants: true,
            },
          },
        },
      });
    }

    if (!site) {
      return reply.status(404).send({ error: 'Site not found' });
    }

    // Cache for 1 minute
    reply.header('Cache-Control', 'public, max-age=60');
    // Note: CORS handled by nginx

    return {
      siteId: site.id,
      widgets: site.widgets,
      experiments: site.experiments,
    };
  });

  // Preview endpoint for widget editor — returns widget config without auth
  // Used by iframe in admin panel
  app.get('/preview/:siteId/:widgetId', async (request, reply) => {
    const { siteId, widgetId } = request.params;

    const widget = await app.prisma.widget.findFirst({
      where: { id: widgetId, siteId },
    });

    if (!widget) {
      return reply.status(404).send({ error: 'Widget not found' });
    }

    reply.header('Cache-Control', 'no-cache');
    reply.header('Access-Control-Allow-Origin', '*');

    return {
      siteId,
      widgets: [widget],
    };
  });
}
