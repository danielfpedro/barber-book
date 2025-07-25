'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const tenantSlug = searchParams.get('tenant');
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    if (bookingId && tenantSlug) {
      const fetchBookingDetails = async () => {
        try {
          const res = await fetch(`/api/dashboard/${tenantSlug}/bookings/${bookingId}`);
          if (res.ok) {
            const data = await res.json();
            setBookingDetails(data);
          } else {
            console.error('Failed to fetch booking details');
            // Optionally redirect to an error page or home
          }
        } catch (error) {
          console.error('Error fetching booking details:', error);
        }
      };
      fetchBookingDetails();
    }
  }, [bookingId, tenantSlug]);

  if (!bookingDetails) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4 text-base-content">Loading Booking Details...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-base-content">Booking Confirmed!</h1>
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-base-content">Thank You for Your Booking!</h2>
          <p className="text-base-content">Your appointment has been successfully scheduled.</p>
          <p className="text-base-content">A confirmation email has been sent to your inbox.</p>
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-base-content">Booking Details:</h3>
            <p className="text-base-content"><strong>Service:</strong> {bookingDetails.service.name}</p>
            <p className="text-base-content"><strong>Staff:</strong> {bookingDetails.staff.email}</p>
            <p className="text-base-content"><strong>Date:</strong> {dayjs(bookingDetails.startTime).format('MMMM D, YYYY')}</p>
            <p className="text-base-content"><strong>Time:</strong> {dayjs(bookingDetails.startTime).format('h:mm A')} - {dayjs(bookingDetails.endTime).format('h:mm A')}</p>
            <p className="text-base-content"><strong>Customer:</strong> {bookingDetails.customerName} ({bookingDetails.customerEmail})</p>
          </div>
          <div className="card-actions justify-end mt-4">
            <a href={`/barber/${tenantSlug}`} className="btn btn-primary">Go to Barbershop Homepage</a>
          </div>
        </div>
      </div>
    </div>
  );
}
