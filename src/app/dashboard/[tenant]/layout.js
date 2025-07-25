'use client';

import { useAuthGuard } from '@/lib/useAuthGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import DashboardHeader from '@/components/DashboardHeader';
import { useState } from 'react';

export default function DashboardLayout({ children }) {
  const { session, status } = useAuthGuard();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (status === 'loading') {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  if (!session) {
    return null; // Redirect handled by useAuthGuard
  }

  const navigation = [
    { name: 'Overview', href: `/dashboard/${session.user.tenantSlug}` },
    { name: 'Bookings', href: `/dashboard/${session.user.tenantSlug}/bookings` },
    { name: 'Services', href: `/dashboard/${session.user.tenantSlug}/services` },
    { name: 'Availability', href: `/dashboard/${session.user.tenantSlug}/availability` },
    { name: 'Users & Roles', href: `/dashboard/${session.user.tenantSlug}/users` },
    { name: 'My Customers', href: `/dashboard/${session.user.tenantSlug}/customers` },
    { name: 'Settings', href: `/dashboard/${session.user.tenantSlug}/settings` },
  ];

  return (
    <div className="flex h-screen bg-base-200">
      {/* Sidebar for larger screens */}
      <aside className="w-64 bg-base-100 shadow-md flex-col hidden md:flex">
        <div className="p-4 border-b border-base-300">
          <h2 className="text-xl font-bold text-base-content text-center">{session.user.tenantSlug} Dashboard</h2>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${pathname === item.href ? 'bg-primary text-primary-content' : 'text-base-content hover:bg-base-300 hover:text-base-content'}`}>
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-base-300">
          <button onClick={() => signOut()} className="btn btn-sm btn-outline btn-error w-full">Sign Out</button>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <div className="md:hidden p-4">
        <button className="btn btn-ghost" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>

      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <aside className="w-64 bg-base-100 shadow-md flex-col flex h-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-base-300">
              <h2 className="text-xl font-bold text-base-content text-center">{session.user.tenantSlug} Dashboard</h2>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href} className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${pathname === item.href ? 'bg-primary text-primary-content' : 'text-base-content hover:bg-base-300 hover:text-base-content'}`} onClick={() => setIsSidebarOpen(false)}>
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-base-300">
              <button onClick={() => signOut()} className="btn btn-sm btn-outline btn-error w-full">Sign Out</button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
