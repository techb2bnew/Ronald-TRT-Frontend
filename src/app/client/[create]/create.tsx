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
  };
  // Handle form field change
  const handleChange: React.ChangeEventHandler<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement> = (e) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
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
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>First Name <span className='text-[red]'>*</span> </p> */}
              <TextField fullWidth size="small" name="firstName" id="outlined-basic" color="warning" label="Enter your first name *" variant="outlined" value={formData.firstName} onChange={handleChange} />

            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Last Name <span className='text-[red]'>*</span></p> */}
              <TextField fullWidth size="small" name="lastName" id="outlined-basic" color="warning" label="Enter your last name *" variant="outlined" value={formData.lastName} onChange={handleChange} />


            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Phone and Email */}
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Phone <span className='text-[red]'>*</span></p> */}
              <TextField fullWidth size="small" name="phoneNumber" id="outlined-basic" color="warning" label="Enter your phone number *" variant="outlined" value={formData.phoneNumber} onChange={handleChange} />


            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Email <span className='text-[red]'>*</span></p> */}
              <TextField fullWidth size="small" name="email" id="outlined-basic" color="warning" label="Enter your email *" variant="outlined" value={formData.email} onChange={handleChange} />


            </div>
          </div>

          {/* Address */}
          <div className='mb-4'>
            {/* <p className='text-sm mb-2'>Address <span className='text-[red]'>*</span></p> */}
            <TextField fullWidth size="small" name="address" id="outlined-basic" color="warning" label="Enter your address *" variant="outlined" value={formData.address} onChange={handleChange} />


          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Country, State, City, Zip Code */}
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Country <span className='text-[red]'>*</span></p> */}

              <FormControl fullWidth size="small">
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
              </FormControl>


            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>State <span className='text-[red]'>*</span></p> */}

              <FormControl fullWidth size="small">
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
              </FormControl>
            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>City <span className='text-[red]'>*</span></p> */}
              <TextField fullWidth size="small" name="city" id="outlined-basic" color="warning" label="Enter your city *" variant="outlined" value={formData.city} onChange={handleChange} />


            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Zip Code <span className='text-[red]'>*</span></p> */}
              <TextField fullWidth size="small" name="zipCode" id="outlined-basic" color="warning" label="Enter your zip code *" variant="outlined" value={formData.zipCode} onChange={handleChange} />


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
