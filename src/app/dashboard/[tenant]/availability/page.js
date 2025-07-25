'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { showError, showSuccess } from '@/app/ToastProvider';
import Modal from '@/components/Modal';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';

const availabilitySchema = yup.object().shape({
  staffId: yup.number().typeError('Staff is required').required('Staff is required'),
  dayOfWeek: yup.number().typeError('Day of week is required').min(0).max(6).required('Day of week is required'),
  startTime: yup.string().required('Start time is required'),
  endTime: yup.string().required('End time is required'),
});

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function DashboardAvailabilityPage({ params }) {
  const { data: session } = useSession();
  const tenantSlug = React.use(params).tenant;
  const [availability, setAvailability] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(availabilitySchema),
  });

  const fetchAvailability = async () => {
    if (!session?.user?.tenantId) return;
    try {
      const res = await fetch(`/api/dashboard/${tenantSlug}/availability`);
      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
      } else {
        showError('Failed to fetch availability.');
      }
    } catch (error) {
      showError('An error occurred while fetching availability.');
    }
  };

  const fetchStaff = async () => {
    if (!session?.user?.tenantId) return;
    try {
      const res = await fetch(`/api/dashboard/${tenantSlug}/users?role=staff`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data.users);
      } else {
        showError('Failed to fetch staff.');
      }
    } catch (error) {
      showError('An error occurred while fetching staff.');
    }
  };

  useEffect(() => {
    fetchAvailability();
    fetchStaff();
  }, [session, tenantSlug]);

  const openModal = (entry = null) => {
    setEditingAvailability(entry);
    if (entry) {
      reset({
        ...entry,
        startTime: dayjs(entry.startTime).format('HH:mm'),
        endTime: dayjs(entry.endTime).format('HH:mm'),
      });
    } else {
      reset({ staffId: '', dayOfWeek: '', startTime: '', endTime: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAvailability(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      let res;
      if (editingAvailability) {
        res = await fetch(`/api/dashboard/${tenantSlug}/availability/${editingAvailability.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        showSuccess(`Availability ${editingAvailability ? 'updated' : 'created'} successfully!`);
        fetchAvailability();
        closeModal();
      } else {
        const errorData = await res.json();
        showError(errorData.error || `Failed to ${editingAvailability ? 'update' : 'create'} availability.`);
      }
    } catch (error) {
      showError(`An error occurred while ${editingAvailability ? 'updating' : 'creating'} availability.`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this availability entry?')) return;
    try {
      const res = await fetch(`/api/dashboard/${tenantSlug}/availability/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showSuccess('Availability entry deleted successfully!');
        fetchAvailability();
      } else {
        const errorData = await res.json();
        showError(errorData.error || 'Failed to delete availability entry.');
      }
    } catch (error) {
      showError('An error occurred while deleting availability entry.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-base-content">Availability</h1>
      <button className="btn btn-primary mb-4" onClick={() => openModal()}>Add New Availability</button>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Day of Week</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {availability.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.staff.email}</td>
                <td>{daysOfWeek.find(d => d.value === entry.dayOfWeek)?.label}</td>
                <td>{dayjs(entry.startTime).format('h:mm A')}</td>
                <td>{dayjs(entry.endTime).format('h:mm A')}</td>
                <td>
                  <button className="btn btn-sm btn-warning mr-2" onClick={() => openModal(entry)}>Edit</button>
                  <button className="btn btn-sm btn-error" onClick={() => handleDelete(entry.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} closeModal={closeModal} title={editingAvailability ? 'Edit Availability' : 'Add New Availability'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-base-content">Staff</label>
            <select {...register('staffId')} className="select select-bordered w-full">
              <option value="">Select staff</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.email}</option>
              ))}
            </select>
            {errors.staffId && <p className="text-error text-sm mt-1">{errors.staffId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Day of Week</label>
            <select {...register('dayOfWeek')} className="select select-bordered w-full">
              <option value="">Select day</option>
              {daysOfWeek.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
            {errors.dayOfWeek && <p className="text-error text-sm mt-1">{errors.dayOfWeek.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Start Time</label>
            <input type="time" {...register('startTime')} className="input input-bordered w-full" />
            {errors.startTime && <p className="text-error text-sm mt-1">{errors.startTime.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">End Time</label>
            <input type="time" {...register('endTime')} className="input input-bordered w-full" />
            {errors.endTime && <p className="text-error text-sm mt-1">{errors.endTime.message}</p>}
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingAvailability ? 'Update Availability' : 'Add Availability')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}