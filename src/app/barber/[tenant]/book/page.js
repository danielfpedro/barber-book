'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { showError, showSuccess } from '@/app/ToastProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/rbac';
import dayjs from 'dayjs';
import { useSession, signOut } from 'next-auth/react';

const serviceSchema = yup.object().shape({
  serviceId: yup.number().typeError('Please select a service').required('Please select a service'),
});

const staffSchema = yup.object().shape({
  staffId: yup.number().typeError('Please select staff').nullable(),
});

const dateTimeSchema = yup.object().shape({
  date: yup.string().required('Please select a date'),
  slot: yup.string().required('Please select a time slot'),
});

const customerInfoSchema = yup.object().shape({
  customerName: yup.string().required('Name is required'),
  customerEmail: yup.string().email('Invalid email').required('Email is required'),
  customerPhone: yup.string(),
});

export default function BookingWizardPage({ params }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { tenant } = use(params);
  const tenantSlug = tenant;
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingStatus, setBookingStatus] = useState('idle'); // 'idle', 'pending', 'success', 'error'

  const { register: serviceRegister, handleSubmit: handleServiceSubmit, formState: { errors: serviceErrors } } = useForm({
    resolver: yupResolver(serviceSchema),
  });

  const { register: staffRegister, handleSubmit: handleStaffSubmit, formState: { errors: staffErrors } } = useForm({
    resolver: yupResolver(staffSchema),
  });

  const { register: dateTimeRegister, handleSubmit: handleDateTimeSubmit, watch, formState: { errors: dateTimeErrors } } = useForm({
    resolver: yupResolver(dateTimeSchema),
  });
  const watchDate = watch('date');
  const watchStaffId = watch('staffId');

  const { register: customerInfoRegister, handleSubmit: handleCustomerInfoSubmit, setValue, formState: { errors: customerInfoErrors } } = useForm({
    resolver: yupResolver(customerInfoSchema),
  });

  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });

  const nextStep = useCallback(() => {
    if (step === 3 && session?.user?.type === 'endUser') {
      // If endUser is logged in, skip step 4 (Your Info) and go directly to step 5
      setStep(5);
    } else {
      setStep(step + 1);
    }
  }, [step, session]);

  const prevStep = useCallback(() => {
    if (step === 5 && session?.user?.type === 'endUser') {
      // If endUser is logged in, going back from step 5 means going to step 3
      setStep(3);
    } else {
      setStep(step - 1);
    }
  }, [step, session]);

  const handleCustomerInfoProceed = useCallback((data) => {
    setCustomerInfo(data);
    nextStep();
  }, [nextStep, setCustomerInfo]);

  const confirmBooking = useCallback(async () => {
    setBookingStatus('pending');
    try {
      const bookingData = {
        customerName: customerInfo.customerName,
        customerEmail: customerInfo.customerEmail,
        customerPhone: customerInfo.customerPhone,
        serviceId: selectedService.id,
        staffId: selectedSlot.staffId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        status: 'confirmed',
        ...(session?.user?.type === 'endUser' && { endUserId: session.user.id }),
      };

      console.log('Sending booking data:', bookingData);

      const res = await fetch(`/api/barber/${tenantSlug}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (res.ok) {
        const newBooking = await res.json();
        showSuccess('Booking confirmed successfully!');
        setBookingStatus('success');
      } else {
        const errorData = await res.json();
        showError(errorData.error || 'Failed to confirm booking.');
        setBookingStatus('error');
      }
    } catch (error) {
      showError('An error occurred while confirming booking.');
      setBookingStatus('error');
    }
  }, [customerInfo, selectedService, selectedSlot, session, tenantSlug, router, setBookingStatus]);

  useEffect(() => {
    const fetchServicesAndStaff = async () => {
      try {
        const [servicesRes, staffRes] = await Promise.all([
          fetch(`/api/barber/${tenantSlug}/services`),
          fetch(`/api/barber/${tenantSlug}/staff`),
        ]);

        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(data);
        } else {
          showError('Failed to fetch services.');
        }

        if (staffRes.ok) {
          const data = await staffRes.json();
          setStaff(data);
        } else {
          showError('Failed to fetch staff.');
        }
      } catch (error) {
        showError('An error occurred while fetching data.');
      }
    };
    fetchServicesAndStaff();
  }, [tenantSlug]);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (watchDate && selectedService) {
        console.log('Fetching available slots for:', { watchDate, selectedService, selectedStaff });
        try {
          const query = new URLSearchParams({
            serviceId: selectedService.id,
            date: watchDate,
          });
          if (selectedStaff) {
            query.append('staffId', selectedStaff.id);
          }
          const res = await fetch(`/api/barber/${tenantSlug}/availability?${query.toString()}`);
          if (res.ok) {
            const data = await res.json();
            setAvailableSlots(data);
            console.log('Available slots fetched:', data);
          } else {
            const errorData = await res.json();
            showError(errorData.error || 'Failed to fetch available slots.');
            console.error('Failed to fetch available slots:', errorData);
          }
        } catch (error) {
          showError('An error occurred while fetching available slots.');
          console.error('Error fetching available slots:', error);
        }
      }
    };
    fetchAvailableSlots();
  }, [watchDate, selectedService, selectedStaff, tenantSlug]);

  useEffect(() => {
    if (session?.user?.type === 'endUser') {
      setCustomerInfo({
        customerName: session.user.email,
        customerEmail: session.user.email,
        customerPhone: '',
      });
    }
  }, [session]);

  const onServiceSelect = (data) => {
    setSelectedService(services.find(s => s.id === parseInt(data.serviceId)));
    nextStep();
  };

  const onStaffSelect = (data) => {
    setSelectedStaff(staff.find(s => s.id === parseInt(data.staffId)));
    nextStep();
  };

  const onDateTimeSelect = (data) => {
    setSelectedDate(data.date);
    setSelectedSlot(JSON.parse(data.slot));
    nextStep();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Booking Wizard - Step {step}</h1>
      <ul className="steps steps-vertical lg:steps-horizontal w-full">
        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Select Service</li>
        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Pick Staff</li>
        <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Pick Date/Time</li>
        {session?.user?.type !== 'endUser' && (
          <li className={`step ${step >= 4 ? 'step-primary' : ''}`}>Your Info</li>
        )}
        <li className={`step ${step >= 5 ? 'step-primary' : ''}`}>Payment</li>
        <li className={`step ${step >= 6 ? 'step-primary' : ''}`}>Confirmation</li>
      </ul>

      <div className="mt-8">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 1: Select a Service</h2>
            <form onSubmit={handleServiceSubmit(onServiceSelect)} className="space-y-4">
              <select {...serviceRegister('serviceId')} className="select select-bordered w-full">
                <option value="">Select a service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>{service.name} - ${service.price.toFixed(2)} ({service.duration} min)</option>
                ))}
              </select>
              {serviceErrors.serviceId && <p className="text-error text-sm mt-1">{serviceErrors.serviceId.message}</p>}
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary mt-4">Next</button>
              </div>
            </form>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 2: Pick Staff (Optional)</h2>
            <form onSubmit={handleStaffSubmit(onStaffSelect)} className="space-y-4">
              <select {...staffRegister('staffId')} className="select select-bordered w-full">
                <option value="">Any Staff</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.email}</option>
                ))}
              </select>
              {staffErrors.staffId && <p className="text-error text-sm mt-1">{staffErrors.staffId.message}</p>}
              <div className="flex justify-between">
                <button type="button" onClick={prevStep} className="btn btn-secondary mt-4">Previous</button>
                <button type="submit" className="btn btn-primary mt-4">Next</button>
              </div>
            </form>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 3: Pick Available Date/Time</h2>
            <form onSubmit={handleDateTimeSubmit(onDateTimeSelect)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-base-content">Date</label>
                <input type="date" {...dateTimeRegister('date')} className="input input-bordered w-full" />
                {dateTimeErrors.date && <p className="text-error text-sm mt-1">{dateTimeErrors.date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-base-content">Available Time Slots</label>
                <select {...dateTimeRegister('slot')} className="select select-bordered w-full" disabled={availableSlots.length === 0}>
                  <option value="">Select a time slot</option>
                  {availableSlots.map((slot, index) => (
                    <option key={index} value={JSON.stringify(slot)}>
                      {dayjs(slot.startTime).format('h:mm A')} - {dayjs(slot.endTime).format('h:mm A')} ({slot.staffEmail})
                    </option>
                  ))}
                </select>
                {dateTimeErrors.slot && <p className="text-error text-sm mt-1">{dateTimeErrors.slot.message}</p>}
                {availableSlots.length === 0 && watchDate && selectedService && <p className="text-sm text-base-content mt-1">No available slots for this date and service.</p>}
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={prevStep} className="btn btn-secondary mt-4">Previous</button>
                <button type="submit" className="btn btn-primary mt-4" disabled={availableSlots.length === 0}>Next</button>
              </div>
            </form>
          </div>
        )}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 4: Fill in Personal Info</h2>
            {session?.user?.type === 'endUser' ? (
              <div className="alert alert-info mb-4">
                You are logged in as <strong>{session.user.email}</strong>.
                <button type="button" onClick={() => signOut({ callbackUrl: '/enduser/login' })} className="btn btn-sm btn-ghost ml-4">Change User</button>
              </div>
            ) : (
              <p className="text-sm text-base-content mb-4">Please provide your contact information.</p>
            )}
            <form onSubmit={handleCustomerInfoSubmit(handleCustomerInfoProceed)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-base-content">Name</label>
                <input type="text" {...customerInfoRegister('customerName')} className="input input-bordered w-full" readOnly={session?.user?.type === 'endUser'} />
                {customerInfoErrors.customerName && <p className="text-error text-sm mt-1">{customerInfoErrors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-base-content">Email</label>
                <input type="email" {...customerInfoRegister('customerEmail')} className="input input-bordered w-full" readOnly={session?.user?.type === 'endUser'} />
                {customerInfoErrors.customerEmail && <p className="text-error text-sm mt-1">{customerInfoErrors.customerEmail.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-base-content">Phone (Optional)</label>
                <input type="text" {...customerInfoRegister('customerPhone')} className="input input-bordered w-full" readOnly={session?.user?.type === 'endUser'} />
                {customerInfoErrors.customerPhone && <p className="text-error text-sm mt-1">{customerInfoErrors.customerPhone.message}</p>}
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={prevStep} className="btn btn-secondary mt-4">Previous</button>
                <button type="submit" className="btn btn-primary mt-4">Next</button>
              </div>
            </form>
          </div>
        )}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 5: Payment Placeholder</h2>
            <p className="text-base-content">Service: {selectedService?.name}</p>
            <p className="text-base-content">Staff: {selectedSlot?.staffEmail || 'Any'}</p>
            <p className="text-base-content">Date: {selectedDate}</p>
            <p className="text-base-content">Time: {selectedSlot ? `${dayjs(selectedSlot.startTime).format('h:mm A')} - ${dayjs(selectedSlot.endTime).format('h:mm A')}` : ''}</p>
            <p className="text-xl font-semibold text-base-content">Total: ${selectedService?.price.toFixed(2)}</p>
            <div className="flex justify-between">
              <button type="button" onClick={prevStep} className="btn btn-secondary mt-4">Previous</button>
              <button onClick={nextStep} className="btn btn-primary mt-4">Proceed to Confirmation</button>
            </div>
          </div>
        )}
        {step === 6 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 6: Booking Confirmation</h2>
            {bookingStatus === 'pending' && (
              <div className="alert alert-info mb-4">
                <span className="loading loading-spinner"></span>
                Confirming your booking...
              </div>
            )}
            {bookingStatus === 'success' && (
              <div className="alert alert-success mb-4">
                Your booking has been successfully confirmed!
              </div>
            )}
            {bookingStatus === 'error' && (
              <div className="alert alert-error mb-4">
                There was an error confirming your booking. Please try again.
              </div>
            )}
            <p className="text-base-content">Review your booking details and confirm.</p>
            <div className="mt-4 p-4 border rounded-lg bg-base-200">
              <h3 className="text-lg font-semibold mb-2">Booking Summary</h3>
              <p className="text-base-content"><strong>Service:</strong> {selectedService?.name} (${selectedService?.price.toFixed(2)})</p>
              <p className="text-base-content"><strong>Staff:</strong> {selectedSlot?.staffEmail || 'Any'}</p>
              <p className="text-base-content"><strong>Date:</strong> {selectedDate}</p>
              <p className="text-base-content"><strong>Time:</strong> {selectedSlot ? `${dayjs(selectedSlot.startTime).format('h:mm A')} - ${dayjs(selectedSlot.endTime).format('h:mm A')}` : ''}</p>
              <p className="text-base-content"><strong>Customer Name:</strong> {customerInfo.customerName}</p>
              <p className="text-base-content"><strong>Customer Email:</strong> {customerInfo.customerEmail}</p>
              {customerInfo.customerPhone && <p className="text-base-content"><strong>Customer Phone:</strong> {customerInfo.customerPhone}</p>}
            </div>
            <div className="flex justify-between mt-4">
              <button type="button" onClick={prevStep} className="btn btn-secondary" disabled={bookingStatus === 'pending'}>Previous</button>
              <button onClick={confirmBooking} className="btn btn-primary" disabled={bookingStatus === 'pending'}>Confirm Booking</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}