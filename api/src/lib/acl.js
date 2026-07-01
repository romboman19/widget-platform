export function isOwner(user) {
  return user?.role === 'OWNER';
}

export function isAdmin(user) {
  return user?.role === 'ADMIN' || isOwner(user);
}

export function hasGlobalRole(user, ...roles) {
  return !!user?.role && roles.includes(user.role);
}

export async function getSiteMembership(prisma, userId, siteId) {
  if (!userId || !siteId) return null;
  return prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId, siteId } },
  });
}

export async function canAccessSite(prisma, user, siteId) {
  if (!user || !siteId) return false;
  if (isOwner(user)) return true;

  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { userId: true } });
  if (!site) return false;
  if (site.userId === user.id) return true;

  const membership = await getSiteMembership(prisma, user.id, siteId);
  return !!membership;
}

export async function requireSiteAccess(request, reply, siteId) {
  const allowed = await canAccessSite(request.server.prisma, request.user, siteId);
  if (!allowed) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  return null;
}
