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
    zipCode: ''
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
          headers['Authorization'] = `Token ${token}`;
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
            ...data.customers,
            id: data.customers.id, 
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

    // Create headers object
    const headers: Record<string, string> = {};
    // If token exists, add it to Authorization header
   
    try {
    setSubmitting(true);

      const response = await fetch(`${apiUrl}/${isEdit ? 'updateCustomer' : 'createCustomer'}`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, 
        },
        body: JSON.stringify(isEdit ? { ...formData, customerId: formData.id } : formData), 
      });
      if (response.status  == 400) {
        localStorage.removeItem('token');
        router.push('/login');
      }
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
          zipCode: ''
        });
        setTimeout(() => {
        router.push('/client/listing');
      }, 1000);

      } else {
        toast.error(data.error);

      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);  // ✅ Hide loader when done
    }
  };

  const countries = Country.getAllCountries();
  const states = formData.country ? State.getStatesOfCountry(formData.country) : [];

  return (
    <div className='main-container mb-5'>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {/* <h1 className="text-lg leading-6 font-bold text-gray-900">Create IFS Customer</h1> */}
      <h1 className="text-lg leading-6 font-bold text-gray-900">{isEdit ? 'Edit Customer' : 'Create New Customer'}</h1>
      {/* <p className='text-sm'>Onboard clients effortlessly for seamless collaboration!</p> */}
      <div className='bg-white p-4 mt-5 w-[60%] m-auto'>
         {submitting ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader />  {/* ✅ Show loader during submission */}
                  </div>
                ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>First Name <span className='text-[red]'>*</span> </p> */}
                <TextField fullWidth size="medium" name="firstName" id="outlined-basic" color="warning" label="Enter your first name *"  variant="outlined"  value={formData.firstName}  onChange={handleChange} />
              
            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Last Name <span className='text-[red]'>*</span></p> */}
              <TextField fullWidth size="medium" name="lastName" id="outlined-basic" color="warning" label="Enter your last name *"  variant="outlined"  value={formData.lastName}  onChange={handleChange} />

              
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Phone and Email */}
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Phone <span className='text-[red]'>*</span></p> */}
              <TextField fullWidth size="medium" name="phoneNumber" id="outlined-basic" color="warning" label="Enter your phone number *"  variant="outlined"  value={formData.phoneNumber}  onChange={handleChange} />

              
            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Email <span className='text-[red]'>*</span></p> */}
              <TextField fullWidth size="medium" name="email" id="outlined-basic" color="warning" label="Enter your email *"  variant="outlined"  value={formData.email}  onChange={handleChange} />

             
            </div>
          </div>

          {/* Address */}
          <div className='mb-4'>
            {/* <p className='text-sm mb-2'>Address <span className='text-[red]'>*</span></p> */}
            <TextField fullWidth size="medium" name="address" id="outlined-basic" color="warning" label="Enter your address *"  variant="outlined"  value={formData.address}  onChange={handleChange} />

           
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Country, State, City, Zip Code */}
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Country <span className='text-[red]'>*</span></p> */}

              <FormControl fullWidth>
            <InputLabel id="country">Select country *</InputLabel>
            <Select
              labelId="country"
              id="country"
              value={formData.country}
              label="country"
              name="country"
              onChange={handleSelectChange}
            > 
              {countries.map((country: ICountry) => ( 
              <MenuItem  key={country.isoCode} value={country.isoCode}> {country.name} </MenuItem>
                ))} 
            </Select>
          </FormControl>

            
            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>State <span className='text-[red]'>*</span></p> */}

              <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Select state *</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={formData.state}
              label="State"
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
            <TextField fullWidth size="medium" name="city" id="outlined-basic" color="warning" label="Enter your city *"  variant="outlined"  value={formData.city}  onChange={handleChange} />

             
            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Zip Code <span className='text-[red]'>*</span></p> */}
            <TextField fullWidth size="medium" name="zipCode" id="outlined-basic" color="warning" label="Enter your zip code *"  variant="outlined"  value={formData.zipCode}  onChange={handleChange} />

             
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-left mt-5">
            <button
              type="submit"
              className="primary-bg pl-5 pr-5 p-2 rounded" 
            >
             Submit
            </button>
          </div>
        </form>
         )}

      </div>
    </div>
  );
}
