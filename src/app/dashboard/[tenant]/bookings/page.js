'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { showError, showSuccess } from '@/app/ToastProvider';
import Modal from '@/components/Modal';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';

const bookingSchema = yup.object().shape({
  customerName: yup.string().required('Customer name is required'),
  customerEmail: yup.string().email('Invalid email').required('Customer email is required'),
  customerPhone: yup.string(),
  serviceId: yup.number().typeError('Service is required').required('Service is required'),
  staffId: yup.number().typeError('Staff is required').required('Staff is required'),
  startTime: yup.date().typeError('Start time is required').required('Start time is required'),
  endTime: yup.date().typeError('End time is required').required('End time is required'),
  status: yup.string().required('Status is required'),
});

export default function DashboardBookingsPage({ params }) {
  const { data: session } = useSession();
  const tenantSlug = params.tenant;
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]); // To populate service dropdown
  const [staff, setStaff] = useState([]); // To populate staff dropdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(bookingSchema),
  });

  const fetchBookings = async () => {
    if (!session?.user?.tenantId) return;
    try {
      const res = await fetch(`/api/dashboard/${tenantSlug}/bookings`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        showError('Failed to fetch bookings.');
      }
    } catch (error) {
      showError('An error occurred while fetching bookings.');
    }
  };

  const fetchServicesAndStaff = async () => {
    if (!session?.user?.tenantId) return;
    try {
      const [servicesRes, staffRes] = await Promise.all([
        fetch(`/api/dashboard/${tenantSlug}/services`),
        fetch(`/api/dashboard/${tenantSlug}/users?role=staff`),
      ]);

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data);
      } else {
        showError('Failed to fetch services for dropdown.');
      }

      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(data);
      } else {
        showError('Failed to fetch staff for dropdown.');
      }
    } catch (error) {
      showError('An error occurred while fetching services and staff.');
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchServicesAndStaff();
  }, [session, tenantSlug]);

  const openModal = (booking = null) => {
    setEditingBooking(booking);
    if (booking) {
      reset({
        ...booking,
        serviceId: booking.serviceId,
        staffId: booking.staffId,
        startTime: dayjs(booking.startTime).format('YYYY-MM-DDTHH:mm'), // Format for datetime-local input
        endTime: dayjs(booking.endTime).format('YYYY-MM-DDTHH:mm'),
      });
    } else {
      reset({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        serviceId: '',
        staffId: '',
        startTime: '',
        endTime: '',
        status: 'confirmed',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      let res;
      if (editingBooking) {
        res = await fetch(`/api/dashboard/${tenantSlug}/bookings/${editingBooking.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        showSuccess(`Booking ${editingBooking ? 'updated' : 'created'} successfully!`);
        fetchBookings();
        closeModal();
      } else {
        const errorData = await res.json();
        showError(errorData.error || `Failed to ${editingBooking ? 'update' : 'create'} booking.`);
      }
    } catch (error) {
      showError(`An error occurred while ${editingBooking ? 'updating' : 'creating'} booking.`);
    }
  };

  const handleDelete = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`/api/dashboard/${tenantSlug}/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showSuccess('Booking cancelled successfully!');
        fetchBookings();
      } else {
        const errorData = await res.json();
        showError(errorData.error || 'Failed to cancel booking.');
      }
    } catch (error) {
      showError('An error occurred while cancelling booking.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-base-content">Bookings</h1>
      {/* <button className="btn btn-primary mb-4" onClick={() => openModal()}>Add New Booking</button> */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Service</th>
              <th>Staff</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.customerName} ({booking.customerEmail})</td>
                <td>{booking.service.name}</td>
                <td>{booking.staff.email}</td>
                <td>{dayjs(booking.startTime).format('YYYY-MM-DD')}</td>
                <td>{dayjs(booking.startTime).format('h:mm A')} - {dayjs(booking.endTime).format('h:mm A')}</td>
                <td>{booking.status}</td>
                <td>
                  <button className="btn btn-sm btn-info mr-2" onClick={() => openModal(booking)}>Edit</button>
                  <button className="btn btn-sm btn-error" onClick={() => handleDelete(booking.id)}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} closeModal={closeModal} title={editingBooking ? 'Edit Booking' : 'Add New Booking'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-base-content">Customer Name</label>
            <input type="text" {...register('customerName')} className="input input-bordered w-full" />
            {errors.customerName && <p className="text-error text-sm mt-1">{errors.customerName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Customer Email</label>
            <input type="email" {...register('customerEmail')} className="input input-bordered w-full" />
            {errors.customerEmail && <p className="text-error text-sm mt-1">{errors.customerEmail.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Customer Phone</label>
            <input type="text" {...register('customerPhone')} className="input input-bordered w-full" />
            {errors.customerPhone && <p className="text-error text-sm mt-1">{errors.customerPhone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Service</label>
            <select {...register('serviceId')} className="select select-bordered w-full">
              <option value="">Select a service</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
            {errors.serviceId && <p className="text-error text-sm mt-1">{errors.serviceId.message}</p>}
          </div>
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
            <label className="block text-sm font-medium text-base-content">Start Time</label>
            <input type="datetime-local" {...register('startTime')} className="input input-bordered w-full" />
            {errors.startTime && <p className="text-error text-sm mt-1">{errors.startTime.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">End Time</label>
            <input type="datetime-local" {...register('endTime')} className="input input-bordered w-full" />
            {errors.endTime && <p className="text-error text-sm mt-1">{errors.endTime.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Status</label>
            <select {...register('status')} className="select select-bordered w-full">
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {errors.status && <p className="text-error text-sm mt-1">{errors.status.message}</p>}
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingBooking ? 'Update Booking' : 'Add Booking')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}