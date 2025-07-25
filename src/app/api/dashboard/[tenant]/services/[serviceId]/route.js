import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';

export async function PUT(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantSlug = params.tenant;
  const serviceId = parseInt(params.serviceId);

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  const { name, description, price, duration, staffIds } = await req.json();

  if (!name || !price || !duration) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  try {
    const updatedService = await prisma.service.update({
      where: { id: serviceId, tenantId: tenant.id },
      data: {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        staff: {
          set: staffIds ? staffIds.map(id => ({ id: parseInt(id) })) : [],
        },
      },
    });
    return new Response(JSON.stringify(updatedService), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Service not found or not authorized' }), { status: 404 });
  }
}

export async function DELETE(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantSlug = params.tenant;
  const serviceId = parseInt(params.serviceId);

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  try {
    await prisma.service.delete({
      where: { id: serviceId, tenantId: tenant.id },
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Service not found or not authorized' }), { status: 404 });
  }
}