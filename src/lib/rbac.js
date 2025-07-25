import { useSession } from 'next-auth/react';

export const USER_ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  TENANT_ADMIN: 'tenant_admin',
  TENANT_STAFF: 'tenant_staff',
  CUSTOMER: 'customer',
  END_USER: 'endUser',
};

export function useHasRole(requiredRoles) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return false; // Or a loading indicator
  }

  if (!session || !session.user || !session.user.role) {
    return false;
  }

  const userRole = session.user.role;

  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  } else {
    return userRole === requiredRoles;
  }
}

export function hasPermission(userRole, requiredRoles) {
  if (!userRole || !requiredRoles) {
    return false;
  }

  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  } else {
    return userRole === requiredRoles;
  }
}
