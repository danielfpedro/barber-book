import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';
import dayjs from 'dayjs';

export async function PUT(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantSlug = params.tenant;
  const availabilityId = parseInt(params.availabilityId);

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  const { staffId, dayOfWeek, startTime, endTime } = await req.json();

  if (!staffId || dayOfWeek === undefined || !startTime || !endTime) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  try {
    const updatedAvailability = await prisma.staffAvailability.update({
      where: { id: availabilityId, tenantId: tenant.id },
      data: {
        staffId: parseInt(staffId),
        dayOfWeek: parseInt(dayOfWeek),
        startTime: dayjs(`1970-01-01T${startTime}:00Z`).toDate(),
        endTime: dayjs(`1970-01-01T${endTime}:00Z`).toDate(),
      },
    });
    return new Response(JSON.stringify(updatedAvailability), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Availability not found or not authorized' }), { status: 404 });
  }
}

export async function DELETE(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantSlug = params.tenant;
  const availabilityId = parseInt(params.availabilityId);

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  try {
    await prisma.staffAvailability.delete({
      where: { id: availabilityId, tenantId: tenant.id },
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Availability not found or not authorized' }), { status: 404 });
  }
}