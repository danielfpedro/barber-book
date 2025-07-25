import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';

export async function GET(req, { params }) {
  try {
    const { tenant: tenantSlug } = params;

    const authResult = await authorize(req, [USER_ROLES.BARBER, USER_ROLES.ADMIN], tenantSlug);
    if (authResult.status !== 200) {
      return authResult;
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
    }

    const customers = await prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
      },
      select: {
        customerName: true,
        customerEmail: true,
        customerPhone: true,
      },
      distinct: ['customerEmail'],
      orderBy: {
        customerName: 'asc',
      },
    });

    return new Response(JSON.stringify(customers), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch customers' }), { status: 500 });
  }
}
