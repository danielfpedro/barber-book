import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';
import dayjs from 'dayjs';

export async function PUT(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const { tenant: tenantSlug, availabilityId: availabilityIdParam } = await params;
  const availabilityId = parseInt(availabilityIdParam);

  const tenantId = authResult.session.user.tenantId;

  const { staffId, dayOfWeek, startTime, endTime } = await req.json();

  if (!staffId || dayOfWeek === undefined || !startTime || !endTime) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  try {
    const updatedAvailability = await prisma.staffAvailability.update({
      where: { id: availabilityId, tenantId: tenantId },
      data: {
        staffId: parseInt(staffId),
        dayOfWeek: parseInt(dayOfWeek),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });
    return new Response(JSON.stringify(updatedAvailability), { status: 200 });
  } catch (error) {
    console.error('Error updating availability:', error);
    return new Response(JSON.stringify({ error: 'Availability not found or not authorized' }), { status: 404 });
  }
}

export async function DELETE(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const { tenant: tenantSlug, availabilityId: availabilityIdParam } = await params;
  const availabilityId = parseInt(availabilityIdParam);

  const tenantId = authResult.session.user.tenantId;

  try {
    await prisma.staffAvailability.delete({
      where: { id: availabilityId, tenantId: tenantId },
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Availability not found or not authorized' }), { status: 404 });
  }
}