import prisma from '@/lib/prisma';

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

    const services = await prisma.service.findMany({
      where: {
        tenantId: foundTenant.id,
      },
    });

    return new Response(JSON.stringify(services), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}