"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';

export default function ViewDetails() {
  const [jobData, setJobsData] = useState<any>(null);  // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const fetchCustomerData = async (jobId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }

      const response = await fetch(`${apiUrl}/fetchSingleJobs?jobid=${jobId}`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setJobsData(data.jobs);  // Set the  CustomerData data
      } else {
        toast.error(data.error || 'Error fetching technician data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching technician data');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const jobId = searchParams.get('jobId') || '';

    if (jobId) {
      setIsEdit(true);  // Set to true if `fetchCustomerData` exists in the URL
      fetchCustomerData(jobId);
    } else {
      setIsEdit(false);
    }
  }, []);

  if (!jobData) {
    return <div><Loading /></div>;
  }

  return (
    <div className='max-w-7xl mx-auto p-4 rounded-lg shadow bg-white'>
      <div className="bg-[#F6F6F6] rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2 pt-4 pl-6 border-b border-[#ccc] pb-3">Job Detail</h2>
        <div className="grid grid-cols-2 gap-3 p-6">
          {/* Left Section */}
          <div className='shadow-lg p-5 bg-white rounded'>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Job Id:</strong> {jobData?.id}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Customer Name:</strong> {jobData?.customer?.firstName} {jobData?.customer?.lastName}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Customer Email:</strong> {jobData?.customer?.email}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Customer Ph. Number:</strong> {jobData?.customer?.phoneNumber}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>VIN:</strong> {jobData?.vin}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Model:</strong> {jobData?.model}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Vehicle Description:</strong> {jobData?.vehicleDescription}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Manufacture Name:</strong> {jobData?.manufactureName}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>jobStatus:</strong>
              <span
                className={`badge ${jobData.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
              >
                {jobData.jobStatus ? 'Active' : 'Inactive'}
              </span>
            </p>

          </div>

          {/* Right Section */}
          <div className='shadow-lg p-5 bg-white rounded'>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Technician Name:</strong> {jobData?.technician?.firstName} {jobData?.technician?.lastName}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Technician Email:</strong> {jobData?.technician?.email}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Technician Ph. Number:</strong> {jobData?.technician?.phoneNumber}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Job Description:</strong> {jobData?.jobDescription}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Make:</strong> {jobData?.make}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Model Year:</strong> {jobData?.modelYear}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Vehicle Type:</strong> {jobData?.vehicleType}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Color:</strong> {jobData?.color}</p>
            <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Date:</strong> {new Date(jobData.updatedAt).toLocaleDateString('en-GB')} </p>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
