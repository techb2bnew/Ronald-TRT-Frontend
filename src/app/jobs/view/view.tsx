"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSearchParams, usePathname } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

export default function ViewDetails() {
  const [jobData, setJobsData] = useState<any>(null);  // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isSingleTechnician = searchParams.has('ActiveWorkOrder');

  const fetchCustomerData = async (jobId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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

  React.useEffect(() => {
    const type = localStorage.getItem('types');
    setUserType(type);
  });

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

  const calculateTotalCost = (jobData: any) => {
    let subtotalcost = 0;

    // Check if jobDescription exists and is an array
    if (jobData?.jobDescription && Array.isArray(jobData.jobDescription)) {
      subtotalcost = jobData.jobDescription.reduce((total: number, item: any) => {
        let parsedItem = item;

        // Only parse if item is a string
        if (typeof item === 'string') {
          try {
            parsedItem = JSON.parse(item); // Parse the stringified JSON
          } catch (error) {
            console.error("Error parsing job description:", error);
            return total; // Skip this item if parsing fails
          }
        }

        // Check if parsedItem has a cost property and is a number
        const cost = parseFloat(parsedItem?.cost || '0');
        return total + (isNaN(cost) ? 0 : cost);
      }, 0);
    }

    // Check if jobData has valid `simpleFlatRate` and `amountPercentage`
    const simpleFlatRate = parseFloat(jobData?.simpleFlatRate || '0');
    const amountPercentage = parseFloat(jobData?.amountPercentage || '0');

    // If jobData's `simpleFlatRate` or `amountPercentage` are null, fallback to technicians
    const finalSimpleFlatRate = isNaN(simpleFlatRate) || simpleFlatRate <= 0
      ? parseFloat(jobData?.technicians?.[0]?.simpleFlatRate || '0')
      : simpleFlatRate;

    const finalAmountPercentage = isNaN(amountPercentage) || amountPercentage <= 0
      ? parseFloat(jobData?.technicians?.[0]?.amountPercentage || '0')
      : amountPercentage;

    // Calculate the percentage amount
    const percentageAmount = !isNaN(finalAmountPercentage) && finalAmountPercentage > 0
      ? (subtotalcost * finalAmountPercentage) / 100
      : 0;

    // Calculate the totalCost by adding final simpleFlatRate and percentageAmount if available
    const totalCost = finalSimpleFlatRate + subtotalcost + percentageAmount;

    return totalCost;
  };


  if (!jobData) {
    return <div><Loading /></div>;
  }
  const getBaseBreadcrumb = () => {
    const isCompletedJob = searchParams.has('completedJob');
    const isActiveJob = searchParams.has('activeJob');
    const isJobStatus = searchParams.has('jobStatus');

    if (isCompletedJob) {
      return { label: 'Completed Work Orders', href: '/jobs/complete-job/listing' };
    }

    if (isActiveJob) {
      return { label: 'Active Work Orders', href: '/jobs/active-job' };
    }

    if (isJobStatus) {
      const jobStatus = searchParams.get('jobStatus');
      return {
        label: `${jobStatus?.charAt(0).toUpperCase()}${jobStatus?.slice(1)} All IFS Work Orders`,
        href: `/reporting/job-status`,
      };
    }

    if (pathname.includes('/reporting/job-status')) {
      return { label: 'All IFS Work Orders', href: '/reporting/job-status' };
    }

    return {
      label: isSingleTechnician ? 'Active Work Order' : 'Single Technician Work Order',
      href: isSingleTechnician
        ? '/jobs/active-job'
        : '/single-technicians/jobs',
    };
  };


  return (
    <div>
      <Breadcrumb
        items={[
          getBaseBreadcrumb(),
          isEdit
            ? { label: 'View Details' }
            : { label: 'Create Technician', href: '/technicians/create-technician' },
        ]}
      />

      <div className='max-w-7xl mx-auto p-4 rounded-lg shadow bg-white'>

        <div className="bg-blue rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2 pt-4 pl-6 border-b border-[#ccc] pb-3">Work Order Detail</h2>
          <div className="grid grid-cols-2 gap-3 p-6">
            {/* Left Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Job Id:</strong> {jobData?.id}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Customer Name:</strong> {jobData?.customer?.firstName} {jobData?.customer?.lastName}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Customer Email:</strong>
              <a className="hover:underline" href={`mailto:${jobData?.customer?.email}`}>
               {jobData?.customer?.email}
               </a>
               </div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Customer Ph. Number:</strong>
              <a className="hover:underline" href={`tel:${jobData?.customer?.phoneNumber}`}>
               {jobData?.customer?.phoneNumber}
               </a>
                </div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>VIN:</strong> {jobData?.vin}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Model:</strong> {jobData?.model}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Vehicle Descriptor:</strong> {jobData?.vehicleDescriptor}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Manufacture Name:</strong> {jobData?.manufacturerName}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Date:</strong> {new Date(jobData.updatedAt).toLocaleDateString('en-GB')} </div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Job Status:</strong>
                <span
                  className={`badge ${jobData.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
                >
                  {jobData.jobStatus ? 'Completed' : 'Inprogress'}
                </span>
              </div>

            </div>

            {/* Right Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex">
                <strong className="w-[210px] min-w-[210px] inline-block">Technician Name:</strong>
                {jobData.technicians?.map((t: any) => `${t.firstName} ${t.lastName}`).join(', ')}
              </div>

              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex">
                <strong className="w-[210px] min-w-[210px] inline-block">Technician Email:</strong>
                <a className="hover:underline" href={`mailto:${jobData.technicians?.map((t: any) => t.email)}`}>
                {jobData.technicians?.map((t: any) => t.email).join(', ')}
                </a>
              </div>

              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex">
                <strong className="w-[210px] min-w-[210px] inline-block">Technician Ph. Number:</strong>
                <a className="hover:underline" href={`tel:${jobData.technicians?.map((t: any) => t.phoneNumber)}`}>
                {jobData.technicians?.map((t: any) => t.phoneNumber || 'N/A').join(', ')}
                </a>
              </div>


              {  userType !== 'single-technician' && (
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex capitalize">
                  <strong className="w-[210px] min-w-[210px] inline-block capitalize">R/I/R/R:</strong>

                  {(() => {
                    if (!jobData) return null;

                    // Parse jobDescription items and calculate total cost
                    let totalCost = 0;

                    if (jobData?.jobDescription && Array.isArray(jobData.jobDescription)) {
                      totalCost = jobData.jobDescription.reduce((sum: number, item: any) => {
                        return sum + Number(item?.cost || 0); // Accumulate the cost
                      }, 0);
                    }

                    const simpleFlatRate = Number(jobData.simpleFlatRate);
                    const amountPercentage = Number(jobData.amountPercentage);

                    // If both are invalid in the first job data, fallback to technician data
                    const fallbackSimpleFlatRate = Number(jobData?.technicians?.[0]?.simpleFlatRate || 0);
                    const fallbackAmountPercentage = Number(jobData?.technicians?.[0]?.amountPercentage || 0);

                    // Check if both simpleFlatRate and amountPercentage are invalid
                    if (
                      (isNaN(simpleFlatRate) || simpleFlatRate === 0) &&
                      (isNaN(amountPercentage) || amountPercentage === 0)
                    ) {
                      // Fallback to technician data if primary values are invalid
                      if (!isNaN(fallbackSimpleFlatRate) && fallbackSimpleFlatRate > 0) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            ${fallbackSimpleFlatRate.toFixed(2)}
                          </div>
                        );
                      }

                      // If technician simpleFlatRate is also invalid, fallback to percentage-based calculation
                      if (!isNaN(fallbackAmountPercentage) && fallbackAmountPercentage > 0) {
                        const fallbackPercentageAmount = (totalCost * fallbackAmountPercentage) / 100;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            ${fallbackPercentageAmount.toFixed(2)} ({fallbackAmountPercentage}%)
                          </div>
                        );
                      }

                      // Show red dot with tooltip if both fallback values are invalid
                      const tooltipId = `tooltip-${jobData.id}`;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'red' }}>
                          {/* <span
                            data-tooltip-id={tooltipId}
                            data-tooltip-content="R/I/R/R price is not added for this job."
                            style={{
                              height: '12px',
                              width: '12px',
                              backgroundColor: 'red',
                              borderRadius: '50%',
                              display: 'inline-block',
                              cursor: 'pointer',
                            }}
                          ></span>
                          <Tooltip id={tooltipId} place="top" /> */}
                          Per Job
                        </div>
                      );
                    }

                    // If jobData has valid `simpleFlatRate` or `amountPercentage`, show them
                    if (!isNaN(simpleFlatRate) && simpleFlatRate > 0) {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          ${simpleFlatRate.toFixed(2)}
                        </div>
                      );
                    }

                    // Show percentage-based calculation
                    if (!isNaN(amountPercentage) && amountPercentage > 0) {
                      const percentageAmount = (totalCost * amountPercentage) / 100;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          ${percentageAmount.toFixed(2)} ({amountPercentage}%)
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              )}

                {userType === 'single-technician' && (
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Labour Cost:</strong> ${jobData?.labourCost}</div>

                )}
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Make:</strong> {jobData?.make}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Model Year:</strong> {jobData?.modelYear}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Vehicle Type:</strong> {jobData?.vehicleType}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Color:</strong> {jobData?.color}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Notes:</strong> {jobData?.notes}</div>
              <div className="mt-1 m-auto block mb-2 flex gap-2 items-center">
                {jobData.images.map((form: any, index: any) => (
                  <img
                    key={index}
                    onClick={() => setPreviewImage(form)}
                    src={form}
                    alt={`Technician Tax Form ${index + 1}`}
                    className="w-[50px] h-[50px] rounded-full bg-orange-500 p-1 shadow-lg cursor-pointer mr-2"
                  />
                ))}
              </div>
            </div>

          </div>
          <div className="grid grid-cols-1 gap-3 p-6 pt-0 mb-4">

            <div className='shadow-lg p-5 bg-white rounded'>
              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex">
                <strong className="w-[210px] inline-block">Job Description:</strong>
                {jobData?.jobDescription && Array.isArray(jobData.jobDescription) ? (
                  <ul className="list-none">
                    {jobData.jobDescription.map((item: string | object, index: number) => {
                      let parsedItem;

                      // Check if the item is a stringified JSON and try to parse it
                      try {
                        parsedItem = typeof item === 'string' ? JSON.parse(item) : item;
                      } catch (error) {
                        console.error("Error parsing job description:", error);
                        parsedItem = {}; // Fallback in case of an error
                      }

                      return (
                        <li key={index}>
                          <span className="block">
                            {parsedItem?.jobDescription || "No description available"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  'No job descriptions available'
                )}
              </div>
              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                <strong className='w-[210px] inline-block'>Total Cost: </strong>  ${calculateTotalCost(jobData).toFixed(2)}
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
    </div>
  );
}
