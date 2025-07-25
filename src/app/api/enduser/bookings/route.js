import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'endUser') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        endUserId: session.user.id,
      },
      include: {
        service: true,
        staff: true,
        tenant: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return new Response(JSON.stringify(bookings), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}