import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'; // Correct plugin

dayjs.extend(utc);
dayjs.extend(isSameOrBefore); // Extend with the correct plugin

export async function GET(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.END_USER, USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF], false);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantSlug = params.tenant;
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    console.log('Availability API: Tenant not found for slug:', tenantSlug);
    return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const serviceId = parseInt(searchParams.get('serviceId'));
  const staffId = searchParams.get('staffId') ? parseInt(searchParams.get('staffId')) : null;
  const dateString = searchParams.get('date'); // YYYY-MM-DD

  console.log('Availability API Request:', { tenantSlug, serviceId, staffId, dateString });

  if (!serviceId || !dateString) {
    console.log('Availability API: Missing serviceId or dateString');
    return new Response(JSON.stringify({ error: 'Service ID and date are required' }), { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId, tenantId: tenant.id } });
  if (!service) {
    console.log('Availability API: Service not found for ID:', serviceId);
    return new Response(JSON.stringify({ error: 'Service not found' }), { status: 404 });
  }

  // Calculate dayOfWeek using UTC to avoid timezone issues
  const dayOfWeek = dayjs.utc(dateString).day(); // 0 for Sunday, 6 for Saturday
  console.log('Availability API: Calculated Day of Week (UTC):', dayOfWeek);

  let staffMembers = [];
  if (staffId) {
    const staffUser = await prisma.user.findUnique({ where: { id: staffId, tenantId: tenant.id, role: USER_ROLES.TENANT_STAFF } });
    if (staffUser) staffMembers.push(staffUser);
    console.log('Availability API: Specific Staff Member:', staffUser);
  } else {
    staffMembers = await prisma.user.findMany({ where: { tenantId: tenant.id, role: USER_ROLES.TENANT_STAFF } });
    console.log('Availability API: All Staff Members:', staffMembers);
  }

  const availableSlots = [];
  const bookingDuration = service.duration; // in minutes
  console.log('Availability API: Booking Duration:', bookingDuration);

  for (const staffMember of staffMembers) {
    console.log('Availability API: Processing staff member:', staffMember.email);
    const staffAvailability = await prisma.staffAvailability.findMany({
      where: {
        staffId: staffMember.id,
        dayOfWeek,
      },
    });
    console.log('Availability API: Staff Availability for day:', staffAvailability);

    for (const availability of staffAvailability) {
      console.log('Availability API: Processing availability block:', availability);
      
      // Use dayjs to construct Date objects
      const startOfDay = dayjs.utc(dateString).startOf('day');
      const availabilityStartTime = dayjs.utc(availability.startTime);
      const availabilityEndTime = dayjs.utc(availability.endTime);

      const startDateTime = startOfDay.hour(availabilityStartTime.hour()).minute(availabilityStartTime.minute());
      const endDateTime = startOfDay.hour(availabilityEndTime.hour()).minute(availabilityEndTime.minute());

      console.log('Availability API: Block Start/End DateTime:', startDateTime.toISOString(), endDateTime.toISOString());

      // Fetch existing bookings for this staff member on this date
      const existingBookings = await prisma.booking.findMany({
        where: {
          staffId: staffMember.id,
          startTime: {
            gte: startDateTime.toDate(),
            lt: endDateTime.toDate(),
          },
          status: { not: 'cancelled' },
        },
      });
      console.log('Availability API: Existing Bookings for block:', existingBookings);

      let currentTime = dayjs(startDateTime); // Use dayjs object
      while (currentTime.add(bookingDuration, 'minute').isSameOrBefore(endDateTime)) {
        const slotEndTime = currentTime.add(bookingDuration, 'minute');

        console.log('Availability API: Checking slot:', currentTime.toISOString(), 'to', slotEndTime.toISOString());

        const isBooked = existingBookings.some(booking => {
          const bookingStart = dayjs.utc(booking.startTime);
          const bookingEnd = dayjs.utc(booking.endTime);
          const overlap = (currentTime.isBefore(bookingEnd) && slotEndTime.isAfter(bookingStart));
          if (overlap) {
            console.log('Availability API: Slot overlaps with booking:', bookingStart.toISOString(), bookingEnd.toISOString());
          }
          return overlap;
        });

        if (!isBooked) {
          console.log('Availability API: Adding slot:', currentTime.toISOString(), 'to', slotEndTime.toISOString());
          availableSlots.push({
            staffId: staffMember.id,
            staffEmail: staffMember.email,
            startTime: currentTime.toISOString(),
            endTime: slotEndTime.toISOString(),
          });
        }
        currentTime = currentTime.add(15, 'minute'); // Move to next 15-min interval
      }
    }
  }

  console.log('Availability API: Final Available Slots:', availableSlots);
  return new Response(JSON.stringify(availableSlots), { status: 200 });
}
