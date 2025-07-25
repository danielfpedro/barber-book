'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { showError, showSuccess } from '@/app/ToastProvider';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';

const settingsSchema = yup.object().shape({
  name: yup.string().required('Tenant name is required'),
  slug: yup.string().required('Tenant URL slug is required').matches(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

export default function DashboardSettingsPage({ params }) {
  const { data: session } = useSession();
  const tenantSlug = params.tenant;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(settingsSchema),
  });

  useEffect(() => {
    const fetchTenantSettings = async () => {
      if (!session?.user?.tenantId) return;
      try {
        const res = await fetch(`/api/dashboard/${tenantSlug}/settings`);
        if (res.ok) {
          const data = await res.json();
          reset(data);
        } else {
          showError('Failed to fetch tenant settings.');
        }
      } catch (error) {
        showError('An error occurred while fetching tenant settings.');
      }
    };
    fetchTenantSettings();
  }, [session, tenantSlug, reset]);

  const onSubmit = async (data) => {
    try {
      const res = await fetch(`/api/dashboard/${tenantSlug}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        showSuccess('Tenant settings updated successfully!');
        // Optionally, refresh session or redirect if slug changes
      } else {
        const errorData = await res.json();
        showError(errorData.error || 'Failed to update tenant settings.');
      }
    } catch (error) {
      showError('An error occurred while updating tenant settings.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-base-content">Settings</h1>
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-base-content">Tenant Information</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content">Tenant Name</label>
              <input type="text" {...register('name')} className="input input-bordered w-full" />
              {errors.name && <p className="text-error text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-base-content">Tenant URL Slug</label>
              <input type="text" {...register('slug')} className="input input-bordered w-full" />
              {errors.slug && <p className="text-error text-sm mt-1">{errors.slug.message}</p>}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Update Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}