'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function EndUserLoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  const router = useRouter();
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    setError(null);
    const result = await signIn('enduser-credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result.error) {
      setError(result.error);
    } else {
      router.push('/enduser/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center">End User Login</h2>
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
              <button type="submit" className="btn btn-primary">Login</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
