import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeSvg, extractSvgDimensions } from '../lib/svgSanitizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:8090';

// Ensure upload directory exists
await fs.mkdir(UPLOAD_DIR, { recursive: true });

// Allowed mime types
const ALLOWED_TYPES = {
  'image/svg+xml': 'SVG',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WEBP',
  'image/gif': 'GIF',
};

const ALLOWED_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif'];

// Generate slug from name
function generateSlug(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
}

// Calculate SHA-256 hash
async function calculateHash(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

// Get physical file path for hash
function getPhysicalPath(hash, ext) {
  // Store files in subdirectories by first 2 chars of hash for better filesystem performance
  const subdir = hash.slice(0, 2);
  const filename = `${hash}.${ext.toLowerCase()}`;
  return {
    dir: path.join(UPLOAD_DIR, subdir),
    path: path.join(UPLOAD_DIR, subdir, filename),
    relative: `/uploads/${subdir}/${filename}`,
  };
}

export default async function mediaRoutes(app) {
  // ─── Helper: verify media ownership ───
  async function verifyMediaFile(request, reply) {
    const file = await app.prisma.mediaFile.findFirst({
      where: { id: request.params.id },
      include: { folder: true },
    });
    
    if (!file) {
      reply.status(404).send({ error: 'File not found' });
      return null;
    }
    
    // Default files are readable by all, but only deletable by admin
    if (file.isDefault && request.method !== 'GET') {
      reply.status(403).send({ error: 'Cannot modify default files' });
      return null;
    }
    
    // Check ownership for non-default files
    if (!file.isDefault && file.userId !== request.user.id) {
      reply.status(403).send({ error: 'Access denied' });
      return null;
    }
    
    return file;
  }

  async function verifyMediaFolder(request, reply) {
    const folder = await app.prisma.mediaFolder.findFirst({
      where: { id: request.params.id, userId: request.user.id },
    });
    if (!folder) { reply.status(404).send({ error: 'Folder not found' }); return null; }
    return folder;
  }

  // ─── Check if file hash has other references ───
  async function countReferences(hash, excludeId = null) {
    const where = { hash };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return app.prisma.mediaFile.count({ where });
  }

  // ─── Check if file is used in widgets (via JSON search) ───
  async function checkFileUsage(fileId) {
    // Note: jsonb::text has spaces after colons, so we search for fileId anywhere in config
    // CUIDs are unique enough to avoid false positives
    const widgets = await app.prisma.$queryRaw`
      SELECT id, name 
      FROM "Widget" 
      WHERE config::text LIKE ${'%' + fileId + '%'}
      LIMIT 10
    `;
    return widgets;
  }

  // ─── List files ───
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { folder, type, subtype, channel, includeDefaults = 'true' } = request.query;
    
    const where = {};
    
    // Include user's files
    const userCondition = { userId: request.user.id };
    
    // Include default files if requested
    if (includeDefaults !== 'false') {
      where.OR = [
        userCondition,
        { isDefault: true },
      ];
    } else {
      Object.assign(where, userCondition);
    }
    
    if (folder) where.folderId = folder === 'root' ? null : folder;
    if (type) where.type = type.toUpperCase();
    if (subtype) where.subtype = subtype;
    if (channel) where.channelType = channel;

    const files = await app.prisma.mediaFile.findMany({
      where,
      include: { folder: { select: { id: true, name: true } } },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return files;
  });

  // ─── Get single file ───
  app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const file = await verifyMediaFile(request, reply);
    if (!file) return;
    return file;
  });

  // ─── Get SVG content (with proper security headers) ───
  app.get('/:id/content', { preHandler: [app.authenticate] }, async (request, reply) => {
    const file = await verifyMediaFile(request, reply);
    if (!file) return;
    
    if (file.type !== 'SVG' || !file.svgContent) {
      return reply.status(404).send({ error: 'SVG content not available' });
    }
    
    // Security headers for SVG
    reply.header('Content-Type', 'image/svg+xml');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Content-Security-Policy', "default-src 'none'");
    
    return file.svgContent;
  });

  // ─── Upload file ───
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const { folderId, subtype = 'icon', channelType } = request.body || {};

    // Validate folder ownership
    if (folderId) {
      const folder = await app.prisma.mediaFolder.findFirst({
        where: { id: folderId, userId: request.user.id },
      });
      if (!folder) {
        return reply.status(404).send({ error: 'Folder not found' });
      }
    }

    // Get file buffer
    const buffer = await data.toBuffer();
    
    // Check file size (2MB limit)
    if (buffer.length > 2 * 1024 * 1024) {
      return reply.status(400).send({ error: 'File too large (max 2MB)' });
    }

    // Get mime type
    const mimetype = data.mimetype;
    if (!ALLOWED_TYPES[mimetype]) {
      return reply.status(400).send({ error: `File type not allowed: ${mimetype}` });
    }

    // Validate extension
    const ext = path.extname(data.filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return reply.status(400).send({ error: `File extension not allowed: ${ext}` });
    }

    // Calculate hash for deduplication
    const hash = await calculateHash(buffer);
    
    // Check if file with this hash already exists
    const existingFile = await app.prisma.mediaFile.findFirst({
      where: { hash },
    });
    
    if (existingFile) {
      // File already exists — create new record pointing to same physical file
      const name = data.filename.replace(ext, '');
      const slug = generateSlug(name);
      const type = ALLOWED_TYPES[mimetype];
      
      // Get dimensions from existing file
      const dimensions = { width: existingFile.width, height: existingFile.height };
      
      const newFile = await app.prisma.mediaFile.create({
        data: {
          userId: request.user.id,
          folderId: folderId || null,
          name: data.filename,
          slug,
          type,
          mimeType: mimetype,
          subtype,
          originalUrl: existingFile.originalUrl,
          url: existingFile.url,
          channelType: channelType || null,
          svgContent: existingFile.svgContent,
          size: existingFile.size,
          hash,
          width: dimensions.width,
          height: dimensions.height,
        },
      });
      
      return reply.status(201).send({
        ...newFile,
        deduplicated: true,
        originalFileId: existingFile.id,
      });
    }

    // New file — process and save
    const name = data.filename.replace(ext, '');
    const slug = generateSlug(name);
    const type = ALLOWED_TYPES[mimetype];
    
    // Get physical path
    const physical = getPhysicalPath(hash, ext);
    await fs.mkdir(physical.dir, { recursive: true });

    // Process SVG
    let svgContent = null;
    let dimensions = { width: null, height: null };
    
    if (type === 'SVG') {
      const content = buffer.toString('utf-8');
      
      // Sanitize with DOMPurify
      svgContent = sanitizeSvg(content);
      
      // Extract dimensions
      dimensions = extractSvgDimensions(svgContent);
      
      // Save sanitized version
      await fs.writeFile(physical.path, svgContent, 'utf-8');
    } else {
      // Save binary file
      await fs.writeFile(physical.path, buffer);
    }

    // Create database record
    const file = await app.prisma.mediaFile.create({
      data: {
        userId: request.user.id,
        folderId: folderId || null,
        name: data.filename,
        slug,
        type,
        mimeType: mimetype,
        subtype,
        originalUrl: `${PUBLIC_URL}/media${physical.relative}`,
        url: `${PUBLIC_URL}/media${physical.relative}`,
        channelType: channelType || null,
        svgContent,
        size: buffer.length,
        hash,
        width: dimensions.width,
        height: dimensions.height,
      },
    });

    return reply.status(201).send(file);
  });

  // ─── Update file metadata ───
  app.put('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const file = await verifyMediaFile(request, reply);
    if (!file) return;

    const { name, folderId, subtype, channelType } = request.body || {};

    // Validate folder
    if (folderId !== undefined) {
      if (folderId) {
        const folder = await app.prisma.mediaFolder.findFirst({
          where: { id: folderId, userId: request.user.id },
        });
        if (!folder) {
          return reply.status(404).send({ error: 'Folder not found' });
        }
      }
    }

    const updated = await app.prisma.mediaFile.update({
      where: { id: request.params.id },
      data: {
        ...(name !== undefined && { name: String(name).slice(0, 200) }),
        ...(folderId !== undefined && { folderId: folderId || null }),
        ...(subtype !== undefined && { subtype }),
        ...(channelType !== undefined && { channelType }),
      },
    });

    return updated;
  });

  // ─── Delete file ───
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const file = await verifyMediaFile(request, reply);
    if (!file) return;

    // Check if file is used in widgets
    const widgets = await checkFileUsage(request.params.id);
    if (widgets.length > 0) {
      return reply.status(409).send({
        error: 'File is in use',
        widgets: widgets.map(w => ({ id: w.id, name: w.name })),
      });
    }

    // Check how many other records reference the same physical file
    const refCount = await countReferences(file.hash, file.id);
    
    // Delete database record
    await app.prisma.mediaFile.delete({ where: { id: request.params.id } });
    
    // Delete physical file only if no other references
    if (refCount === 0) {
      const ext = file.type === 'SVG' ? 'svg' : file.type.toLowerCase();
      const physical = getPhysicalPath(file.hash, ext);
      try {
        await fs.unlink(physical.path);
        // Try to remove empty subdirectory
        const subdir = path.dirname(physical.path);
        const files = await fs.readdir(subdir);
        if (files.length === 0) {
          await fs.rmdir(subdir);
        }
      } catch (err) {
        // File might not exist, continue
        app.log.warn(`Failed to delete physical file: ${err.message}`);
      }
    }

    return { success: true, physicalDeleted: refCount === 0 };
  });

  // ─── List folders ───
  app.get('/folders', { preHandler: [app.authenticate] }, async (request, reply) => {
    const folders = await app.prisma.mediaFolder.findMany({
      where: { userId: request.user.id },
      include: {
        children: { select: { id: true, name: true } },
        _count: { select: { files: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Build tree structure
    const rootFolders = folders.filter(f => !f.parentId);
    const folderMap = new Map(folders.map(f => [f.id, f]));
    
    return rootFolders.map(f => ({
      ...f,
      children: f.children.map(c => folderMap.get(c.id)),
    }));
  });

  // ─── Create folder ───
  app.post('/folders', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { name, parentId } = request.body || {};

    if (!name || name.length < 1) {
      return reply.status(400).send({ error: 'Folder name required' });
    }

    // Validate parent
    if (parentId) {
      const parent = await app.prisma.mediaFolder.findFirst({
        where: { id: parentId, userId: request.user.id },
      });
      if (!parent) {
        return reply.status(404).send({ error: 'Parent folder not found' });
      }
    }

    const folder = await app.prisma.mediaFolder.create({
      data: {
        userId: request.user.id,
        name: name.slice(0, 100),
        parentId: parentId || null,
      },
    });

    return reply.status(201).send(folder);
  });

  // ─── Update folder ───
  app.put('/folders/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const folder = await verifyMediaFolder(request, reply);
    if (!folder) return;

    const { name } = request.body || {};
    if (!name) {
      return reply.status(400).send({ error: 'Name required' });
    }

    const updated = await app.prisma.mediaFolder.update({
      where: { id: request.params.id },
      data: { name: name.slice(0, 100) },
    });

    return updated;
  });

  // ─── Delete folder ───
  app.delete('/folders/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const folder = await verifyMediaFolder(request, reply);
    if (!folder) return;

    // Check if folder has files
    const fileCount = await app.prisma.mediaFile.count({
      where: { folderId: request.params.id },
    });
    if (fileCount > 0) {
      return reply.status(409).send({ error: 'Folder is not empty' });
    }

    // Check if folder has subfolders
    const childCount = await app.prisma.mediaFolder.count({
      where: { parentId: request.params.id },
    });
    if (childCount > 0) {
      return reply.status(409).send({ error: 'Folder has subfolders' });
    }

    await app.prisma.mediaFolder.delete({ where: { id: request.params.id } });
    return { success: true };
  });

  // ─── Default channel icons ───
  app.get('/defaults/channels', async (request, reply) => {
    const defaults = await app.prisma.mediaFile.findMany({
      where: { isDefault: true, subtype: 'icon' },
      orderBy: { channelType: 'asc' },
    });
    return defaults;
  });
}
