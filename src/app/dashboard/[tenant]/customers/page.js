'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { showError } from '@/app/ToastProvider';

export default function CustomersPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { tenant } = use(params);
  const tenantSlug = tenant;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;


    const fetchCustomers = async () => {
      try {
        const res = await fetch(`/api/dashboard/${tenantSlug}/customers`);
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        } else {
          const errorData = await res.json();
          showError(errorData.error || 'Failed to fetch customers.');
          setError(errorData.error || 'Failed to fetch customers.');
        }
      } catch (err) {
        showError('An error occurred while fetching customers.');
        setError('An error occurred while fetching customers.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [session, status, tenantSlug, router]);

  if (loading) {
    return <div className="container mx-auto p-4">Loading customers...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-error">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">My Customers</h1>

      {customers.length === 0 ? (
        <p>No customers found yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={index}>
                  <td>{customer.customerName}</td>
                  <td>{customer.customerEmail}</td>
                  <td>{customer.customerPhone || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
