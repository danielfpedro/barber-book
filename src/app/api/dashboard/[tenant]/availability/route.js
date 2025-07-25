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

  const availability = await prisma.staffAvailability.findMany({
    where: { tenantId: tenant.id },
    include: { staff: { select: { id: true, email: true } } },
    orderBy: [{ staffId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  return new Response(JSON.stringify(availability), { status: 200 });
}

export async function POST(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantSlug = params.tenant;
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  const { staffId, dayOfWeek, startTime, endTime } = await req.json();

  if (!staffId || dayOfWeek === undefined || !startTime || !endTime) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  try {
    const newAvailability = await prisma.staffAvailability.create({
      data: {
        tenantId: tenant.id,
        staffId: parseInt(staffId),
        dayOfWeek: parseInt(dayOfWeek),
        startTime: new Date(`1970-01-01T${startTime}:00Z`),
        endTime: new Date(`1970-01-01T${endTime}:00Z`),
      },
    });
    return new Response(JSON.stringify(newAvailability), { status: 201 });
  } catch (error) {
    console.error('Error creating availability:', error);
    return new Response(JSON.stringify({ error: 'Failed to create availability' }), { status: 500 });
  }
}
