'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { use } from 'react';

export default function BarberLayout({ children, params }) {
  const pathname = usePathname();
  const { tenant } = use(params);
  const tenantSlug = tenant;

  const navigation = [
    { name: 'Home', href: `/${tenantSlug}` },
    { name: 'Services', href: `/${tenantSlug}/services` },
    { name: 'Book Now', href: `/${tenantSlug}/book` },
  ];

  return (
    <div>
      <header className="bg-gray-800 text-white p-4">
        <nav className="container mx-auto flex justify-between items-center">
          <Link href={`/${tenantSlug}`} className="text-xl font-bold">{tenantSlug} Barbershop</Link>
          <div className="space-x-4">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className={`hover:text-gray-300 ${pathname === item.href ? 'font-bold' : ''}`}>
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="bg-gray-800 text-white p-4 text-center mt-8">
        <p>&copy; {new Date().getFullYear()} {tenantSlug} Barbershop. All rights reserved.</p>
      </footer>
    </div>
  );
}