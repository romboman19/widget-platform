import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.js';
import siteRoutes from './routes/sites.js';
import widgetRoutes from './routes/widgets.js';
import experimentRoutes from './routes/experiments.js';
import publicRoutes from './routes/public.js';
import analyticsRoutes from './routes/analytics.js';
import mediaRoutes from './routes/media.js';
import { seed } from './seed.js';

const prisma = new PrismaClient();
const app = Fastify({
  logger: true,
  bodyLimit: 65536,
  trustProxy: true,
});

// ─── Plugins ───
await app.register(cors, {
  origin: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
});

// Multipart for file uploads
const multipart = await import('@fastify/multipart');
await app.register(multipart.default || multipart, {
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
});

// ─── Allow empty JSON/text body ───
const parseJsonLikeBody = (req, body, done) => {
  if (!body || body.length === 0) return done(null, {});
  try {
    done(null, JSON.parse(body));
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
};
app.addContentTypeParser('application/json', { parseAs: 'string' }, parseJsonLikeBody);
app.addContentTypeParser('text/plain', { parseAs: 'string' }, parseJsonLikeBody);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set and at least 32 characters');
  process.exit(1);
}

await app.register(jwt, {
  secret: JWT_SECRET,
  sign: {
    expiresIn: '24h',
  },
});

// ─── Prisma ───
app.decorate('prisma', prisma);

// ─── Public URL helper ───
const PUBLIC_URL = process.env.PUBLIC_URL || '';
app.decorate('getEmbedScript', (siteSlug) => {
  const baseUrl = PUBLIC_URL || '';
  const version = process.env.WIDGET_VERSION || '1.0.0';
  return `<script src="${baseUrl}/w.js?site=${siteSlug}&v=${version}" async></script>`;
});

// ─── Auth middleware ───
app.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// ─── Security headers ───
app.addHook('onSend', async (request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.removeHeader('X-Powered-By');
});

// ─── Routes ───
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(siteRoutes, { prefix: '/api/sites' });
await app.register(widgetRoutes, { prefix: '/api/sites' });
await app.register(experimentRoutes, { prefix: '/api/sites' });
await app.register(publicRoutes, { prefix: '/api/widget' });
await app.register(analyticsRoutes, { prefix: '/api/analytics' });
await app.register(mediaRoutes, { prefix: '/api/media' });

// Health check
app.get('/api/health', async () => ({ status: 'ok' }));

// ─── Error handler ───
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
