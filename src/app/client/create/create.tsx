"use client";
import React, { useState } from 'react';
import { Country, State } from 'country-state-city';
import { ICountry, IState } from 'country-state-city';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';

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

  // Handle form field change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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
              <label htmlFor="firstName" className='text-sm'>First Name <span className='text-[red]'>*</span> </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your client name"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              />
            </div>
            <div className='mb-2'>
              <label htmlFor="lastName" className='text-sm'>Last Name <span className='text-[red]'>*</span></label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your business name"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Phone and Email */}
            <div className='mb-2'>
              <label htmlFor="phone" className='text-sm'>Phone <span className='text-[red]'>*</span></label>
              <input
                type="number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              />
            </div>
            <div className='mb-2'>
              <label htmlFor="email" className='text-sm'>Email <span className='text-[red]'>*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div className='mb-2'>
            <label htmlFor="address" className='text-sm'>Address <span className='text-[red]'>*</span></label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address"
              className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              required
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Country, State, City, Zip Code */}
            <div className='mb-2'>
              <label htmlFor="country" className='text-sm'>Country <span className='text-[red]'>*</span></label>
              <select
                name="country"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                value={formData.country}
                onChange={handleChange}
              >
                <option value="">Select country</option>
                {countries.map((country: ICountry) => (
                  <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                ))}
              </select>
            </div>
            <div className='mb-2'>
              <label htmlFor="state" className='text-sm'>State <span className='text-[red]'>*</span></label>
              <select
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
              </select>
            </div>
            <div className='mb-2'>
              <label htmlFor="city" className='text-sm'>City <span className='text-[red]'>*</span></label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter your city"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              />
            </div>
            <div className='mb-2'>
              <label htmlFor="zipCode" className='text-sm'>Zip Code <span className='text-[red]'>*</span></label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="Enter zip code"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                required
              />
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
