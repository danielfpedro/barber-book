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
  const bookingId = parseInt(params.bookingId);

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  const { customerName, customerEmail, customerPhone, serviceId, staffId, startTime, endTime, status } = await req.json();

  try {
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId, tenantId: tenant.id },
      data: {
        customerName,
        customerEmail,
        customerPhone,
        serviceId: parseInt(serviceId),
        staffId: parseInt(staffId),
        startTime: dayjs(startTime).toDate(),
        endTime: dayjs(endTime).toDate(),
        status,
      },
    });
    return new Response(JSON.stringify(updatedBooking), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Booking not found or not authorized' }), { status: 404 });
  }
}

export async function DELETE(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantSlug = params.tenant;
  const bookingId = parseInt(params.bookingId);

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  try {
    await prisma.booking.delete({
      where: { id: bookingId, tenantId: tenant.id },
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Booking not found or not authorized' }), { status: 404 });
  }
}