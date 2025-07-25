'use client';

import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';

export default function DashboardOverviewPage() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-base-content">Overview for {session?.user?.tenantSlug}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Today's Bookings</h2>
            <p className="text-4xl font-bold text-base-content">0</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Total Revenue (Placeholder)</h2>
            <p className="text-4xl font-bold text-base-content">$0.00</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Upcoming Appointments</h2>
            {/* List of upcoming appointments */}
            <p className="text-base-content">No upcoming appointments.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
