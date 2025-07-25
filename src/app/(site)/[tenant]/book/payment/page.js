'use client';

import { useRouter } from 'next/navigation';
import { showSuccess } from '@/app/ToastProvider';

export default function PaymentPlaceholderPage() {
  const router = useRouter();

  const handlePayment = () => {
    // Simulate payment success
    showSuccess('Payment successful! Your booking is confirmed.');
    router.push('/booking-confirmation'); // Redirect to a confirmation page
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Payment</h1>
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Confirm Your Booking</h2>
          <p>Service: Haircut</p>
          <p>Time: July 25, 2025, 10:00 AM</p>
          <p className="text-xl font-semibold">Total: $25.00</p>
          <div className="card-actions justify-end">
            <button onClick={handlePayment} className="btn btn-primary">Pay & Book</button>
          </div>
        </div>
      </div>
    </div>
  );
}
