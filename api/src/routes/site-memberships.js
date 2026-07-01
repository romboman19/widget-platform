import { isOwner } from '../lib/acl.js';

export default async function siteMembershipRoutes(app) {
  app.addHook('preHandler', async (request, reply) => {
    await app.authenticate(request, reply);
    if (reply.sent) return;
    if (!isOwner(request.user)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  });

  app.get('/:siteId/members', async (request, reply) => {
    const { siteId } = request.params;
    const site = await app.prisma.site.findUnique({ where: { id: siteId }, select: { id: true, name: true, userId: true } });
    if (!site) return reply.status(404).send({ error: 'Site not found' });

    const owner = await app.prisma.user.findUnique({
      where: { id: site.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    const memberships = await app.prisma.siteMembership.findMany({
      where: { siteId },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      site,
      owner,
      members: memberships.map(m => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
      })),
    };
  });

  app.post('/:siteId/members', async (request, reply) => {
    const { siteId } = request.params;
    const { userId, role = 'EDITOR' } = request.body || {};
    if (!userId || typeof userId !== 'string') return reply.status(400).send({ error: 'userId required' });
    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) return reply.status(400).send({ error: 'Invalid site role' });

    const site = await app.prisma.site.findUnique({ where: { id: siteId }, select: { id: true, userId: true } });
    if (!site) return reply.status(404).send({ error: 'Site not found' });
    if (site.userId === userId) return reply.status(400).send({ error: 'Owner already has full access' });

    const user = await app.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, isActive: true } });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const membership = await app.prisma.siteMembership.upsert({
      where: { userId_siteId: { userId, siteId } },
      update: { role },
      create: { userId, siteId, role },
      include: { user: { select: { id: true, email: true, name: true, role: true, isActive: true } } },
    });

    return membership;
  });

  app.put('/:siteId/members/:userId', async (request, reply) => {
    const { siteId, userId } = request.params;
    const { role } = request.body || {};
    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) return reply.status(400).send({ error: 'Invalid site role' });

    const membership = await app.prisma.siteMembership.findUnique({ where: { userId_siteId: { userId, siteId } } });
    if (!membership) return reply.status(404).send({ error: 'Membership not found' });

    const updated = await app.prisma.siteMembership.update({
      where: { userId_siteId: { userId, siteId } },
      data: { role },
      include: { user: { select: { id: true, email: true, name: true, role: true, isActive: true } } },
    });
    return updated;
  });

  app.delete('/:siteId/members/:userId', async (request, reply) => {
    const { siteId, userId } = request.params;
    const membership = await app.prisma.siteMembership.findUnique({ where: { userId_siteId: { userId, siteId } } });
    if (!membership) return reply.status(404).send({ error: 'Membership not found' });
    await app.prisma.siteMembership.delete({ where: { userId_siteId: { userId, siteId } } });
    return { success: true };
  });
}
