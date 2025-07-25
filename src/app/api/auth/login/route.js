import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });

  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }

  // With NextAuth.js, the session and token handling will be managed by NextAuth.js
  // This endpoint will primarily be used for credential validation.
  return new Response(JSON.stringify({ user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId }, tenant: user.tenant }), { status: 200 });
}