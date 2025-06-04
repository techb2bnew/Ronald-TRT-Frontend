"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';

export default function ViewDetails() {
  const [technician, setTechnician] = useState<any>(null);  // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [recordType, setRecordType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fetchTechnicianData = async (id: string, type: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Dynamically construct the request body based on the type
      let payload: Record<string, any> = {};

      switch (type) {
        case "User":
          payload.technicianId = id;
          break;
        case "Customer":
          payload.customerId = id;
          break;
        case "Job":
          payload.jobId = id;
          break;
        default:
          console.error("Invalid type");
          return;
      }

      const response = await fetch(`/api/singleRecoverRecord`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload), // Send the dynamic payload
      });

      const data = await response.json();

      if (response.ok) {
        setTechnician(data.records);  // Set the technician data (or other data based on the type)
      } else {
        toast.error(data.error || 'Error fetching data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching data');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const techId = searchParams.get('technicianId');
    const jobId = searchParams.get('jobId');
    const customerId = searchParams.get('customerId');

    if (techId) {
      setIsEdit(true);
      setRecordType("User");
      fetchTechnicianData(techId, "User");
    } else if (jobId) {
      setRecordType("Job");
      fetchTechnicianData(jobId, "Job");
    } else if (customerId) {
      setRecordType("Customer");
      fetchTechnicianData(customerId, "Customer");
    } else {
      setIsEdit(false);
    }
  }, []);


  if (!technician) {
    return <div><Loading /></div>;
  }

  return (
    <div className='max-w-6xl mx-auto p-4 rounded-lg shadow bg-white'>
      <Breadcrumb
        items={[
          { label: 'Archive', href: '/archive/listing' },
          { label: 'Archive Detail', href: '/archive/listing' }
        ]}
      />
      <div className="bg-blue rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2 pt-4 pl-6 border-b border-[#ccc] pb-3">
          {recordType === "Customer"
            ? "Customer Details"
            : recordType === "Job"
              ? "Job Details"
              : "Technician Details"}
        </h2>
        {recordType !== "Job" && (
          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Left Section */}

            <div className='shadow-lg p-5 bg-white rounded'>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Technician Id:</strong> {technician?.id}</div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2 flex items-center'><strong className='w-[200px] inline-block'>Technician Name:</strong> {technician?.image ? (
                <img
                  onClick={() => setPreviewImage(technician.image)}
                  src={technician.image}
                  alt={`${technician.firstName} ${technician.lastName}`}
                  className="w-8 h-8 rounded-full object-cover mr-3"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#383d71] text-white flex items-center justify-center text-lg font-bold uppercase mr-2">
                  {technician?.firstName?.[0] || '?'}
                </div>
              )}

                {technician?.firstName} {technician?.lastName}</div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Email:</strong> <a href={`mailto:${technician.email}`} className="hover:underline"> {technician?.email}</a></div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Ph. Number:</strong><a href={`tel:${technician.phoneNumber}`} className="hover:underline"> {technician?.phoneNumber}</a></div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Secondary Number:</strong><a href={`tel:${technician.secondaryContactName}`} className="hover:underline"> {technician?.secondaryContactName}</a></div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Secondary Email:</strong><a href={`mailto:${technician.secondaryEmail}`} className="hover:underline">  {technician?.secondaryEmail}</a></div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Address:</strong> {technician?.address}</div>
              <div><strong className='w-[200px] inline-block'>Status:</strong><span
                className={`badge ${technician.isApproved ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
              >
                {technician.isApproved ? 'Active' : 'Inactive'}
              </span></div>
            </div>

            {/* Right Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Pay Rate:</strong> {technician?.payRate}</div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Amount Percentage:</strong> {technician?.amountPercentage}</div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Country:</strong> {technician?.country}</div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>State:</strong> {technician?.state}</div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>City:</strong> {technician?.city}</div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Zip Code:</strong> {technician?.zipCode}</div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Date:</strong> {new Date(technician.updatedAt).toLocaleDateString('en-GB')} </div>
              {technician?.taxForms && technician.taxForms.length > 0 && (
                <div className="mt-1 m-auto block mb-2 flex gap-2 items-center">
                  {technician.taxForms.map((form: any, index: number) => {
                    // Check if it's a PDF
                    const isPDF = form.endsWith('.pdf'); // Assuming URL or filename ends with ".pdf"

                    return (
                      <div key={index} className="relative flex items-center gap-2">
                        {isPDF ? (
                          // PDF Display with Icon
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
                          // Image Display
                          <img
                            onClick={() => window.open(form, '_blank')}
                            src={form}
                            alt={`Technician Tax Form ${index + 1}`}
                            className="w-[50px] h-[50px] rounded-full bg-orange-500 p-1 shadow-lg cursor-pointer"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}


            </div>
          </div>
        )}
        {recordType == "Job" && (
          <div className="grid grid-cols-2 gap-3 p-6">
            {/* Left Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Job Id:</strong> {technician?.id}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>VIN:</strong> {technician?.vin}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Model:</strong> {technician?.model}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Vehicle Descriptor:</strong> {technician?.vehicleDescriptor}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Manufacture Name:</strong> {technician?.manufacturerName}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Job Status:</strong>
                <span
                  className={`badge ${technician.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
                >
                  {technician.jobStatus ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Right Section */}
            <div className='shadow-lg p-5 bg-white rounded'>

              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex">
                <strong className="w-[200px] inline-block">Job Description:</strong>
                {technician?.jobDescription && Array.isArray(technician.jobDescription) ? (
                  <ul className="list-none pl-5">
                    {technician.jobDescription.map((item: string, index: number) => {
                      try {
                        const parsedItem = JSON.parse(item); // Parse each string item to an object
                        return (
                          <li key={index}>
                            <span className="font-semibold block">{parsedItem.jobDescription}</span>
                            <span className="block">${parsedItem.cost}</span>
                          </li>
                        );
                      } catch (error) {
                        console.error("Error parsing jobDescription:", error);
                        return null;
                      }
                    })}
                  </ul>
                ) : (
                  "No job descriptions available"
                )}
              </div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Make:</strong> {technician?.make}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Model Year:</strong> {technician?.modelYear}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Vehicle Type:</strong> {technician?.vehicleType}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Color:</strong> {technician?.color}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[200px] inline-block'>Date:</strong> {new Date(technician.updatedAt).toLocaleDateString('en-GB')} </div>
              <div className="mt-1 m-auto block mb-2 flex gap-2 items-center">
                {technician.images.map((form: any, index: any) => (
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
        )}
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
  );
}
