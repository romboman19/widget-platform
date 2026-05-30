import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.js';
import siteRoutes from './routes/sites.js';
import widgetRoutes from './routes/widgets.js';
import publicRoutes from './routes/public.js';
import analyticsRoutes from './routes/analytics.js';
import { seed } from './seed.js';

const prisma = new PrismaClient();
const app = Fastify({
  logger: true,
  bodyLimit: 65536,           // 64kb max body — prevents oversized payloads
  trustProxy: true,           // trust X-Real-IP / X-Forwarded-For from nginx
});

// ─── Plugins ───
await app.register(cors, {
  origin: (origin, cb) => {
    // Allow requests from admin (same-origin, no Origin header)
    if (!origin) return cb(null, true);
    // Allow localhost for dev
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    // Allow registered site domains (for widget API calls)
    // In production, validate against DB — for now allow all with origin echo
    cb(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'dev-secret',
  sign: {
    expiresIn: '24h',         // Reduced from 7d
  },
});

// ─── Prisma ───
app.decorate('prisma', prisma);

// ─── Auth middleware ───
app.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// ─── Security: remove X-Powered-By, add security headers ───
app.addHook('onSend', async (request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.removeHeader('X-Powered-By');
});

// ─── Routes ───
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(siteRoutes, { prefix: '/api/sites' });
await app.register(widgetRoutes, { prefix: '/api/sites' });
await app.register(publicRoutes, { prefix: '/api/widget' });
await app.register(analyticsRoutes, { prefix: '/api/analytics' });

// Health check
app.get('/api/health', async () => ({ status: 'ok' }));

// ─── Global error handler — don't leak internals ───
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    error: statusCode >= 500 ? 'Internal server error' : error.message,
  });
});

// Start
const start = async () => {
  try {
    await seed(prisma);
    await app.listen({ port: parseInt(process.env.PORT || '3000'), host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
