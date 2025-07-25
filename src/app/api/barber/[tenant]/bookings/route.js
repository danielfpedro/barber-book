import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';

export async function POST(req, { params }) {
  // For public booking, we don't need a logged-in user, but we still need tenant context
  // The authorize function can be modified to allow unauthenticated access for specific roles/paths
  // For now, we'll bypass authorization for this public endpoint.

  const tenantSlug = params.tenant;
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  const { customerName, customerEmail, customerPhone, serviceId, staffId, startTime, endTime } = await req.json();

  if (!customerName || !customerEmail || !serviceId || !staffId || !startTime || !endTime) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  try {
    const newBooking = await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        customerName,
        customerEmail,
        customerPhone,
        serviceId: parseInt(serviceId),
        staffId: parseInt(staffId),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'confirmed',
      },
    });
    return new Response(JSON.stringify(newBooking), { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return new Response(JSON.stringify({ error: 'Failed to create booking' }), { status: 500 });
  }
}
