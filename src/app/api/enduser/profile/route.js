import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'endUser') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const endUser = await prisma.endUser.findUnique({
      where: {
        id: session.user.id,
      },
      select: { id: true, email: true, createdAt: true }, // Select specific fields
    });

    if (!endUser) {
      return new Response(JSON.stringify({ error: 'End user not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(endUser), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}