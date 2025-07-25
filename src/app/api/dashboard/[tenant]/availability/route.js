import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';

export async function GET(req, { params }) {
  const { tenant: tenantSlug } = params;
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF], tenantSlug);

  if (authResult.error) {
    return new Response(JSON.stringify({ message: authResult.error }), { status: authResult.status });
  }

  try {
    const availability = await prisma.staffAvailability.findMany({
      where: {
        tenantId: authResult.user.tenantId,
      },
      include: {
        staff: { select: { id: true, email: true } },
      },
    });
    return new Response(JSON.stringify(availability), { status: 200 });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return new Response(JSON.stringify({ message: 'Error fetching availability' }), { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { tenant: tenantSlug } = params;
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN], tenantSlug);

  if (authResult.error) {
    return new Response(JSON.stringify({ message: authResult.error }), { status: authResult.status });
  }

  const { staffId, dayOfWeek, startTime, endTime } = await req.json();

  if (!staffId || dayOfWeek === undefined || !startTime || !endTime) {
    return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
  }

  try {
    const newAvailability = await prisma.staffAvailability.create({
      data: {
        tenantId: authResult.user.tenantId,
        staffId: parseInt(staffId),
        dayOfWeek: parseInt(dayOfWeek),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });
    return new Response(JSON.stringify(newAvailability), { status: 201 });
  } catch (error) {
    console.error('Error creating availability:', error);
    return new Response(JSON.stringify({ message: 'Error creating availability' }), { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { tenant: tenantSlug } = params;
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN], tenantSlug);

  if (authResult.error) {
    return new Response(JSON.stringify({ message: authResult.error }), { status: authResult.status });
  }

  const { availabilityId } = params;
  const { staffId, dayOfWeek, startTime, endTime } = await req.json();

  if (!availabilityId || !staffId || dayOfWeek === undefined || !startTime || !endTime) {
    return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
  }

  try {
    const updatedAvailability = await prisma.staffAvailability.update({
      where: { id: parseInt(availabilityId) },
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
    return new Response(JSON.stringify({ message: 'Error updating availability' }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { tenant: tenantSlug } = params;
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN], tenantSlug);

  if (authResult.error) {
    return new Response(JSON.stringify({ message: authResult.error }), { status: authResult.status });
  }

  const { availabilityId } = params;

  if (!availabilityId) {
    return new Response(JSON.stringify({ message: 'Missing availability ID' }), { status: 400 });
  }

  try {
    await prisma.staffAvailability.delete({
      where: { id: parseInt(availabilityId) },
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting availability:', error);
    return new Response(JSON.stringify({ message: 'Error deleting availability' }), { status: 500 });
  }
}