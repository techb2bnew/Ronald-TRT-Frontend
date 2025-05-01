"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';

export default function ViewDetails() {
  const [technician, setTechnician] = useState<any>(null);  // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchTechnicianData = async (technicianId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/fetchSingleTechnician?technicianId=${technicianId}`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setTechnician(data.technician);  // Set the technician data
      } else {
        toast.error(data.error || 'Error fetching technician data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching technician data');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const techId = searchParams.get('technicianId') || '';

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
    <>
      <Breadcrumb
        items={[
          { label: 'IFS Technicians', href: '/technicians/listing' },
          { label: 'View Detail', href: '/jobs/job-group/listing' }
        ]}
      />

      <div className='mx-auto p-4 '>
        <div className='rounded-lg shadow bg-white mb-5'>
          <div className='flex gap-4 p-4'>
            {technician?.image ? (
              <img
                onClick={() => setPreviewImage(technician.image)}
                src={technician?.image}
                alt='Technician Tax Form'
                className="w-[100px] h-[100px] rounded shadow-lg cursor-pointer object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-[100px] h-[100px] text-black-400 bg-gray-300 p-2 rounded" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}


            <div>
              <h2 className='text-lg font-bold'>{technician?.firstName} {technician?.lastName}</h2>
              <p className='flex gap-2 items-center'>
                <svg width="20" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="view__detail">
                  <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="#5B5B99" strokeWidth="1.2" />
                  <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <a href={`mailto:${technician?.email}`}>
                  {technician?.email}
                </a></p>

              <p className='flex gap-2 items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" className="view__detail"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {technician?.address}</p>
              <p className='flex gap-2 items-center'>
                <svg width="20" height="16" viewBox="0 0 20 20" fill="none" className="view__detail" xmlns="http://www.w3.org/2000/svg">
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
                <a href={`tel:${technician?.phoneNumber}`}>
                  {technician?.phoneNumber}
                </a></p>
            </div>
          </div>
        </div>
        <div className="bg-blue rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2 pt-4 pl-6 border-b border-[#ccc] pb-3">Technician Details</h2>

          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Left Section */}
            <div className='shadow-lg p-5 bg-white rounded'>

              <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Country:</strong> {technician?.country}</p>
              <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>State:</strong> {technician?.state}</p>
              <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>City:</strong> {technician?.city}</p>
              <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Zip Code:</strong> {technician?.zipCode}</p>


              <p className='mb-2 border-b border-gray-500 mb-3 pb-2'>
                <strong className='w-[200px] inline-block'>Secondary Ph:</strong>
                {technician?.secondaryContactName ? (
                  technician.secondaryContactName
                ) : (
                  <span className="text-sm text-gray-500">No data available</span>
                )}
              </p>
              <p className='mb-2 border-b border-gray-500 mb-3 pb-2'>
                <strong className='w-[200px] inline-block'>Secondary Email:</strong>
                {technician?.secondaryEmail ? (
                  technician.secondaryEmail
                ) : (
                  <span className="text-sm text-gray-500">No data available</span>
                )}
              </p>


            </div>

            {/* Right Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              {technician.payRate && (
                <p className='mb-2 border-b border-gray-500 mb-3 pb-2'>
                  <strong className='w-[200px] inline-block'>Pay Rate:</strong>
                  {technician?.payRate ? (
                    technician.payRate
                  ) : (
                    <span className="text-sm text-gray-500">No data available</span>
                  )}
                </p>
              )}
              {technician.amountPercentage && (
                <p className='mb-2 border-b border-gray-500 mb-3 pb-2'>
                  <strong className='w-[200px] inline-block'>Amount Percentage:</strong>
                  {technician?.amountPercentage ? (
                    `$${technician.amountPercentage}`
                  ) : (
                    <span className="text-sm text-gray-500">No data available</span>
                  )}
                </p>
              )}
              {technician.simpleFlatRate && (
                <p className='mb-2 border-b border-gray-500 mb-3 pb-2'>
                  <strong className='w-[200px] inline-block'>Flat Rate:</strong>
                  {technician?.simpleFlatRate ? (
                    `$${technician.simpleFlatRate}`
                  ) : (
                    <span className="text-sm text-gray-500">No data available</span>
                  )}
                </p>

              )}

              <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Date:</strong> {new Date(technician.createdAt).toLocaleDateString('en-GB')} </p>
              <p className='mb-2 border-b border-gray-500 mb-3 pb-3'><strong className='w-[200px] inline-block'>Account Status:</strong><span
                className={`badge ${technician.accountStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
              >
                {technician.accountStatus ? 'Approved' : 'Unapproved'}
              </span></p>
              <p className='mb-2 border-b border-gray-500 mb-3 pb-3'><strong className='w-[200px] inline-block'>Status:</strong><span
                className={`badge ${technician.isApproved ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
              >
                {technician.isApproved ? 'Active' : 'Inactive'}
              </span></p>
              <div className='flex items-center'>
                <strong className='w-[200px] inline-block'>Tax Form</strong>

                {technician?.taxForms && technician.taxForms.length > 0 ? (
                  <div className="mt-1 block mb-2 flex gap-2 items-center">
                    {technician.taxForms.map((form: any, index: number) => {
                      const isPDF = form.endsWith('.pdf');

                      return (
                        <div key={index} className="relative flex items-center gap-2">
                          {isPDF ? (
                            <button
                              onClick={() => window.open(form, '_blank')}
                              className="flex items-center gap-2 bg-gray-200 px-2 py-1 rounded shadow cursor-pointer"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="orange" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 2H14L20 8V22H6V2Z" stroke="orange" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14 2V8H20" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span className="text-sm text-black-600">View PDF</span>
                            </button>
                          ) : (
                            <img
                            onClick={() => setPreviewImage(form)}
                              src={form}
                              alt={`Technician Tax Form ${index + 1}`}
                              className="w-[50px] h-[50px] rounded-full bg-orange-500 p-1 shadow-lg cursor-pointer"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No data available</span>
                )}
              </div>


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
