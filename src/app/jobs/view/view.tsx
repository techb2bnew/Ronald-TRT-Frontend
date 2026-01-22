"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSearchParams, usePathname } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { Link } from '@mui/material';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg'
import Empty from '@/app/component/empty';

export default function ViewDetails() {
  const [jobData, setJobsData] = useState<any>(null);  // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isSingleTechnician = searchParams!.has('ActiveWorkOrder');
  const isSingleTechnicianWorkOrder = searchParams!.has('workorder');

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

      const response = await fetch(`/api/fetchSingleJobs?jobid=${jobId}`, {
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

    // Extract simpleFlatRate and amountPercentage from jobData or fallback technician
    const simpleFlatRate = parseFloat(jobData?.simpleFlatRate || '0');
    const amountPercentage = parseFloat(jobData?.amountPercentage || '0');

    const finalSimpleFlatRate = isNaN(simpleFlatRate) || simpleFlatRate <= 0
      ? parseFloat(jobData?.technicians?.[0]?.simpleFlatRate || '0')
      : simpleFlatRate;

    const finalAmountPercentage = isNaN(amountPercentage) || amountPercentage <= 0
      ? parseFloat(jobData?.technicians?.[0]?.amountPercentage || '0')
      : amountPercentage;

    // Calculate percentage amount if applicable
    const percentageAmount = (!isNaN(finalAmountPercentage) && finalAmountPercentage > 0)
      ? (subtotalcost * finalAmountPercentage) / 100
      : 0;

    // Logic: Add either simpleFlatRate or percentageAmount — whichever is greater than zero, but NOT both
    let totalCost = subtotalcost;

    if (finalSimpleFlatRate > 0) {
      totalCost += finalSimpleFlatRate;
    } else if (percentageAmount > 0) {
      totalCost += percentageAmount;
    }

    return totalCost;
  };



  if (!jobData) {
    return <div><Loading /></div>;
  }
  const getBaseBreadcrumb = () => {
    const isCompletedJob = searchParams!.has('completedJob');
    const isActiveJob = searchParams!.has('activeJob');
    const isJobStatus = searchParams!.has('jobStatus');

    if (isCompletedJob) {
      return { label: 'Completed Work Orders', href: '/jobs/complete-job/listing' };
    }

    if (isActiveJob) {
      return { label: 'Job Detail', href: '/jobs/active-job' };
    }

    if (isJobStatus) {
      const jobStatus = searchParams!.get('jobStatus');
      return {
        label: `${jobStatus?.charAt(0).toUpperCase()}${jobStatus?.slice(1)} All IFS Work Orders`,
        href: `/reporting/job-status`,
      };
    }

    if (pathname!.includes('/reporting/job-status')) {
      return { label: 'All Work Orders', href: '/reporting/job-status' };
    }

    return {
      label: isSingleTechnician ? 'Job Detail' : 'Single Technician Work Order',
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
          <h2 className="text-xl font-bold mb-2 pt-4 pl-6 border-b border-[#ccc] pb-3">Job Detail</h2>
          <div className="view_inner_content grid grid-cols-2 gap-3 p-6">
            {/* Left Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Job Id:</strong> {jobData?.id}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Job Title:</strong> {jobData?.jobName}</div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex items-center'><strong className='w-[210px] inline-block'>Customer Name:</strong>
                <div className="flex gap-3 items-center capitalize">

                  {jobData?.customer?.fullName}
                </div>
              </div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Customer Email:</strong>
                <a className="hover:underline" href={`mailto:${jobData?.customer?.email}`}>
                  {jobData?.customer?.email || 'N/A'}
                </a>
              </div>
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Customer Ph. Number:</strong>
                <a className="hover:underline" href={`tel:${jobData?.customer?.phoneNumber}`}>
                  {jobData?.customer?.phoneNumber || 'N/A'}
                </a>
              </div>

              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Start Date:</strong> {jobData.startDate ? new Date(jobData.startDate).toLocaleDateString() : ''} </div>

              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>End Date:</strong> {jobData.endDate ? new Date(jobData.endDate).toLocaleDateString() : ''}
              </div>
            </div>

            {/* Right Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              {userType === 'single-technician' && (
                <>
                  {jobData.technicians?.map((tech: any, index: number) => (
                    <div key={index} className="mb-6 border-b border-gray-400 pb-4">

                      {/* Technician Image and Name */}
                      <div className="mb-2 flex items-start text-sm">
                        <strong className="w-[210px] min-w-[210px] inline-block">Dent Tech Name:</strong>
                        <div className="flex items-center gap-2">
                          {tech.image ? (
                            <img
                              onClick={() => setPreviewImage(tech.image)}
                              src={tech.image}
                              alt={`${tech.firstName} ${tech.lastName}`}
                              className="w-8 h-8 rounded-full object-cover cursor-pointer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-sm font-semibold">
                              {tech.firstName?.trim()?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                          <span className="capitalize">{`${tech.firstName} ${tech.lastName}`}</span>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="mb-2 flex text-sm">
                        <strong className="w-[210px] min-w-[210px] inline-block">Technician Email:</strong>
                        <a className="hover:underline" href={`mailto:${tech.email}`}>{tech.email}</a>
                      </div>

                      {/* Phone Number */}
                      <div className="mb-2 flex text-sm">
                        <strong className="w-[210px] min-w-[210px] inline-block">Technician Ph. Number:</strong>
                        <a className="hover:underline" href={`tel:${tech.phoneNumber}`}>{tech.phoneNumber || 'N/A'}</a>
                      </div>
                      {tech.UserJob.rRate !== null && tech.UserJob.rRate !== '' && (
                        <p className="mb-1"><strong className='w-[210px] inline-block text-sm'>RR/I/R:</strong> ${tech.UserJob.rRate}</p>
                      )}
                      {tech.UserJob.techFlatRate !== null && tech.UserJob.techFlatRate !== '' && (
                        <p className="mb-1"><strong className='w-[210px] inline-block text-sm'>Dent Tech Flat Rate:</strong> ${tech.UserJob.techFlatRate}</p>
                      )}
                      {/* Pay Details */}
                      {tech.UserJob && (
                        <>
                          {tech.UserJob.payVehicleType && (
                            <div className="mb-2 flex text-sm">
                              <strong className="w-[210px] min-w-[210px] inline-block">Vehicle Type:</strong>
                              {tech.UserJob.payVehicleType}
                            </div>
                          )}

                        </>
                      )}
                    </div>
                  ))}
                </>
              )}
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex items-center'><strong className='w-[210px] inline-block'>Vehicle Price:</strong>
                <div className="flex gap-3 items-center capitalize">

                  ${jobData?.estimatedCost || '0'}
                </div>
              </div>
              {jobData?.estimatedBy !== null && (
                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Created By:</strong> {jobData?.createdBy}</div>
              )}
              {jobData?.estimatedBy !== null && (
                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Estimated By:</strong> {jobData?.estimatedBy}</div>
              )}
              {userType !== 'single-technician' || isSingleTechnicianWorkOrder && (
                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex items-center'><strong className='w-[210px] inline-block'>Manager Name:</strong>
                  <div className="flex gap-3 items-center capitalize">
                    {jobData?.manager?.firstName} {jobData?.manager?.lastName}
                  </div>
                </div>
              )}
              {userType !== 'single-technician' || isSingleTechnicianWorkOrder && (
                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Manager Email:</strong>
                  <a className="hover:underline" href={`mailto:${jobData?.manager?.email}`}>
                    {jobData?.manager?.email || 'N/A'}
                  </a>
                </div>
              )}
              {userType !== 'single-technician' || isSingleTechnicianWorkOrder && (
                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Manager Ph. Number:</strong>
                  <a className="hover:underline" href={`tel:${jobData?.manager?.phoneNumber}`}>
                    {jobData?.manager?.phoneNumber || 'N/A'}
                  </a>
                </div>
              )}
              {/* {userType === 'single-technician' || isSingleTechnicianWorkOrder && (
                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                  <strong className='w-[210px] inline-block'>Vehicle Price:</strong>
                  {userType === 'single-technician' || isSingleTechnicianWorkOrder
                    ? `$${Number(jobData?.estimatedCost ?? 0).toFixed(2)}`
                    : '$0.00'}
                </div>

              )} */}
              {jobData?.notes !== null && (
                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 word-break'><strong className='w-[210px] inline-block'>Notes:</strong> {jobData?.notes}</div>
              )}
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Job Status:</strong>
                <span
                  className={`badge ${jobData.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
                >
                  {jobData.jobStatus ? 'Completed' : 'Inprogress'}
                </span>
              </div>

            </div>

          </div>
          {/* {userType !== 'single-technician' && (
            <div className="overflow-x-auto bg-white pt-3">
              <h3 className='bg-white text-[#000] p-3 font-bold'>Assign Technician</h3>

              <table className="table w-full table-fixed">
                <thead className=" ">
                  <tr>
                    <th scope="col">
                      Name
                    </th>
                    <th scope="col">
                      Type
                    </th>
                    <th scope="col">
                      Email
                    </th>
                    <th scope="col">
                      Phone
                    </th>
                    {/* <th scope="col">
                      R/I/R/R
                    </th>
                    <th scope="col">
                      Flat Rate
                    </th>  
                    <th scope="col">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(jobData.technicians) && jobData.technicians.length > 0 ? (
                    jobData.technicians.map((tech: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {tech.image ? (
                              <img
                                onClick={() => setPreviewImage(tech.image)}
                                src={tech.image}
                                alt={`${tech.firstName} ${tech.lastName}`}
                                className="w-8 h-8 rounded-full object-cover cursor-pointer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-sm font-semibold">
                                {tech.firstName?.trim()?.[0]?.toUpperCase() || "?"}
                              </div>
                            )}
                            <span className="capitalize">{`${tech.firstName} ${tech.lastName}`}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {tech.techType || 'N/A'}
                        </td>

                        <td className="px-6 py-4">
                          <a className="hover:underline" href={`mailto:${tech.email}`}>
                            {tech.email}
                          </a>
                        </td>

                        <td className="px-6 py-4">
                          <a className="hover:underline" href={`tel:${tech.phoneNumber}`}>
                            {tech.phoneNumber || 'N/A'}
                          </a>
                        </td>

                        {/* <td className="px-6 py-4">
                          {tech.UserJob?.rRate ? `$${tech.UserJob.rRate}` : 'N/A'}
                        </td>

                        <td className="px-6 py-4">
                          {tech.UserJob?.techFlatRate ? `$${tech.UserJob.techFlatRate}` : 'N/A'}
                        </td>  
                        <td>
                          <Link href={`/technicians/view?technicianId=${tech.id}`} >
                            <Image alt='eye' src={Eye} className='w-[16px] ' data-tooltip-id="view"
                              data-tooltip-content="View" />
                          </Link>
                          <Tooltip id="view" place="top" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-gray-500">
                        No technician found
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>
          )} */}

          <h3 className='bg-white text-[#000] p-3 font-bold pt-3'>Vehicle List</h3>
          <div className="overflow-x-auto bg-white">
            <table className="table w-full table-fixed">
              <thead className=" ">
                <tr>
                  <th scope="col">
                    Dent Tech Name
                  </th>
                  <th scope="col">
                    VIN
                  </th>
                  <th scope="col">
                    Make
                  </th>
                  <th scope="col">
                    Model
                  </th>
                    <th scope="col">
                      Model Year
                    </th>
                  <th scope="col">
                    Vehicle Override Price
                  </th>
                  {/* <th scope="col">
                    Description
                  </th>
                  <th scope="col">
                    Notes
                  </th> */}
                  <th scope="col">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(jobData.vehicles) && jobData.vehicles.length > 0 ? (
                  jobData.vehicles.map((vehicles: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <span className="capitalize">
                          {Array.isArray(vehicles.assignedTechnicians) && vehicles.assignedTechnicians.length > 0
                            ? vehicles.assignedTechnicians
                              .map((tech: any) => `${tech.firstName} ${tech.lastName}`)
                              .join(', ')
                            : '-'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="capitalize">{vehicles.vin || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {vehicles.make || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {vehicles.model || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {vehicles.modelYear || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {vehicles.labourCost && vehicles.labourCost !== '' 
                          ? `$${vehicles.labourCost}`
                          : <span className="text-gray-400 text-sm">No price added</span>
                        }
                      </td>
                      {/* <td className="px-6 py-4">
                        {Array.isArray(vehicles.jobDescription) &&
                          vehicles.jobDescription.some((desc: string) => desc.trim() !== '')
                          ? vehicles.jobDescription.join(', ')
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {vehicles.notes && vehicles.notes.trim() !== '' ? vehicles.notes : '-'}
                      </td> */}
                      <td>
                        <Link href={`/vehicle/view?vehicleId=${vehicles.id}`} >
                          <Image alt='eye' src={Eye} className='w-[16px] ' data-tooltip-id="view"
                            data-tooltip-content="View" />
                        </Link>
                        <Tooltip id="view" place="top" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray-500">
                     <Empty />
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
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
