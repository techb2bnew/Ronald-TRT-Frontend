"use client"; 
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader'; 

export default function ViewDetails() { 
  const [CustomerData, setCustomerData] = useState<any>(null);  // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false); 

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

  if (!CustomerData) {
    return <div><Loading /></div>;
  }

  return (
    <div className='max-w-5xl mx-auto p-4 rounded-lg shadow bg-white'>
      <div className="bg-[#F6F6F6] rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 pt-4 pl-6 border-b border-[#ccc] mb-2 pb-3">Customer Detail</h2>
        <div className="grid grid-cols-2 gap-6 p-6">
          {/* Left Section */}
          <div className='shadow-lg p-5 bg-white rounded'>
             <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Customer Id:</strong> {CustomerData?.id}</p>
             <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Customer Name:</strong> {CustomerData?.firstName} {CustomerData?.lastName}</p>
             <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Email:</strong> {CustomerData?.email}</p> 
             <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Ph. Number:</strong> {CustomerData?.phoneNumber}</p>
             <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Address:</strong> {CustomerData?.address}</p> 
         
          </div>

          {/* Right Section */}
          <div className='shadow-lg p-5 bg-white rounded'> 
             <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Role Type:</strong> {CustomerData?.roleType}</p>
             <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Country:</strong> {CustomerData?.country}</p>
             <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>State:</strong> {CustomerData?.state}</p>
             <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>City:</strong> {CustomerData?.city}</p>
             <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Zip Code:</strong> {CustomerData?.zipCode}</p> 
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
