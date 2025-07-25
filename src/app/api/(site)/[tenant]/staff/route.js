import prisma from '@/lib/prisma';
import { USER_ROLES } from '@/lib/rbac';

export async function GET(req, { params }) {
  const { tenant } = params;

  try {
    const foundTenant = await prisma.tenant.findUnique({
      where: {
        slug: tenant,
      },
    });

    if (!foundTenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
    }

    const staff = await prisma.user.findMany({
      where: {
        tenantId: foundTenant.id,
        role: USER_ROLES.TENANT_STAFF, // Only fetch staff members
      },
      select: { id: true, email: true }, // Select specific fields to avoid sensitive data
    });

    return new Response(JSON.stringify(staff), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}