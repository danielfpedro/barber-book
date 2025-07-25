import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';

export async function GET(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantSlug = params.tenant;
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  return new Response(JSON.stringify(tenant), { status: 200 });
}

export async function PUT(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantSlug = params.tenant;
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  const { name, slug } = await req.json();

  if (!name || !slug) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  try {
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        name,
        slug,
      },
    });
    return new Response(JSON.stringify(updatedTenant), { status: 200 });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return new Response(JSON.stringify({ error: 'Failed to update tenant or slug already exists' }), { status: 409 });
  }
}
