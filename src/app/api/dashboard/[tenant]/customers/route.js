import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';

export async function GET(req, { params }) {
  try {
    const { tenant: tenantSlug } = params;

    const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF], tenantSlug);
    if (!authResult.authorized) {
      return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
    }

    const tenantId = authResult.session.user.tenantId;

    const customers = await prisma.booking.findMany({
      where: {
        tenantId: tenantId,
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
