import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';
import dayjs from 'dayjs';

export async function GET(req, { params }) {
  const { tenant: tenantSlug } = await params;
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF], tenantSlug);
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  const bookings = await prisma.booking.findMany({
    where: { tenantId: tenant.id },
    include: { service: true, staff: true },
    orderBy: { startTime: 'desc' },
  });

  return new Response(JSON.stringify(bookings), { status: 200 });
}