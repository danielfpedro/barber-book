'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { showError, showSuccess } from '@/app/ToastProvider';

const schema = yup.object().shape({
  tenantName: yup.string().required('Tenant name is required'),
  tenantSlug: yup.string().required('Tenant URL slug is required').matches(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });
  const router = useRouter();

  const onSubmit = async (data) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      showSuccess('Registration successful! Please log in.');
      router.push('/login');
    } else {
      const errorData = await res.json();
      showError(errorData.error || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg">
        <h3 className="text-2xl font-bold text-center">Register a new account</h3>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mt-4">
            <div>
              <label className="block" htmlFor="tenantName">Tenant Name</label>
              <input
                type="text"
                placeholder="Barbershop Name"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                {...register('tenantName')}
              />
              {errors.tenantName && <p className="text-red-500 text-sm mt-1">{errors.tenantName.message}</p>}
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="tenantSlug">Tenant URL Slug</label>
              <input
                type="text"
                placeholder="coolbarbers (for /barber/coolbarbers)"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                {...register('tenantSlug')}
              />
              {errors.tenantSlug && <p className="text-red-500 text-sm mt-1">{errors.tenantSlug.message}</p>}
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="email">Email (Admin User)</label>
              <input
                type="email"
                placeholder="Admin Email"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                {...register('email')}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="password">Password</label>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                {...register('password')}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div className="flex items-baseline justify-between">
              <button type="submit" className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" disabled={isSubmitting}>Register</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}