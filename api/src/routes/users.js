import bcrypt from 'bcryptjs';
import { isOwner } from '../lib/acl.js';

export default async function usersRoutes(app) {
  app.addHook('preHandler', async (request, reply) => {
    await app.authenticate(request, reply);
    if (reply.sent) return;
    if (!isOwner(request.user)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  });

  app.get('/', async () => {
    return app.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { memberships: true, sites: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.post('/', async (request, reply) => {
    const { email, password, name, role = 'EDITOR', isActive = true } = request.body || {};
    if (!email || typeof email !== 'string') return reply.status(400).send({ error: 'Email required' });
    if (!password || typeof password !== 'string' || password.length < 8) return reply.status(400).send({ error: 'Password must be at least 8 characters' });
    if (!['OWNER', 'ADMIN', 'EDITOR'].includes(role)) return reply.status(400).send({ error: 'Invalid role' });

    const existing = await app.prisma.user.findUnique({ where: { email } });
    if (existing) return reply.status(409).send({ error: 'User already exists' });

    const hash = await bcrypt.hash(password, 12);
    const user = await app.prisma.user.create({
      data: { email, password: hash, name: name || null, role, isActive: !!isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    return user;
  });

  app.put('/:userId', async (request, reply) => {
    const { userId } = request.params;
    const { name, role, isActive, password } = request.body || {};

    const existing = await app.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return reply.status(404).send({ error: 'User not found' });

    const data = {};
    if (typeof name === 'string') data.name = name || null;
    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (role !== undefined) {
      if (!['OWNER', 'ADMIN', 'EDITOR'].includes(role)) return reply.status(400).send({ error: 'Invalid role' });
      data.role = role;
    }
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8) return reply.status(400).send({ error: 'Password must be at least 8 characters' });
      data.password = await bcrypt.hash(password, 12);
    }

    const user = await app.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    return user;
  });

  app.delete('/:userId', async (request, reply) => {
    const { userId } = request.params;
    const existing = await app.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return reply.status(404).send({ error: 'User not found' });
    await app.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    return { success: true };
  });
}
