export default async function publicRoutes(app) {
  // Get widget config for a site — called by widget.js on visitor's browser
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params;

    const site = await app.prisma.site.findUnique({
      where: { slug },
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
          },
        },
      },
    });

    if (!site) {
      return reply.status(404).send({ error: 'Site not found' });
    }

    // Cache for 1 minute
    reply.header('Cache-Control', 'public, max-age=60');
    reply.header('Access-Control-Allow-Origin', '*');

    return {
      siteId: site.id,
      widgets: site.widgets,
    };
  });
}
