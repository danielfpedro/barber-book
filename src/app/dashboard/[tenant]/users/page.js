'use client';

import { useState, useEffect, use as ReactUse } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { showError, showSuccess } from '@/app/ToastProvider';
import Modal from '@/components/Modal';
import { useSession } from 'next-auth/react';
import { USER_ROLES, useHasRole } from '@/lib/rbac';
import dayjs from 'dayjs';

const userSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').nullable().transform((curr, orig) => orig === '' ? null : curr),
  role: yup.string().oneOf(Object.values(USER_ROLES), 'Invalid role').required('Role is required'),
});

export default function DashboardUsersPage({ params }) {
  const resolvedParams = ReactUse(params); // Unwrap params using React.use()
  const tenantSlug = resolvedParams.tenant;

  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const isAdmin = useHasRole(USER_ROLES.TENANT_ADMIN);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(userSchema),
  });

  const fetchUsers = async () => {
    if (!session?.user?.tenantId) return;
    try {
      const res = await fetch(`/api/dashboard/${tenantSlug}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        showError('Failed to fetch users.');
      }
    } catch (error) {
      showError('An error occurred while fetching users.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session, tenantSlug]);

  const openModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      reset({ ...user, password: '' }); // Don't pre-fill password
    } else {
      reset({ email: '', password: '', role: USER_ROLES.TENANT_STAFF }); // Ensure empty strings for new user
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      let res;
      if (editingUser) {
        res = await fetch(`/api/dashboard/${tenantSlug}/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch(`/api/dashboard/${tenantSlug}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        showSuccess(`User ${editingUser ? 'updated' : 'created'} successfully!`);
        fetchUsers();
        closeModal();
      } else {
        const errorData = await res.json();
        showError(errorData.error || `Failed to ${editingUser ? 'update' : 'create'} user.`);
      }
    } catch (error) {
      showError(`An error occurred while ${editingUser ? 'updating' : 'creating'} user.`);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/dashboard/${tenantSlug}/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showSuccess('User deleted successfully!');
        fetchUsers();
      } else {
        const errorData = await res.json();
        showError(errorData.error || 'Failed to delete user.');
      }
    } catch (error) {
      showError('An error occurred while deleting user.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Users & Roles</h1>
      {isAdmin && (
        <button className="btn btn-primary mb-4" onClick={() => openModal()}>Add New User</button>
      )}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.role}</td>
                {isAdmin && (
                  <td>
                    <button className="btn btn-sm btn-warning mr-2" onClick={() => openModal(user)}>Edit</button>
                    <button className="btn btn-sm btn-error" onClick={() => handleDelete(user.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} closeModal={closeModal} title={editingUser ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-base-content">Email</label>
            <input type="email" {...register('email')} className="input input-bordered w-full" />
            {errors.email && <p className="text-error text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Password {editingUser && '(leave blank to keep current)'}</label>
            <input type="password" {...register('password')} className="input input-bordered w-full" />
            {errors.password && <p className="text-error text-sm mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content">Role</label>
            <select {...register('role')} className="select select-bordered w-full">
              {Object.values(USER_ROLES).filter(role => role !== USER_ROLES.CUSTOMER && role !== USER_ROLES.PLATFORM_ADMIN).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {errors.role && <p className="text-error text-sm mt-1">{errors.role.message}</p>}
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingUser ? 'Update User' : 'Add User')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
