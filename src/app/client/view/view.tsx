"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Breadcrumb from '@/app/component/breadcrumb';
import { Country, State } from 'country-state-city';

export default function ViewDetails() {
  const [CustomerData, setCustomerData] = useState<any>(null);  // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isSingleTechnician = searchParams.has('allTrtCustomer');
  const fetchCustomerData = async (customerId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/fetchSingleCustomer?customerId=${customerId}`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setCustomerData(data.customers.customer);  // Set the  CustomerData data
      } else {
        toast.error(data.error || 'Error fetching technician data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching technician data');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const techId = searchParams.get('customerId') || '';

    if (techId) {
      setIsEdit(true);  // Set to true if `fetchCustomerData` exists in the URL
      fetchCustomerData(techId);
    } else {
      setIsEdit(false);
    }
  }, []);

  const getCountryName = (isoCode: string) => {
    if (!isoCode) return 'No country selected';
    const country = Country.getCountryByCode(isoCode);
    return country?.name || isoCode; // Fallback to ISO code if country not found
  };
  const getStateName = (countryCode: string, stateCode: string) => {
    if (!countryCode || !stateCode) return 'No state selected';
    const state = State.getStateByCodeAndCountry(stateCode, countryCode);
    return state?.name || stateCode; // Fallback to code if name not found
  };

  if (!CustomerData) {
    return <div><Loading /></div>;
  }

  return (
    <>

      <Breadcrumb
        items={[
          {
            label: isSingleTechnician ? 'All TRT Customer' : 'Customer',
            href: isSingleTechnician
              ? '/all-customer/listing'
              : '/client/listing',
          },
          { label: 'View Detail', href: '' }
        ]}
      />
      <div className='mx-auto p-4 rounded-lg shadow bg-white'>
        <div className="bg-blue rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 pt-4 pl-6 border-b border-[#ccc] mb-2 pb-3">Customer Detail</h2>
          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Left Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
             
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Customer Id:</strong> {CustomerData?.id}</p>
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Customer Name:</strong> {CustomerData?.firstName} {CustomerData?.lastName}</p>
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Email:</strong> 
              <a className="hover:underline" href={`mailto:${CustomerData?.email}`}>
              {CustomerData?.email}
              </a></p>
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Ph. Number:</strong>
              <a className="hover:underline" href={`tel:${CustomerData?.phoneNumber}`}>
               {CustomerData?.phoneNumber}
               </a>
               </p>
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Address:</strong> {CustomerData?.address}</p>
              <div className="flex">
                {CustomerData?.image ? (
                  <img
                    onClick={() => setPreviewImage(CustomerData.image)}
                    src={CustomerData?.image}
                    alt='Technician Tax Form'
                    className="w-[60px] h-[60px] rounded shadow-lg cursor-pointer object-cover"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-[100px] h-[100px] text-black-400 bg-gray-300 p-2 rounded" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
            </div>

            {/* Right Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Role Type:</strong> {CustomerData?.roleType}</p>
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'>
                <strong className='w-[200px] inline-block'>Country:</strong>
                {getCountryName(CustomerData?.country)}
              </p>
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'>
                <strong className='w-[200px] inline-block'>State:</strong>
                {getStateName(CustomerData?.country, CustomerData?.state)}
              </p>  
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>City:</strong> {CustomerData?.city}</p>
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Zip Code:</strong> {CustomerData?.zipCode}</p>
            </div>
          </div>
        </div>
        <ToastContainer />
        {previewImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setPreviewImage(null)} // Close on backdrop click
          >
            <img src={previewImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded shadow-lg" />
          </div>
        )}
      </div>
    </>
  );
}
