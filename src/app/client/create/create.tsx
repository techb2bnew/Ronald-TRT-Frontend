"use client";
import React, { useState } from 'react';
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

export default function Technicians() {
  const [formData, setFormData] = useState({
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
  const [loading, setLoading] = useState(false);
  const router = useRouter();
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

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');

    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/createCustomer`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, 
        },
        body: JSON.stringify(formData)
      });
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
      setLoading(false);
    }
  };

  const countries = Country.getAllCountries();
  const states = formData.country ? State.getStatesOfCountry(formData.country) : [];

  return (
    <div className='main-container mb-5'>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <h1 className="text-lg leading-6 font-bold text-gray-900">Create IFS Customer</h1>
      <p className='text-sm'>Onboard clients effortlessly for seamless collaboration!</p>
      <div className='bg-white p-4 mt-5 w-[60%] m-auto'>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <p className='text-sm mb-2'>First Name <span className='text-[red]'>*</span> </p>
                <TextField fullWidth size="medium" name="firstName" id="outlined-basic" color="warning" label="Enter your first name"  variant="outlined"  value={formData.firstName}  onChange={handleChange} />
              {/* <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your client name"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              /> */}
            </div>
            <div className='mb-2'>
              <p className='text-sm mb-2'>Last Name <span className='text-[red]'>*</span></p>
              <TextField fullWidth size="medium" name="lastName" id="outlined-basic" color="warning" label="Enter your last name"  variant="outlined"  value={formData.lastName}  onChange={handleChange} />

              {/* <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your business name"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              /> */}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Phone and Email */}
            <div className='mb-2'>
              <p className='text-sm mb-2'>Phone <span className='text-[red]'>*</span></p>
              <TextField fullWidth size="medium" name="phoneNumber" id="outlined-basic" color="warning" label="Enter your phone number"  variant="outlined"  value={formData.phoneNumber}  onChange={handleChange} />

              {/* <input
                type="number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              /> */}
            </div>
            <div className='mb-2'>
              <p className='text-sm mb-2'>Email <span className='text-[red]'>*</span></p>
              <TextField fullWidth size="medium" name="email" id="outlined-basic" color="warning" label="Enter your email"  variant="outlined"  value={formData.email}  onChange={handleChange} />

              {/* <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              /> */}
            </div>
          </div>

          {/* Address */}
          <div className='mb-2'>
            <p className='text-sm mb-2'>Address <span className='text-[red]'>*</span></p>
            <TextField fullWidth size="medium" name="address" id="outlined-basic" color="warning" label="Enter your address"  variant="outlined"  value={formData.address}  onChange={handleChange} />

            {/* <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address"
              className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              required
            /> */}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Country, State, City, Zip Code */}
            <div className='mb-2'>
              <p className='text-sm mb-2'>Country <span className='text-[red]'>*</span></p>

              <FormControl fullWidth>
            <InputLabel id="country">Select country</InputLabel>
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

              {/* <select
                name="country"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                value={formData.country}
                onChange={handleChange}
              >
                <option value="">Select country</option>
                {countries.map((country: ICountry) => (
                  <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                ))}
              </select> */}
            </div>
            <div className='mb-2'>
              <p className='text-sm mb-2'>State <span className='text-[red]'>*</span></p>

              <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Select state</InputLabel>
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

              {/* <select
                name="state"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                value={formData.state}
                onChange={handleChange}
                disabled={!formData.country}
              >
                <option value="">Select state</option>
                {states.map((state: IState) => (
                  <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                ))}
              </select> */}
            </div>
            <div className='mb-2'>
              <p className='text-sm mb-2'>City <span className='text-[red]'>*</span></p>
            <TextField fullWidth size="medium" name="city" id="outlined-basic" color="warning" label="Enter your city"  variant="outlined"  value={formData.city}  onChange={handleChange} />

              {/* <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter your city"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              /> */}
            </div>
            <div className='mb-2'>
              <p className='text-sm mb-2'>Zip Code <span className='text-[red]'>*</span></p>
            <TextField fullWidth size="medium" name="zipCode" id="outlined-basic" color="warning" label="Enter your zip code"  variant="outlined"  value={formData.zipCode}  onChange={handleChange} />

              {/* <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="Enter zip code"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              /> */}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-left mt-5">
            <button
              type="submit"
              className="primary-bg pl-5 pr-5 p-2 rounded"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
