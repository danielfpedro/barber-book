import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';
import bcrypt from 'bcrypt';

export async function GET(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN, USER_ROLES.TENANT_STAFF]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantId = authResult.session.user.tenantId; // Use tenantId from authorized session

  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get('role');

  const users = await prisma.user.findMany({
    where: {
      tenantId: tenantId,
      ...(roleFilter && { role: roleFilter }),
    },
    select: { id: true, email: true, role: true }, // Select specific fields for security
  });

  return new Response(JSON.stringify({ tenantId, roleFilter, users }), { status: 200 });
}

export async function POST(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantId = authResult.session.user.tenantId; // Use tenantId from authorized session

  const { email, password, role } = await req.json();

  if (!email || !password || !role) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await prisma.user.create({
      data: {
        tenantId: tenantId,
        email,
        passwordHash: hashedPassword,
        role,
      },
      select: { id: true, email: true, role: true },
    });
    return new Response(JSON.stringify(newUser), { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(JSON.stringify({ error: 'User with this email already exists or other error' }), { status: 409 });
  }
}
