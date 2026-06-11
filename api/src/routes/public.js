import { normalizeWidgetConfig, normalizeFloatingMenuConfig } from '../lib/configNormalizer.js';

export default async function publicRoutes(app) {
  // Helper: resolve icon URLs for buttons
  async function resolveIconUrls(widgets) {
    // Collect all iconIds from all widgets
    const iconIds = new Set();
    
    for (const widget of widgets) {
      if (widget.config?.buttons) {
        for (const btn of widget.config.buttons) {
          for (const ch of btn.channels || []) {
            if (ch.iconId) iconIds.add(ch.iconId);
          }
        }
      }
    }
    
    if (iconIds.size === 0) return {};
    
    // Fetch all icons in one query
    const icons = await app.prisma.mediaFile.findMany({
      where: { id: { in: Array.from(iconIds) } },
      select: { id: true, url: true, type: true, svgContent: true },
    });
    
    // Build lookup map
    const iconMap = {};
    for (const icon of icons) {
      iconMap[icon.id] = icon.type === 'SVG' 
        ? { type: 'svg', content: icon.svgContent }
        : { type: 'url', url: icon.url };
    }
    
    return iconMap;
  }

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

    // Normalize widget configs and resolve icon URLs
    const normalizedWidgets = site.widgets.map(w => normalizeWidgetConfig(w));
    const iconMap = await resolveIconUrls(normalizedWidgets);
    
    // Attach icon URLs to buttons
    for (const widget of normalizedWidgets) {
      if (widget.config?.buttons) {
        for (const btn of widget.config.buttons) {
          for (const ch of btn.channels || []) {
            if (ch.iconId && iconMap[ch.iconId]) {
              ch.iconUrl = iconMap[ch.iconId].url || iconMap[ch.iconId].content;
              ch.iconType = iconMap[ch.iconId].type;
            }
          }
        }
      }
    }

    // Cache for 1 minute
    reply.header('Cache-Control', 'public, max-age=60');

    return {
      siteId: site.id,
      widgets: normalizedWidgets,
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

    // Normalize and resolve icons
    const normalized = normalizeWidgetConfig(widget);
    const iconMap = await resolveIconUrls([normalized]);
    
    if (normalized.config?.buttons) {
      for (const btn of normalized.config.buttons) {
        for (const ch of btn.channels || []) {
          if (ch.iconId && iconMap[ch.iconId]) {
            ch.iconUrl = iconMap[ch.iconId].url || iconMap[ch.iconId].content;
            ch.iconType = iconMap[ch.iconId].type;
          }
        }
      }
    }

    reply.header('Cache-Control', 'no-cache');
    reply.header('Access-Control-Allow-Origin', '*');

    return {
      siteId,
      widgets: [normalized],
    };
  });
  
  // Public endpoint for widget config with lazy load settings
  app.get('/config', async (request, reply) => {
    const { site } = request.query;
    
    if (!site) {
      return reply.status(400).send({ error: 'site parameter required' });
    }
    
    const siteRecord = await app.prisma.site.findUnique({
      where: { slug: site },
      select: {
        id: true,
        // Global lazy load settings (can be extended per-site)
        widgets: {
          where: { enabled: true, type: 'FLOATING_MENU' },
          select: { config: true },
          take: 1,
        },
      },
    });
    
    if (!siteRecord) {
      return reply.status(404).send({ error: 'Site not found' });
    }
    
    // Extract lazy load settings from first floating menu
    const lazyLoad = siteRecord.widgets[0]?.config?.lazyLoad || {
      loadDelay: 0,
      loadOnScroll: null,
      loadOnInteraction: false,
    };
    
    reply.header('Cache-Control', 'public, max-age=60');
    
    return {
      siteId: siteRecord.id,
      lazyLoad,
    };
  });
}
