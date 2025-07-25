'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { showError, showSuccess } from '@/app/ToastProvider';
import Modal from '@/components/Modal';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';

const serviceSchema = yup.object().shape({
  name: yup.string().required('Service name is required'),
  description: yup.string(),
  price: yup.number().typeError('Price must be a number').positive('Price must be positive').required('Price is required'),
  duration: yup.number().typeError('Duration must be a number').integer('Duration must be an integer').positive('Duration must be positive').required('Duration is required'),
  staffIds: yup.array().of(yup.number()).nullable(),
});

export default function DashboardServicesPage({ params }) {
  const { data: session } = useSession();
  const tenantSlug = params.tenant;
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]); // To populate staff assignment dropdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(serviceSchema),
  });

  const fetchServices = async () => {
    if (!session?.user?.tenantId) return;
    try {
      const res = await fetch(`/api/dashboard/${tenantSlug}/services`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      } else {
        showError('Failed to fetch services.');
      }
    } catch (error) {
      showError('An error occurred while fetching services.');
    }
  };

  const fetchStaff = async () => {
    if (!session?.user?.tenantId) return;
    try {
      const res = await fetch(`/api/dashboard/${tenantSlug}/users?role=staff`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      } else {
        showError('Failed to fetch staff for assignment.');
      }
    } catch (error) {
      showError('An error occurred while fetching staff for assignment.');
    }
  };

  useEffect(() => {
    fetchServices();
    fetchStaff();
  }, [session, tenantSlug]);

  const openModal = (service = null) => {
    setEditingService(service);
    if (service) {
      reset({ ...service, staffIds: service.staff.map(s => s.id) });
    } else {
      reset({ name: '', description: '', price: '', duration: '', staffIds: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      let res;
      if (editingService) {
        res = await fetch(`/api/dashboard/${tenantSlug}/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch(`/api/dashboard/${tenantSlug}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        showSuccess(`Service ${editingService ? 'updated' : 'created'} successfully!`);
        fetchServices();
        closeModal();
      } else {
        const errorData = await res.json();
        showError(errorData.error || `Failed to ${editingService ? 'update' : 'create'} service.`);
      }
    } catch (error) {
      showError(`An error occurred while ${editingService ? 'updating' : 'creating'} service.`);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await fetch(`/api/dashboard/${tenantSlug}/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showSuccess('Service deleted successfully!');
        fetchServices();
      } else {
        const errorData = await res.json();
        showError(errorData.error || 'Failed to delete service.');
      }
    } catch (error) {
      showError('An error occurred while deleting service.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-base-content">Services</h1>
      <button className="btn btn-primary mb-4" onClick={() => openModal()}>Add New Service</button>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Duration (min)</th>
              <th>Assigned Staff</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>{service.description}</td>
                <td>${service.price.toFixed(2)}</td>
                <td>{service.duration}</td>
                <td>{service.staff.map(s => s.email).join(', ') || 'None'}</td>
                <td>
                  <button className="btn btn-sm btn-warning mr-2" onClick={() => openModal(service)}>Edit</button>
                  <button className="btn btn-sm btn-error" onClick={() => handleDelete(service.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} closeModal={closeModal} title={editingService ? 'Edit Service' : 'Add New Service'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-base-content">Name</label>
            <input type="text" {...register('name')} className="input input-bordered w-full" />
            {errors.name && <p className="text-error text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Description</label>
            <textarea {...register('description')} className="textarea textarea-bordered w-full"></textarea>
            {errors.description && <p className="text-error text-sm mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Price</label>
            <input type="number" step="0.01" {...register('price')} className="input input-bordered w-full" />
            {errors.price && <p className="text-error text-sm mt-1">{errors.price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Duration (minutes)</label>
            <input type="number" {...register('duration')} className="input input-bordered w-full" />
            {errors.duration && <p className="text-error text-sm mt-1">{errors.duration.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Assign Staff</label>
            <select multiple {...register('staffIds')} className="select select-bordered w-full h-32">
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.email}</option>
              ))}
            </select>
            {errors.staffIds && <p className="text-error text-sm mt-1">{errors.staffIds.message}</p>}
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingService ? 'Update Service' : 'Add Service')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}