import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';

export async function GET(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantSlug = params.tenant;
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id },
    include: { staff: { select: { id: true, email: true } } }, // Include assigned staff
  });

  return new Response(JSON.stringify(services), { status: 200 });
}

export async function POST(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantSlug = params.tenant;
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  const { name, description, price, duration, staffIds } = await req.json();

  if (!name || !price || !duration) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const newService = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name,
      description,
      price: parseFloat(price),
      duration: parseInt(duration),
      staff: {
        connect: staffIds ? staffIds.map(id => ({ id: parseInt(id) })) : [],
      },
    },
  });

  return new Response(JSON.stringify(newService), { status: 201 });
}