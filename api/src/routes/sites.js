export default async function siteRoutes(app) {
  // List sites
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const sites = await app.prisma.site.findMany({
      where: { userId: request.user.id },
      include: { _count: { select: { widgets: { where: { enabled: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    // Add embed script to each site
    return sites.map(site => ({
      ...site,
      embedScript: app.getEmbedScript(site.id),
      embedUrl: `${process.env.PUBLIC_URL || ''}/w.js?site=${site.id}`,
    }));
  });

  // Get site by id
  app.get('/:siteId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const site = await app.prisma.site.findFirst({
      where: { id: request.params.siteId, userId: request.user.id },
      include: { widgets: { orderBy: { priority: 'asc' } } },
    });
    if (!site) return reply.status(404).send({ error: 'Site not found' });
    return {
      ...site,
      embedScript: app.getEmbedScript(site.id),
      embedUrl: `${process.env.PUBLIC_URL || ''}/w.js?site=${site.id}`,
    };
  });

  // Create site
  app.post('/', { preHandler: [app.authenticate] }, async (request) => {
    const { name, slug, domain } = request.body;
    const site = await app.prisma.site.create({
      data: { name, slug, domain, userId: request.user.id },
    });
    return {
      ...site,
      embedScript: app.getEmbedScript(site.id),
      embedUrl: `${process.env.PUBLIC_URL || ''}/w.js?site=${site.id}`,
    };
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
    return {
      ...site,
      embedScript: app.getEmbedScript(site.id),
      embedUrl: `${process.env.PUBLIC_URL || ''}/w.js?site=${site.id}`,
    };
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

  // Take screenshot of site using browserless
  app.post('/:siteId/screenshot', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { siteId } = request.params;
    const site = await app.prisma.site.findFirst({
      where: { id: siteId, userId: request.user.id },
    });
    if (!site) return reply.status(404).send({ error: 'Site not found' });

    const domain = site.domain || site.slug + '.example.com';
    const url = domain.startsWith('http') ? domain : `https://${domain}`;

    try {
      // Import puppeteer dynamically
      const puppeteer = await import('puppeteer-core');
      
      // Connect to browserless in docker-dmz
      const browser = await puppeteer.default.connect({
        browserWSEndpoint: process.env.BROWSERLESS_URL || 'ws://browserless:3030',
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });
      
      // Navigate to site with timeout
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);

      // Take screenshot
      const screenshot = await page.screenshot({ 
        type: 'png',
        fullPage: false,
        encoding: 'binary'
      });

      await browser.close();

      // Save screenshot to uploads
      const fs = await import('fs');
      const path = await import('path');
      const uploadsDir = '/app/uploads/screenshots';
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `site_${siteId}.png`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, screenshot);

      // Update site record with screenshot path
      await app.prisma.site.update({
        where: { id: siteId },
        data: { screenshotUrl: `/uploads/screenshots/${filename}` },
      });

      return { 
        success: true, 
        screenshotUrl: `/uploads/screenshots/${filename}` 
      };

    } catch (err) {
      app.log.error('Screenshot failed:', err);
      return reply.status(500).send({ 
        error: 'Screenshot failed', 
        details: err.message 
      });
    }
  });

  // Get screenshot
  app.get('/:siteId/screenshot', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { siteId } = request.params;
    const site = await app.prisma.site.findFirst({
      where: { id: siteId, userId: request.user.id },
    });
    if (!site) return reply.status(404).send({ error: 'Site not found' });

    if (!site.screenshotUrl) {
      return reply.status(404).send({ error: 'Screenshot not found' });
    }

    const fs = await import('fs');
    const filepath = `/app${site.screenshotUrl}`;
    
    if (!fs.existsSync(filepath)) {
      return reply.status(404).send({ error: 'Screenshot file not found' });
    }

    const image = fs.readFileSync(filepath);
    reply.header('Content-Type', 'image/png');
    reply.header('Cache-Control', 'public, max-age=3600');
    return image;
  });
}
