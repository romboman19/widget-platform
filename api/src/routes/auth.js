import bcrypt from 'bcryptjs';
import { createRateLimiter } from '../lib/security.js';

const loginLimiter = createRateLimiter(5, 300000); // 5 attempts per 5 min per IP

export default async function authRoutes(app) {

  // ─── Login with rate limiting ───
  app.post('/login', { preHandler: [loginLimiter] }, async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password required' });
    }

    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Constant-time: still hash to prevent timing attacks
      await bcrypt.hash('dummy', 12);
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = app.jwt.sign({ id: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  });

  // ─── Get current user ───
  app.get('/me', { preHandler: [app.authenticate] }, async (request) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw { statusCode: 401, message: 'User not found' };
    return user;
  });

  // ─── Change password ───
  app.put('/password', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body || {};

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({ error: 'Both passwords required' });
    }
    if (newPassword.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });
    }

    const user = await app.prisma.user.findUnique({ where: { id: request.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return reply.status(400).send({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await app.prisma.user.update({
      where: { id: request.user.id },
      data: { password: hash },
    });

    return { success: true };
  });
}
