"use client"; 
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader'; 

export default function ViewDetails() { 
  const [technician, setTechnician] = useState<any>(null);  // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const fetchTechnicianData = async (adminId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/fetchIfsSingleAdmin?adminId=${adminId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (response.ok) {  
        setTechnician(data.admins);  // Set the technician data
      } else {
        toast.error(data.error || 'Error fetching technician data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching technician data');
    }
  };
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const techId = searchParams.get('adminId') || '';

    if (techId) {
      setIsEdit(true);  // Set to true if `technicianId` exists in the URL
      fetchTechnicianData(techId);
    } else {
      setIsEdit(false);
    }
  }, []);

  if (!technician) {
    return <div><Loading /></div>;
  }

  return (
    <div className='max-w-6xl mx-auto p-4 rounded-lg shadow bg-white'>
      <div className="bg-blue rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2 pt-4 pl-6 border-b border-[#ccc] pb-3">IFS Admin Details</h2>
   
        <div className="grid grid-cols-2 gap-6 p-6">
          {/* Left Section */}
          <div className='shadow-lg p-5 bg-white rounded'>
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Technician Id:</strong> {technician?.id}</p>
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Dent Tech Name:</strong> {technician?.firstName} {technician?.lastName}</p>
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Email:</strong> {technician?.email}</p>
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Secondary Name:</strong> {technician?.secondaryContactName}</p>
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Secondary Email:</strong> {technician?.secondaryEmail}</p>
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Ph. Number:</strong> {technician?.phoneNumber}</p>
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Address:</strong> {technician?.address}</p> 
            <p><strong className='w-[200px] inline-block'>Status:</strong><span
          className={`badge ${technician.isApproved ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
        >
          {technician.isApproved ? 'Active' : 'Inactive'}
        </span></p>
          </div>

          {/* Right Section */}
          <div className='shadow-lg p-5 bg-white rounded'> 
            {/* <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Pay Rate:</strong> {technician?.payRate}</p>
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Amount Percentage:</strong> {technician?.amountPercentage}</p> */}
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Country:</strong> {technician?.country}</p>
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>State:</strong> {technician?.state}</p>
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>City:</strong> {technician?.city}</p> 
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Zip Code:</strong> {technician?.zipCode}</p>
            <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Date:</strong> {new Date(technician.updatedAt).toLocaleDateString('en-GB')} </p>
          {technician?.taxForms && technician.taxForms.length > 0 && (
          <div className="mt-1 m-auto block mb-2 flex gap-2 items-center">
            {technician.taxForms.map((form:any, index:any) => (
              <img
                key={index}
                onClick={() => window.open(form, '_blank')}
                src={form}
                alt={`Technician Tax Form ${index + 1}`}
                className="w-[50px] h-[50px] rounded-full bg-orange-500 p-1 shadow-lg cursor-pointer mr-2"
              />
            ))}
          </div>
        )}

          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
