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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

      const response = await fetch(`/api/reportingView?customerId=${customerId}`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setJobsData(data.customers.customer);  // Set the  CustomerData data
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

    if (customerId) {
      setIsEdit(true);  // Set to true if `fetchCustomerData` exists in the URL
      fetchCustomerData(customerId);
    } else {
      setIsEdit(false);
    }
  }, []);

  //  const calculateTotalCost = (jobData: any) => {
  //   let subtotalcost = 0;

  //   // Check if jobDescription exists and is an array
  //   if (jobData?.jobDescription && Array.isArray(jobData.jobDescription)) {
  //     subtotalcost = jobData.jobDescription.reduce((total: number, item: any) => {
  //       let parsedItem = item;

  //       // Only parse if item is a string
  //       if (typeof item === 'string') {
  //         try {
  //           parsedItem = JSON.parse(item); // Parse the stringified JSON
  //         } catch (error) {
  //           console.error("Error parsing job description:", error);
  //           return total; // Skip this item if parsing fails
  //         }
  //       }

  //       // Check if parsedItem has a cost property and is a number
  //       const cost = parseFloat(parsedItem?.cost || '0');
  //       return total + (isNaN(cost) ? 0 : cost);
  //     }, 0);
  //   }

  //   // Check if jobData has valid `simpleFlatRate` and `amountPercentage`
  //   const simpleFlatRate = parseFloat(jobData?.simpleFlatRate || '0');
  //   const amountPercentage = parseFloat(jobData?.amountPercentage || '0');

  //   // If jobData's `simpleFlatRate` or `amountPercentage` are null, fallback to technicians
  //   const finalSimpleFlatRate = isNaN(simpleFlatRate) || simpleFlatRate <= 0
  //     ? parseFloat(jobData?.technicians?.[0]?.simpleFlatRate || '0')
  //     : simpleFlatRate;

  //   const finalAmountPercentage = isNaN(amountPercentage) || amountPercentage <= 0
  //     ? parseFloat(jobData?.technicians?.[0]?.amountPercentage || '0')
  //     : amountPercentage;

  //   // Calculate the percentage amount
  //   const percentageAmount = !isNaN(finalAmountPercentage) && finalAmountPercentage > 0
  //     ? (subtotalcost * finalAmountPercentage) / 100
  //     : 0;

  //   // Calculate the totalCost by adding final simpleFlatRate and percentageAmount if available
  //   const totalCost = finalSimpleFlatRate + subtotalcost + percentageAmount;

  //   return totalCost;
  // };

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
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Id:</strong> {jobData?.id}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 capitalize'><strong className='w-[210px] inline-block'>Customer Name:</strong> {jobData?.firstName} {jobData?.lastName}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Customer Email:</strong>
                <a className="hover:underline" href={`mailto:${jobData?.email}`}>
                  {jobData?.email}
                </a></p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Customer Ph. Number:</strong>
                <a className="hover:underline" href={`tel:${jobData?.phoneNumber}`}>
                  {jobData?.phoneNumber}
                </a>
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Country:</strong> {jobData?.country}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>State:</strong> {jobData?.state}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>City:</strong> {jobData?.city}</p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Zip Code:</strong> {jobData?.zipCode}</p>


            </div>

            {/* Right Section */}
            <div className='shadow-lg p-5 bg-white rounded'>

              {jobData?.vehicles?.[0] && (
                <>
                  <div className='mb-4 border-b border-gray-500 text-sm pb-4'>
                    <strong className='w-[210px] inline-block'>VIN:</strong>
                    {jobData.vehicles[0].vin?.trim()
                      ? jobData.vehicles[0].vin
                      : <span className="text-gray-500">No data available</span>}
                  </div>
                  <div className='mb-4 border-b border-gray-500 text-sm pb-4'>
                    <strong className='w-[210px] inline-block'>Make:</strong>
                    {jobData.vehicles[0].make?.trim()
                      ? jobData.vehicles[0].make
                      : <span className="text-gray-500">No data available</span>}
                  </div>
                  <div className='mb-4 border-b border-gray-500 text-sm pb-4'>
                    <strong className='w-[210px] inline-block'>Model:</strong>
                    {jobData.vehicles[0].model?.trim()
                      ? jobData.vehicles[0].model
                      : <span className="text-gray-500">No data available</span>}
                  </div>

                  <div className='mb-4 border-b border-gray-500 text-sm pb-4'>
                    <strong className='w-[210px] inline-block'>Vehicle Descriptor:</strong>
                    {jobData.vehicles[0].vehicleDescriptor?.trim()
                      ? jobData.vehicles[0].vehicleDescriptor
                      : <span className="text-gray-500">No data available</span>}
                  </div>

                  <div className='mb-4 border-b border-gray-500 text-sm pb-4'>
                    <strong className='w-[210px] inline-block'>Manufacture Name:</strong>
                    {jobData.vehicles[0].manufacturerName?.trim()
                      ? jobData.vehicles[0].manufacturerName
                      : <span className="text-gray-500">No data available</span>}
                  </div>



                  <div className='mb-4 border-b border-gray-500 text-sm pb-4'>
                    <strong className='w-[210px] inline-block'>Model Year:</strong>
                    {jobData.vehicles[0].modelYear?.toString().trim()
                      ? jobData.vehicles[0].modelYear
                      : <span className="text-gray-500">No data available</span>}
                  </div>

                  <div className='mb-4 border-b border-gray-500 text-sm pb-4'>
                    <strong className='w-[210px] inline-block'>Vehicle Type:</strong>
                    {jobData.vehicles[0].vehicleType?.trim()
                      ? jobData.vehicles[0].vehicleType
                      : <span className="text-gray-500">No data available</span>}
                  </div>
                </>
              )}


              {/* <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Color:</strong>
                {jobData?.color?.trim() ? jobData.color : <span className="text-gray-500">No data available</span>}
              </div>

              <p className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                <strong className="w-[210px] inline-block">Notes:</strong>
                {jobData?.notes?.trim() ? jobData.notes : <span className="text-gray-500">No notes available</span>}
              </p>
              <div className="mt-1 m-auto block mb-2 flex gap-2 items-center">
                {jobData?.images && Array.isArray(jobData.images) && jobData.images.length > 0 ? (
                  jobData.images.map((form: any, index: any) => (
                    <img
                      key={index}
                      onClick={() => setPreviewImage(form)}
                      src={form}
                      alt={`Technician Tax Form ${index + 1}`}
                      className="w-[50px] h-[50px] rounded-full bg-orange-500 p-1 shadow-lg cursor-pointer mr-2"
                    />
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No data available</span>
                )}
              </div> */}

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
