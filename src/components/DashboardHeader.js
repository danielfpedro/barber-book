'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const breadcrumbs = pathname.split('/').filter(segment => segment !== '').map((segment, index, array) => {
    const href = '/' + array.slice(0, index + 1).join('/');
    return {
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      href,
    };
  });

  return (
    <header className="bg-base-100 shadow-md p-4 flex justify-between items-center">
      <div className="text-xl font-semibold text-base-content">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href}>
            <Link href={crumb.href} className="text-primary hover:underline">
              {crumb.name}
            </Link>
            {index < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
          </span>
        ))}
      </div>
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost rounded-btn text-base-content">
          {session?.user?.email}
        </div>
        <ul tabIndex={0} className="menu dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-52 mt-4">
          <li><button onClick={() => signOut()}>Logout</button></li>
        </ul>
      </div>
    </header>
  );
}