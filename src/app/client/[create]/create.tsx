"use client";
import React, { useState, useEffect } from 'react';
import { Country, State } from 'country-state-city';
import { ICountry, IState } from 'country-state-city';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Loader from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';
import { FormHelperText } from '@mui/material';

interface CustomerForm {
  id?: string;  // Optional ID for editing
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  userId: string;
  roleType: string;
}

export default function Technicians() {
  const [formData, setFormData] = useState<CustomerForm>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: '',
    country: '',
    state: '',
    city: '',
    zipCode: '',
    userId: '',
    roleType: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);  // ✅ Track form submission state
  const router = useRouter();
  const [isEdit, setIsEdit] = useState<boolean>(false); // To differentiate between create and edit 
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const handleSelectChange = (
    event: SelectChangeEvent<string>,
    child: React.ReactNode // You might not actually need to use this parameter in your function
  ) => {
    const name = event.target.name; // The name of the select element if you set it
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  // Handle form field change
  const handleChange: React.ChangeEventHandler<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement> = (e) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const fetchCustomerData = async (customerId: string) => {

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    try {
      const token = localStorage.getItem('token');

      // Create headers object
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // If token exists, add it to Authorization header
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Make GET request with technicianId as query parameter
      const response = await fetch(`${apiUrl}/fetchSingleCustomer?customerId=${customerId}`, {
        method: 'POST',
        headers,
      });
      const data = await response.json();

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          ...data.customers.customer,
          id: data.customers.customer.id,
        }));
      } else {
        toast.error(data.error || 'Error fetching technician data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching technician data');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const customerId = searchParams.get('customerId') || '';
    console.log(customerId, 'customerIdcustomerId')
    if (customerId) {
      setIsEdit(true);  // Set to true if `customerId` exists in the URL
      setFormData(prev => ({ ...prev, id: customerId }));
      fetchCustomerData(customerId);
    } else {
      setIsEdit(false); // Set to false if `customerId` is missing
    }
  }, []);
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone Number is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    if (!formData.address?.trim()) newErrors.address = 'Address is required';
    if (!formData.country?.trim()) newErrors.country = 'Country is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.zipCode?.trim()) newErrors.zipCode = 'Zip Code is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors); // Replace all errors with new ones
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userID');
    const roleType = localStorage.getItem('types');
    console.log(roleType, 'role>>>>')

    if (!userId && !roleType) {
      toast.error("User ID not found!");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        userId,
        roleType,
        ...(isEdit && { customerId: formData.id })
      };

      const response = await fetch(`${apiUrl}/${isEdit ? 'updateCustomer' : 'createCustomer'}`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload), // ✅ Updated payload with userId
      });

      // if (response.status == 400) {
      //   localStorage.removeItem('token');
      //   router.push('/');
      //   return;
      // }

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setFormData({
          firstName: '',
          lastName: '',
          phoneNumber: '',
          email: '',
          address: '',
          country: '',
          state: '',
          city: '',
          zipCode: '',
          roleType: '',
          userId: '' // ✅ Clear userId as well
        });

        router.push('/client/listing');

      } else {
        toast.error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };


  const countries = Country.getAllCountries();
  const states = formData.country ? State.getStatesOfCountry(formData.country) : [];

  return (
    <div className='main-container mb-5'>
      <Breadcrumb
        items={[
          { label: 'Customers', href: '/client/listing' },
          isEdit
            ? { label: 'Edit Customer' }
            : { label: 'Create Customer', href: '/client/create' },

        ]}
      />
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {/* <h1 className="text-lg leading-6 font-bold text-gray-900">Create IFS Customer</h1> */}
      <h1 className="text-lg leading-6 font-bold text-gray-900">{isEdit ? 'Edit Customer' : 'Create New Customer'}</h1>
      {/* <p className='text-sm'>Onboard clients effortlessly for seamless collaboration!</p> */}
      <div className='bg-white p-4 mt-5 w-[60%] m-auto'>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-4 relative'>

              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <TextField fullWidth error={!!errors.firstName} helperText={errors.firstName || ''} name="firstName" id="outlined-basic" color="warning" label="Enter your first name" size="small" value={formData.firstName} onChange={handleChange} />

            </div>
            <div className='mb-4 relative'>

              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <TextField fullWidth error={!!errors.lastName} helperText={errors.lastName || ''} name="lastName" id="outlined-basic" color="warning" label="Enter your last name" size="small" value={formData.lastName} onChange={handleChange} />


            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Phone and Email */}
            <div className='mb-4 relative'>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="icon__tech" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="2" width="10" height="16" rx="2" stroke="#5B5B99" strokeWidth="1.5" />
                <rect x="8" y="3.5" width="4" height="1" fill="#5B5B99" />
                <circle cx="7" cy="7" r="0.8" fill="#5B5B99" />
                <circle cx="10" cy="7" r="0.8" fill="#5B5B99" />
                <circle cx="13" cy="7" r="0.8" fill="#5B5B99" />

                <circle cx="7" cy="10" r="0.8" fill="#5B5B99" />
                <circle cx="10" cy="10" r="0.8" fill="#5B5B99" />
                <circle cx="13" cy="10" r="0.8" fill="#5B5B99" />

                <circle cx="7" cy="13" r="0.8" fill="#5B5B99" />
                <circle cx="10" cy="13" r="0.8" fill="#5B5B99" />
                <circle cx="13" cy="13" r="0.8" fill="#5B5B99" />
              </svg>
              <TextField fullWidth error={!!errors.phoneNumber} helperText={errors.phoneNumber || ''} name="phoneNumber" id="outlined-basic" color="warning" label="Enter your phone number" size="small" value={formData.phoneNumber} onChange={handleChange}   />


            </div>
            <div className='mb-4 relative'>
              <svg width="16" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="#5B5B99" strokeWidth="1.2" />
                <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <TextField fullWidth error={!!errors.email} helperText={errors.email || ''} name="email" id="outlined-basic" color="warning" label="Enter your email" size="small" value={formData.email} onChange={handleChange}   />


            </div>
          </div>

          {/* Address */}
          <div className='mb-4 relative'>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" className="icon__tech"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <TextField fullWidth error={!!errors.address} helperText={errors.address || ''} name="address" id="outlined-basic" color="warning" label="Enter your address" size="small" value={formData.address} onChange={handleChange}   />


          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Country, State, City, Zip Code */}
            <div className='mb-4 relative'>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" className="icon__tech"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>

              <FormControl fullWidth size="small" error={!!errors.country}>
                <InputLabel id="country" color="warning">Select country *</InputLabel>
                <Select
                  labelId="country"
                  id="country"
                  color="warning"
                  value={formData.country}
                  label="Select country"
                  name="country"
                   
                  onChange={handleSelectChange}
                >
                  {countries.map((country: ICountry) => (
                    <MenuItem key={country.isoCode} value={country.isoCode}> {country.name} </MenuItem>
                  ))}
                </Select>
                {errors.country && (
                  <FormHelperText>{errors.country}</FormHelperText>
                )}
              </FormControl>


            </div>
            <div className='mb-4 relative'>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" className="icon__tech"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <FormControl fullWidth size="small" error={!!errors.country}>
                <InputLabel id="demo-simple-select-label" color="warning">Select state *</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={formData.state}
                  label="State state"
                  color="warning"
                  name="state"
                   
                  onChange={handleSelectChange}
                >
                  {states.map((state: IState) => (
                    <MenuItem key={state.isoCode} value={state.isoCode}>{state.name}</MenuItem>
                  ))}
                </Select>
                {errors.state && (
                  <FormHelperText>{errors.state}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div className='mb-4 relative'>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" className="icon__tech"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <TextField fullWidth error={!!errors.city} helperText={errors.city || ''} name="city" id="outlined-basic" color="warning" label="Enter your city" size="small" value={formData.city} onChange={handleChange}   />


            </div>
            <div className='mb-4 relative'>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                <path d="M7 5L2 10L7 15" stroke="#5B5B99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 5L18 10L13 15" stroke="#5B5B99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <TextField fullWidth error={!!errors.zipCode} helperText={errors.zipCode || ''} name="zipCode" id="outlined-basic" color="warning" label="Enter your zip code" size="small" value={formData.zipCode} onChange={handleChange}   />


            </div>
          </div>

          {/* Submit Button */}
          <div className="text-left mt-5">
            <button
              type="submit"
              className="primary-bg pl-5 pr-5 p-2 rounded flex items-center justify-center gap-2 min-w-[100px]"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>


      </div>
    </div>
  );
}
