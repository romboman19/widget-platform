import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Simple SVG sanitization (remove scripts)
function sanitizeSvg(svgContent) {
  // Remove script tags and on* attributes
  return svgContent
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+\son\w+="[^"]*"/gi, (match) => match.replace(/\s+on\w+="[^"]*"/gi, ''))
    .replace(/javascript:/gi, '')
    .replace(/<iframe/gi, '<!-- iframe')
    .replace(/<\/iframe>/gi, '-->');
}

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

export default async function mediaRoutes(app) {
  // ─── Helper: verify media ownership ───
  async function verifyMediaFile(request, reply) {
    const file = await app.prisma.mediaFile.findFirst({
      where: { id: request.params.id, userId: request.user.id },
      include: { folder: true },
    });
    if (!file) { reply.status(404).send({ error: 'File not found' }); return null; }
    return file;
  }

  async function verifyMediaFolder(request, reply) {
    const folder = await app.prisma.mediaFolder.findFirst({
      where: { id: request.params.id, userId: request.user.id },
    });
    if (!folder) { reply.status(404).send({ error: 'Folder not found' }); return null; }
    return folder;
  }

  // ─── Check if file is used in widgets ───
  async function checkFileUsage(fileId) {
    const widgets = await app.prisma.widget.findMany({
      where: {
        config: {
          path: ['buttons'],
          array_contains: [{ channels: [{ iconId: fileId }] }],
        },
      },
      select: { id: true, name: true },
    });
    return widgets;
  }

  // ─── List files ───
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { folder, type, subtype, channel } = request.query;
    
    const where = { userId: request.user.id };
    if (folder) where.folderId = folder === 'root' ? null : folder;
    if (type) where.type = type.toUpperCase();
    if (subtype) where.subtype = subtype;
    if (channel) where.channelType = channel;

    const files = await app.prisma.mediaFile.findMany({
      where,
      include: { folder: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return files;
  });

  // ─── Get single file ───
  app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const file = await verifyMediaFile(request, reply);
    if (!file) return;
    return file;
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
    const existingFile = await app.prisma.mediaFile.findUnique({
      where: { hash },
    });
    if (existingFile) {
      return reply.status(409).send({ 
        error: 'File already exists',
        file: existingFile,
      });
    }

    // Generate slug and filename
    const name = data.filename.replace(ext, '');
    const slug = generateSlug(name);
    const type = ALLOWED_TYPES[mimetype];
    const filename = `${slug}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Process SVG
    let svgContent = null;
    let width = null;
    let height = null;
    
    if (type === 'SVG') {
      const content = buffer.toString('utf-8');
      svgContent = sanitizeSvg(content);
      // Parse width/height from SVG
      const viewBoxMatch = svgContent.match(/viewBox="[^"]+"/) || [];
      const widthMatch = svgContent.match(/width="([^"]+)"/) || svgContent.match(/width='([^']+)'/);
      const heightMatch = svgContent.match(/height="([^"]+)"/) || svgContent.match(/height='([^']+)'/);
      
      if (widthMatch) width = parseInt(widthMatch[1], 10) || null;
      if (heightMatch) height = parseInt(heightMatch[1], 10) || null;
      
      // Save sanitized version
      await fs.writeFile(filePath, svgContent, 'utf-8');
    } else {
      // Save binary file
      await fs.writeFile(filePath, buffer);
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
        originalUrl: `${PUBLIC_URL}/media/${filename}`,
        url: `${PUBLIC_URL}/media/${filename}`,
        channelType: channelType || null,
        svgContent,
        size: buffer.length,
        hash,
        width,
        height,
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

    // Delete physical file
    const filename = `${file.slug}.${file.type.toLowerCase()}`;
    try {
      await fs.unlink(path.join(UPLOAD_DIR, filename));
    } catch (err) {
      // File might not exist, continue
    }

    // Delete database record
    await app.prisma.mediaFile.delete({ where: { id: request.params.id } });

    return { success: true };
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
