'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  tenantSlug: yup.string().optional(),
});

export default function RegisterEndUserPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  const router = useRouter();
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    try {
      const res = await fetch('/api/auth/register-end-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push('/login'); // Redirect to login after successful registration
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center">End User Registration</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              className="input input-bordered"
              {...register('email')}
            />
            {errors.email && <p className="text-error text-sm mt-1">{errors.email.message}</p>}

            <label className="label mt-4">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              placeholder="******"
              className="input input-bordered"
              {...register('password')}
            />
            {errors.password && <p className="text-error text-sm mt-1">{errors.password.message}</p>}

            

            {error && <p className="text-error text-sm mt-4 text-center">{error}</p>}

            <div className="card-actions justify-center mt-6">
              <button type="submit" className="btn btn-primary">Register</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
