import prisma from '@/lib/prisma';
import { authorize } from '@/lib/apiAuth';
import { USER_ROLES } from '@/lib/rbac';
import bcrypt from 'bcrypt';

export async function PUT(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantId = authResult.session.user.tenantId; // Use tenantId from authorized session
  const userId = parseInt(params.userId);

  const { email, password, role } = await req.json();

  if (!email || !role) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  let updateData = {
    email,
    role,
  };

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId, tenantId: tenantId }, // Use tenantId for filtering
      data: updateData,
      select: { id: true, email: true, role: true },
    });
    return new Response(JSON.stringify(updatedUser), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'User not found or not authorized' }), { status: 404 });
  }
}

export async function DELETE(req, { params }) {
  const authResult = await authorize(req, [USER_ROLES.TENANT_ADMIN]);
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.message }), { status: authResult.status });
  }

  const tenantId = authResult.session.user.tenantId; // Use tenantId from authorized session
  const userId = parseInt(params.userId);

  try {
    await prisma.user.delete({
      where: { id: userId, tenantId: tenantId }, // Use tenantId for filtering
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'User not found or not authorized' }), { status: 404 });
  }
}