'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useAuthGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading

    const tenantSlug = pathname.split('/')[2]; // e.g., /dashboard/[tenantSlug]/...

    if (!session) {
      // If not authenticated, redirect to login
      router.push('/login');
    } else if (session.user.tenantSlug !== tenantSlug) {
      // If authenticated but not for this tenant, redirect to their tenant's dashboard
      router.push(`/dashboard/${session.user.tenantSlug}`);
    }
  }, [session, status, router, pathname]);

  return { session, status };
}
