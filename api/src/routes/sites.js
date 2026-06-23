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
    const { days = 30, widgetId } = request.query;

    const existing = await app.prisma.site.findFirst({
      where: { id: siteId, userId: request.user.id },
    });
    if (!existing) return reply.status(404).send({ error: 'Site not found' });

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const prismaWhere = widgetId
      ? { siteId, createdAt: { gte: since }, widgetId }
      : { siteId, createdAt: { gte: since } };

    try {
    // Events by day — use Prisma groupBy instead of raw SQL
    const dailyEventsRaw = await app.prisma.analyticsEvent.groupBy({
      by: ['createdAt', 'event'],
      where: prismaWhere,
      _count: { id: true },
    });
    // Aggregate by date
    const dailyMap = {};
    dailyEventsRaw.forEach(row => {
      const dateStr = new Date(row.createdAt).toISOString().slice(0, 10);
      if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr };
      dailyMap[dateStr][row.event] = (dailyMap[dateStr][row.event] || 0) + row._count.id;
    });
    const dailyEvents = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Top channels
    const topChannelsRaw = await app.prisma.analyticsEvent.groupBy({
      by: ['channel'],
      where: { ...prismaWhere, channel: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });
    const topChannels = topChannelsRaw.map(r => ({ channel: r.channel, count: r._count.id }));

    // Top pages
    const topPagesRaw = await app.prisma.analyticsEvent.groupBy({
      by: ['page'],
      where: { ...prismaWhere, page: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });
    const topPages = topPagesRaw.map(r => ({ page: r.page, count: r._count.id }));

    // Totals
    const totals = await app.prisma.analyticsEvent.groupBy({
      by: ['event'],
      where: prismaWhere,
      _count: { id: true },
    });

    // Widget breakdown (if no specific widget selected)
    const widgetBreakdown = !widgetId ? await app.prisma.analyticsEvent.groupBy({
      by: ['widgetId'],
      where: { siteId, createdAt: { gte: since } },
      _count: { id: true },
    }) : [];

    return { dailyEvents, topChannels, topPages, totals, widgetBreakdown };
    } catch (err) {
      request.log.error({ err }, 'Analytics query failed');
      return reply.status(500).send({ error: 'Analytics query failed', detail: err.message });
    }
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

    // SSRF protection: block internal/private addresses
    try {
      const parsedUrl = new URL(url);
      const dns = await import('dns/promises');
      const addresses = await dns.resolve4(parsedUrl.hostname);
      const BLOCKED = [/^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^169\.254\./, /^0\./];
      for (const ip of addresses) {
        if (BLOCKED.some(p => p.test(ip))) {
          return reply.status(400).send({ error: 'Internal addresses blocked for screenshots' });
        }
      }
    } catch (dnsErr) {
      return reply.status(400).send({ error: 'Cannot resolve domain for screenshot' });
    }

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
    const path = await import('path');
    const filepath = path.resolve('/app/uploads/screenshots', path.basename(site.screenshotUrl));
    if (!filepath.startsWith('/app/uploads/screenshots/')) {
      return reply.status(400).send({ error: 'Invalid screenshot path' });
    }
    
    if (!fs.existsSync(filepath)) {
      return reply.status(404).send({ error: 'Screenshot file not found' });
    }

    const image = fs.readFileSync(filepath);
    reply.header('Content-Type', 'image/png');
    reply.header('Cache-Control', 'public, max-age=3600');
    return image;
  });
}
