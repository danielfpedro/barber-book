'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export default function EndUserDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.type !== 'endUser') {
      router.push('/enduser/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch('/api/enduser/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        } else {
          setError('Failed to fetch profile');
        }

        // Fetch bookings
        const bookingsRes = await fetch('/api/enduser/bookings');
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData);
        } else {
          setError('Failed to fetch bookings');
        }
      } catch (err) {
        console.error(err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-base-200">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-base-200 text-error">Error: {error}</div>;
  }

  const currentBookings = bookings.filter(booking => dayjs(booking.startTime).isAfter(dayjs()));
  const pastBookings = bookings.filter(booking => dayjs(booking.startTime).isBefore(dayjs()));

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="container mx-auto bg-base-100 p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-6">Welcome, {profile?.email}!</h1>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>
          <p><strong>Email:</strong> {profile?.email}</p>
          <p><strong>Member Since:</strong> {dayjs(profile?.createdAt).format('MMMM D, YYYY')}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Current Bookings</h2>
          {currentBookings.length === 0 ? (
            <p>No current bookings.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Staff</th>
                    <th>Tenant</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBookings.map(booking => (
                    <tr key={booking.id}>
                      <td>{booking.service.name}</td>
                      <td>{booking.staff.email}</td>
                      <td>{booking.tenant.name}</td>
                      <td>{dayjs(booking.startTime).format('MMMM D, YYYY h:mm A')}</td>
                      <td>{booking.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Past Bookings</h2>
          {pastBookings.length === 0 ? (
            <p>No past bookings.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Staff</th>
                    <th>Tenant</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastBookings.map(booking => (
                    <tr key={booking.id}>
                      <td>{booking.service.name}</td>
                      <td>{booking.staff.email}</td>
                      <td>{booking.tenant.name}</td>
                      <td>{dayjs(booking.startTime).format('MMMM D, YYYY h:mm A')}</td>
                      <td>{booking.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
