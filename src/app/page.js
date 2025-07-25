'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const res = await fetch('/api/tenants');
        if (res.ok) {
          const data = await res.json();
          setBarbers(data);
        } else {
          setError('Failed to fetch barbers.');
        }
      } catch (err) {
        setError('An error occurred while fetching barbers.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBarbers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Welcome to Barbar Book</h1>
        <p>Loading barbers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Welcome to Barbar Book</h1>
        <p className="text-error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to Barbar Book</h1>
      <p className="mb-6">Find your perfect barbershop:</p>

      {barbers.length === 0 ? (
        <p>No barbers found at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbers.map((barber) => (
            <div key={barber.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">{barber.name}</h2>
                <p>{barber.description || 'A great barbershop.'}</p>
                <div className="card-actions justify-end">
                  <Link href={`/${barber.slug}`} className="btn btn-primary">Visit Page</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
