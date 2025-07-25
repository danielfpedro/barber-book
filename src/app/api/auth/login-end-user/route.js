import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Missing email or password' }), { status: 400 });
  }

  try {
    const endUser = await prisma.endUser.findUnique({
      where: {
        email,
      },
    });

    if (!endUser) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, endUser.passwordHash);

    if (!passwordMatch) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    // Return user data (excluding password hash) for session creation
    return new Response(JSON.stringify({ id: endUser.id, email: endUser.email }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}