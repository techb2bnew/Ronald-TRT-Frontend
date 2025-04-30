"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';

export default function ViewDetails() {
  const [jobData, setJobsData] = useState<any>(null);  // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);

  const fetchCustomerData = async (vehicalId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/fetchSingleVehicalInfo?vehicalId=${vehicalId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setJobsData(data.vehicalInfo);  // Set the  CustomerData data
      } else {
        toast.error(data.error || 'Error fetching technician data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching technician data');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const vehicalId = searchParams.get('vehicalId') || '';

    if (vehicalId) {
      setIsEdit(true);  // Set to true if `fetchCustomerData` exists in the URL
      fetchCustomerData(vehicalId);
    } else {
      setIsEdit(false);
    }
  }, []);

  const calculateTotalCost = () => {
    if (jobData?.jobDescription && Array.isArray(jobData.jobDescription)) {
      return jobData.jobDescription.reduce((total: any, item: any) => {
        const jobItem = typeof item === 'string' ? JSON.parse(item) : item;
        return total + parseFloat(jobItem.cost || '0');
      }, 0);
    }
    return 0;
  };

React.useEffect(() => {
    const type = localStorage.getItem('types');
    setUserType(type);
  });

  if (!jobData) {
    return <div><Loading /></div>;
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Vehicles Info', href: '/reporting/vehicle-info' },
          { label: 'View Detail', href: '/jobs/job-group/listing' }
        ]}
      />
      <div className='max-w-7xl mx-auto p-4 rounded-lg shadow bg-white'>
        <div className="bg-blue rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2 pt-4 pl-6 border-b border-[#ccc] pb-3">Vehicle Detail</h2>
          <div className="grid grid-cols-2 gap-3 p-6">
            {/* Left Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Id:</strong> {jobData?.id}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Customer Name:</strong> {jobData?.customer?.firstName} {jobData?.customer?.lastName}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Customer Email:</strong> {jobData?.customer?.email}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Customer Ph. Number:</strong> {jobData?.customer?.phoneNumber}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>VIN:</strong> {jobData?.vin}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Model:</strong> {jobData?.model}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Vehicle Descriptor:</strong> {jobData?.vehicleDescriptor}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Manufacture Name:</strong> {jobData?.manufacturerName}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Job Status:</strong>
                <span
                  className={`badge ${jobData.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
                >
                  {jobData.jobStatus ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>

            {/* Right Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Technician Name:</strong> {jobData.technicians[0]?.firstName} {jobData.technicians[0]?.lastName}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Technician Email:</strong> {jobData.technicians[0]?.email}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Technician Ph. Number:</strong> {jobData.technicians[0]?.phoneNumber} </p>
              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex">
                <strong className="w-[200px] inline-block">Job Description:</strong>
                {jobData?.jobDescription && Array.isArray(jobData.jobDescription) ? (
                  <ul className="list-none">
                    {jobData.jobDescription.map((item: any, index: any) => {
                      const jobItem = typeof item === 'string' ? JSON.parse(item) : item;
                      return (
                        <li key={index}>
                          <span className="block">{jobItem.jobDescription}</span>
                          {/* Optional: Show individual costs */}
                          {/* <span className="block">${jobItem.cost}</span> */}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  "No job descriptions available"
                )}
              </div>

              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                <strong className='w-[200px] inline-block'>Total Cost:</strong> ${calculateTotalCost().toFixed(2)}
              </div>
              {userType === 'single-technician' && (
              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                <strong className='w-[200px] inline-block'>Labour Cost:</strong>${jobData?.labourCost}
              </div>
              )}


              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Make:</strong> {jobData?.make}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Model Year:</strong> {jobData?.modelYear}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Vehicle Type:</strong> {jobData?.vehicleType}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Color:</strong> {jobData?.color}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Notes:</strong>  {jobData?.notes} </p>
              <div className="mt-1 m-auto block mb-2 flex gap-2 items-center">
                {jobData.images.map((form: any, index: any) => (
                  <img
                    key={index}
                    onClick={() => window.open(form, '_blank')}
                    src={form}
                    alt={`Technician Tax Form ${index + 1}`}
                    className="w-[50px] h-[50px] rounded-full bg-orange-500 p-1 shadow-lg cursor-pointer mr-2"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
    </>
  );
}
