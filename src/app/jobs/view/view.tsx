"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSearchParams, usePathname } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
 
import Link from 'next/link';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg';
import Empty from '@/app/component/empty';
import { useSidebar } from '@/app/component/SidebarContext';

export default function ViewDetails() {
  const { isCollapsed } = useSidebar();
  const [jobData, setJobsData] = useState<any>(null);
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
      label: isSingleTechnician ? 'Job List' : 'Single Technician Work Order',
      href: isSingleTechnician ? '/jobs/active-job' : '/single-technicians/jobs',
    };
  };

  const baseBreadcrumb = getBaseBreadcrumb();
  const backHref = baseBreadcrumb.href;

  const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#383d71]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="text-gray-900">{value}</div>
      </div>
    </div>
  );

  return (
    <div className={`mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          getBaseBreadcrumb(),
          isEdit ? { label: 'View Details' } : { label: 'Create Technician', href: '/technicians/create-technician' },
        ]}
      />

      <div className="mx-auto">
        {/* Header: back + View Details */}
        {/* <div className="flex items-center gap-3 mb-4">
          <Link href={backHref} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <svg className="w-8 h-8 bg-[#383d71] text-white rounded-lg p-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="font-semibold text-lg">View Details</span>
          </Link>
        </div> */}

        {/* Job Detail section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center gap-2 bg-[#1e3e6f] text-white px-6 py-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span className="font-bold text-base">Job Detail</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            <InfoCard icon={<span className="text-sm font-bold">#</span>} label="Job ID" value={jobData?.id ?? '–'} />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              label="Job Title"
              value={jobData?.jobName || '–'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              label="Customer Name"
              value={<span className="capitalize">{jobData?.customer?.fullName || '–'}</span>}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              label="Customer Email"
              value={<a className="hover:underline text-[#383d71]" href={`mailto:${jobData?.customer?.email}`}>{jobData?.customer?.email || 'N/A'}</a>}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
              label="Customer Ph. Number"
              value={<a className="hover:underline text-[#383d71]" href={`tel:${jobData?.customer?.phoneNumber}`}>{jobData?.customer?.phoneNumber || 'N/A'}</a>}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A7 7 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              label="Manager Name"
              value={<span className="capitalize">{`${jobData?.manager?.firstName || ''} ${jobData?.manager?.lastName || ''}`.trim() || 'N/A'}</span>}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
              label="Manager Ph. Number"
              value={<a className="hover:underline text-[#383d71]" href={`tel:${jobData?.manager?.phoneNumber}`}>{jobData?.manager?.phoneNumber || 'N/A'}</a>}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="Start Date"
              value={jobData?.startDate ? new Date(jobData.startDate).toLocaleDateString() : '–'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="End Date"
              value={jobData?.endDate ? new Date(jobData.endDate).toLocaleDateString() : '–'}
            />
            {/* <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Vehicle Price"
              value={`$${jobData?.estimatedCost ?? '0'}`}
            /> */}
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              label="Created By"
              value={jobData?.createdBy || '–'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              label="Estimated By"
              value={jobData?.estimatedBy || '–'}
            />
            {jobData?.vehicleTypePricing && (
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1a5.002 5.002 0 01-4.546-2.916M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Vehicle Type Pricing"
              value={
                Array.isArray(jobData?.vehicleTypePricing) && jobData.vehicleTypePricing.length > 0 ? (
                  <div className="space-y-1 grid grid-cols-3">
                    {jobData.vehicleTypePricing.map((item: any, index: number) => (
                      <div key={`${item?.vehicleType || 'type'}-${index}`} className="text-sm">
                        <span className="font-medium">{item?.vehicleType || 'Vehicle'}</span>: ${item?.amount ?? 0}
                      </div>
                    ))}
                  </div>
                ) : '–'
              }
            />
            )}
            {jobData?.insurancePercentage && (
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11h10M7 15h6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-3.172a2 2 0 01-1.414-.586l-.828-.828A2 2 0 0012.172 3H11.83a2 2 0 00-1.414.586l-.828.828A2 2 0 018.172 5H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="Insurance Percentage"
              value={jobData?.insurancePercentage ? `${jobData.insurancePercentage}%` : '–'}
            />
            )}
            {jobData?.insuranceFile && (
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.656-5.656L5.757 10.76a6 6 0 108.486 8.485L20.5 13" /></svg>}
              label="Insurance File"
              value={
                jobData?.insuranceFile ? (
                  <a
                    href={jobData.insuranceFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#383d71] hover:underline break-all"
                  >
                    View Insurance File
                  </a>
                ) : '–'
              }
            />
            )}
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
              label="Job Status"
              value={
                <span className={jobData?.jobStatus ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                  {jobData?.jobStatus ? 'Completed' : 'Inprogress'}
                </span>
              }
            />
              <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              label="Notes"
              value={jobData?.notes || '–'}
            />
          </div>
        </div>

        {/* Vehicle List */}
        <div className="shadow-lg p-4 bg-white rounded-lg mt-4"> 
        <h3 className="font-bold rounded-t-lg mb-4">Vehicle List</h3>
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-b-lg shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Dent Tech Name</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">VIN</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Make</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Model</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Model Year</th>
                {/* <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Vehicle Override Price</th> */}
                <th className="text-right text-sm font-semibold text-gray-700 px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(jobData.vehicles) && jobData.vehicles.length > 0 ? (
                jobData.vehicles.map((vehicles: any, index: number) => (
                  <tr key={vehicles.id ?? index} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className="capitalize">
                        {Array.isArray(vehicles.assignedTechnicians) && vehicles.assignedTechnicians.length > 0
                          ? vehicles.assignedTechnicians.map((tech: any) => `${tech.firstName} ${tech.lastName}`).join(', ')
                          : '–'}
                      </span>
                    </td>
                    <td className="px-6 py-4"><span className="capitalize">{vehicles.vin || '–'}</span></td>
                    <td className="px-6 py-4">{vehicles.make || 'N/A'}</td>
                    <td className="px-6 py-4">{vehicles.model || '–'}</td>
                    <td className="px-6 py-4">{vehicles.modelYear || '–'}</td>
                    {/* <td className="px-6 py-4">
                      {vehicles.labourCost && vehicles.labourCost !== '' ? `$${vehicles.labourCost}` : <span className="text-gray-400 text-sm">No price added</span>}
                    </td> */}
                    <td className="px-6 py-4 text-right">
                      <Link href={`/vehicle/view?vehicleId=${vehicles.id}`} className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[#383d71] transition-colors" data-tooltip-id="view-vehicle" data-tooltip-content="View">
                        <Image alt="View" src={Eye} className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500"><Empty /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
        <Tooltip id="view-vehicle" place="top" />
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
