import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { USER_ROLES } from '@/lib/rbac'; // Import USER_ROLES

export async function POST(req) {
  const { email, password, tenantName, tenantSlug } = await req.json();

  if (!email || !password || !tenantName || !tenantSlug) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        users: {
          create: {
            email,
            passwordHash: hashedPassword,
            role: USER_ROLES.TENANT_ADMIN, // Use the correct role constant
          },
        },
      },
      include: {
        users: true,
      },
    });

    return new Response(JSON.stringify(tenant), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'User or tenant already exists' }), { status: 409 });
  }
}