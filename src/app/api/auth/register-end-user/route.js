import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req) {
  const { email, password, tenantSlug } = await req.json();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const endUser = await prisma.endUser.create({
      data: {
        email,
        passwordHash: hashedPassword,
      },
    });

    return new Response(JSON.stringify(endUser), { status: 201 });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'User with this email already exists' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}