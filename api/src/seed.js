import bcrypt from 'bcryptjs';
import { seedTemplates } from '../prisma/seed.js';

export async function seed(prisma) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@local.dev';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hash,
        name: 'Admin',
      },
    });
    console.log(`✅ Admin user created: ${adminEmail}`);
  }

  // Seed global templates
  await seedTemplates(prisma);
}

// Allow running standalone
if (process.argv[1]?.endsWith('seed.js')) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  await seed(prisma);
  await prisma.$disconnect();
}
