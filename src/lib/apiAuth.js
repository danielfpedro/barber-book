import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma'; // Import prisma to fetch tenant by slug

export async function authorize(req, allowedRoles = [], tenantSpecific = true) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.error('Authorization failed: No session or user in session.');
    return { authorized: false, status: 401, message: 'Unauthorized' };
  }

  const userType = session.user.type; // Get the user type from the session
  const userRole = session.user.role; // This will be undefined for endUsers, but defined for staff/admin

  // Handle EndUser authorization
  if (userType === 'endUser') {
    if (allowedRoles.length > 0 && !allowedRoles.includes('endUser')) { // Check if 'endUser' is explicitly allowed
      console.error(`Authorization failed: User type "${userType}" not in allowed roles [${allowedRoles.join(', ')}].`);
      return { authorized: false, status: 403, message: 'Forbidden' };
    }
    // For endUsers, tenant-specific checks are not applied in the same way as for staff/admin
    // They are authorized if their type is 'endUser' and 'endUser' is in allowedRoles.
    return { authorized: true, session };
  }

  // Handle regular User (staff/admin) authorization
  if (userType === 'user') {
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      console.error(`Authorization failed: User role "${userRole}" not in allowed roles [${allowedRoles.join(', ')}].`);
      return { authorized: false, status: 403, message: 'Forbidden' };
    }

    if (tenantSpecific) {
      const pathSegments = req.nextUrl.pathname.split('/');
      const tenantSlugFromPath = pathSegments[3]; // Assuming path is /api/dashboard/[tenant]/...

      if (!session.user.tenantSlug) {
        console.error('Authorization failed: session.user.tenantSlug is undefined or null.');
        return { authorized: false, status: 403, message: 'Forbidden: Tenant slug missing in session.' };
      }

      if (session.user.tenantSlug !== tenantSlugFromPath) {
        console.error(`Authorization failed: Tenant mismatch. Session slug: "${session.user.tenantSlug}", Path slug: "${tenantSlugFromPath}".`);
        return { authorized: false, status: 403, message: 'Forbidden: Tenant mismatch.' };
      }

      const tenantFromDb = await prisma.tenant.findUnique({
        where: { slug: tenantSlugFromPath },
        select: { id: true },
      });

      if (!tenantFromDb || tenantFromDb.id !== session.user.tenantId) {
        console.error(`Authorization failed: Tenant ID mismatch. Session tenantId: "${session.user.tenantId}", DB tenantId for slug "${tenantSlugFromPath}": "${tenantFromDb?.id}".`);
        return { authorized: false, status: 403, message: 'Forbidden: Tenant ID mismatch.' };
      }
    }
    return { authorized: true, session };
  }

  // If userType is neither 'user' nor 'endUser' (shouldn't happen with current setup)
  console.error(`Authorization failed: Unknown user type "${userType}".`);
  return { authorized: false, status: 403, message: 'Forbidden: Unknown user type.' };
}
