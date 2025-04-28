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

  const calculateTotalCost = () => {
    // Calculate subtotalcost from jobDescription
    let subtotalcost = 0;
    if (jobData?.jobDescription && Array.isArray(jobData.jobDescription)) {
      subtotalcost = jobData.jobDescription.reduce((total: number, item: { cost: string }) => {
        return total + parseFloat(item.cost || '0');
      }, 0);
    }

    const simpleFlatRate = parseFloat(jobData?.simpleFlatRate || '0');
    const amountPercentage = parseFloat(jobData?.amountPercentage || '0');

    // Calculate the percentage amount
    const percentageAmount = !isNaN(amountPercentage) && amountPercentage > 0
      ? (subtotalcost * amountPercentage) / 100
      : 0;

    // Calculate the totalCost by adding simpleFlatRate and percentageAmount if available
    const totalCost = (isNaN(simpleFlatRate) || simpleFlatRate <= 0 ? 0 : simpleFlatRate) + subtotalcost + percentageAmount;

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
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Customer Email:</strong> {jobData?.customer?.email}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Customer Ph. Number:</strong> {jobData?.customer?.phoneNumber}</div>
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
                {jobData.technicians?.map((t: any) => t.email).join(', ')}
              </div>

              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex">
                <strong className="w-[210px] min-w-[210px] inline-block">Technician Ph. Number:</strong>
                {jobData.technicians?.map((t: any) => t.phoneNumber || 'N/A').join(', ')}
              </div>


              {userType !== 'ifs' && (
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex capitalize">
                  <strong className="w-[210px] min-w-[210px] inline-block capitalize">R/I/R/R:</strong>

                  {(() => {
                    if (!jobData) return null;

                    // Check if jobDescription is already an array of objects
                    const totalCost = jobData.jobDescription.reduce((sum: number, item: any) => {
                      return sum + Number(item.cost || 0); // Directly access cost if jobDescription is an array of objects
                    }, 0);

                    const simpleFlatRate = Number(jobData.simpleFlatRate);
                    const amountPercentage = Number(jobData.amountPercentage);

                    // Neither is valid — show red dot with tooltip
                    if (
                      (isNaN(simpleFlatRate) || simpleFlatRate === 0) &&
                      (isNaN(amountPercentage) || amountPercentage === 0)
                    ) {
                      const tooltipId = `tooltip-${jobData.id}`;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span
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
                          <Tooltip id={tooltipId} place="top" />
                        </div>
                      );
                    }

                    // Show simpleFlatRate if valid
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


              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Make:</strong> {jobData?.make}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Model Year:</strong> {jobData?.modelYear}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Vehicle Type:</strong> {jobData?.vehicleType}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Color:</strong> {jobData?.color}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Notes:</strong> {jobData?.notes}</div>
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
          <div className="grid grid-cols-1 gap-3 p-6 pt-0 mb-4">

            <div className='shadow-lg p-5 bg-white rounded'>
              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex">
                <strong className="w-[210px] inline-block">Job Description:</strong>
                {jobData?.jobDescription && Array.isArray(jobData.jobDescription) ? (
                  <ul className="list-block">
                    {jobData.jobDescription.map((item: { jobDescription: string; cost: string }, index: number) => (
                      <li key={index} className='mb-2'>
                        <span className=" block">{item.jobDescription}</span>
                        {/* <span className='block'>${item.cost}</span>  */}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No job descriptions available"
                )}

              </div>
              <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                <strong className='w-[210px] inline-block'>Total Cost: </strong> ${calculateTotalCost().toFixed(2)}
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
}
