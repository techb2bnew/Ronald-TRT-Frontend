"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from '@/app/component/breadcrumb';
import { Country, State } from 'country-state-city';
import Link from 'next/link';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg';
import { Tooltip } from 'react-tooltip';
 
import { useSidebar } from '@/app/component/SidebarContext';

export default function ViewDetails() {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [CustomerData, setCustomerData] = useState<any>(null);  // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  const isSingleTechnician = searchParams!.has('allTrtCustomer');

  React.useEffect(() => {
    const type = localStorage.getItem('types');
    setUserType(type);
  });

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

      const response = await fetch('/api/fetchSingleCustomer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customerId }),
      });


      const data = await response.json();

      if (response.ok) {
        setCustomerData(data.customers.customer);  // Set the  CustomerData data
      } else {
        toast.error(data.error || 'Error fetching technician data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching technician data');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const techId = searchParams.get('customerId') || '';

    if (techId) {
      setIsEdit(true);  // Set to true if `fetchCustomerData` exists in the URL
      fetchCustomerData(techId);
    } else {
      setIsEdit(false);
    }
  }, []);

  const getCountryName = (isoCode: string) => {
    if (!isoCode) return 'No country selected';
    const country = Country.getCountryByCode(isoCode);
    return country?.name || isoCode; // Fallback to ISO code if country not found
  };
  const getStateName = (countryCode: string, stateCode: string) => {
    if (!countryCode || !stateCode) return 'No state selected';
    const state = State.getStateByCodeAndCountry(stateCode, countryCode);
    return state?.name || stateCode; // Fallback to code if name not found
  };

  const allVehicles = Array.isArray(CustomerData?.jobs)
    ? CustomerData.jobs.flatMap((job: any) =>
      Array.isArray(job.vehicles) ? job.vehicles : []
    )
    : [];

  const completedVehicles = allVehicles.filter((v: any) => v.vehicleStatus === true).length;
  const totalVehicles = allVehicles.length;

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`)).catch(() => toast.error('Failed to copy'));
  };

  if (!CustomerData) {
    return <div><Loading /></div>;
  }

  const InfoCard = ({ icon, label, value, copyValue }: { icon: React.ReactNode; label: string; value: React.ReactNode; copyValue?: string }) => (
    <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#383d71]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-900 flex-1 min-w-0">{value}</span>
          {copyValue != null && (
            <button
              type="button"
              onClick={() => copyToClipboard(copyValue, label)}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg p-1 bg-gray-100 hover:bg-[#383d71] text-[#383d71] hover:text-white transition-colors border border-gray-300 hover:border-[#383d71]"
              aria-label={`Copy ${label}`}
            >
              {/* Copy icon: two overlapping rounded squares */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`mobile_listing mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>

      <Breadcrumb
        items={[
          isSingleTechnician
            ? { label: 'All Customer', onClick: () => router.back() }
            : { label: 'Customer', href: '/customer/listing' },
          { label: 'View Detail', href: '' }
        ]}
      />

      <div className="mx-auto">
        {/* Header: back + Customer Detail */}
        {/* <div className="flex items-center gap-3 mb-4">
          <Link href={backHref} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <svg className="w-8 h-8 bg-[#1e3e6f] text-white rounded-lg p-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="font-semibold">Customer Detail</span>
          </Link>
        </div> */}

        {/* Customer Information section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center gap-2 bg-[#1e3e6f] text-white px-6 py-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="font-bold text-base">Customer Information</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <InfoCard
              icon={<span className="text-sm font-bold">#</span>}
              label="Customer ID"
              value={CustomerData?.id ?? '–'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              label="Customer Name"
              value={`${CustomerData?.fullName || ''} ${CustomerData?.lastName || ''}`.trim() || '–'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              label="Email Address"
              value={<a className="hover:underline text-[#383d71]" href={`mailto:${CustomerData?.email}`}>{CustomerData?.email || 'N/A'}</a>}
              copyValue={CustomerData?.email || undefined}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
              label="Phone Number"
              value={<a className="hover:underline text-[#383d71]" href={`tel:${CustomerData?.phoneNumber}`}>{CustomerData?.phoneNumber || 'N/A'}</a>}
              copyValue={CustomerData?.phoneNumber || undefined}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              label="Address"
              value={CustomerData.address ? CustomerData.address.replace(/^,\s*/g, '').replace(/\s*,\s*/g, ', ') : 'N/A'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
              label="Work Orders"
              value={<><span className="text-green-600 font-medium">{completedVehicles}</span> / {totalVehicles} <span className="text-gray-500">(Completed / Total)</span></>}
            />
          </div>
        </div>

        {/* Job List */}
        <div className="shadow-lg p-4 bg-white rounded-lg mt-4">
        <h3 className="font-bold rounded-t-lg mb-4">Job List</h3>
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-b-lg shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Job Id</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Job Name</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Estimated Cost</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Start Date</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">End Date</th>
                <th className="text-right text-sm font-semibold text-gray-700 px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(CustomerData.jobs) && CustomerData.jobs.length > 0 ? (
                CustomerData.jobs.map((jobs: any, index: number) => (
                  <tr key={jobs.id ?? index} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-900">{jobs.id || '–'}</td>
                    <td className="px-6 py-4"><span className="capitalize">{jobs.jobName || '–'}</span></td>
                    <td className="px-6 py-4">{jobs.estimatedCost ? `$${jobs.estimatedCost}` : '–'}</td>
                    <td className="px-6 py-4 text-gray-700">{jobs.startDate ? new Date(jobs.startDate).toLocaleDateString() : '–'}</td>
                    <td className="px-6 py-4 text-gray-700">{jobs.endDate ? new Date(jobs.endDate).toLocaleDateString() : '–'}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/jobs/view?jobId=${jobs.id}&ActiveWorkOrder`} className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[#383d71] transition-colors" data-tooltip-id="view-job" data-tooltip-content="View">
                        <Image alt="View" src={Eye} className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">No jobs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
        <Tooltip id="view-job" place="top" />
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
                  <th scope="col">
                    R/I/R/R
                  </th>
                  <th scope="col">
                    Flat Rate
                  </th>
                  <th>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  // Flatten all assignedTechnicians into a single array
                  const allTechnicians =
                    Array.isArray(CustomerData.vehicles)
                      ? CustomerData.vehicles.flatMap((vehicle: any) =>
                        Array.isArray(vehicle.assignedTechnicians) ? vehicle.assignedTechnicians : []
                      )
                      : [];

                  return allTechnicians.length > 0 ? (
                    allTechnicians.map((tech: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 ">
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

                        <td className="px-6 py-4 ">
                          {tech.techType || "N/A"}
                        </td>

                        <td className="px-6 py-4 ">
                          <a className="hover:underline" href={`mailto:${tech.email}`}>
                            {tech.email || "N/A"}
                          </a>
                        </td>

                        <td className="px-6 py-4 ">
                          <a className="hover:underline" href={`tel:${tech.phoneNumber}`}>
                            {tech.phoneNumber || "N/A"}
                          </a>
                        </td>

                        <td className="px-6 py-4 ">
                          {tech.VehicleTechnician?.rRate ? `$${tech.VehicleTechnician.rRate}` : "N/A"}
                        </td>

                        <td className="px-6 py-4 ">
                          {tech.VehicleTechnician?.techFlatRate ? `$${tech.VehicleTechnician.techFlatRate}` : "N/A"}
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
                      <td colSpan={7} className="text-center py-4 text-gray-500">
                        No technician found
                      </td>
                    </tr>
                  );
                })()}
              </tbody>



            </table>
          </div>
        )} */}
        <div className="shadow-lg p-4 bg-white rounded-lg mt-4"> 
        <h3 className="font-bold rounded-t-lg mb-4">Vehicle List</h3>
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-b-lg shadow-sm mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Dent Tech Name</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">VIN</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Make</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Model</th>
                <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Model Year</th>
                <th className="text-right text-sm font-semibold text-gray-700 px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(CustomerData.vehicles) && CustomerData.vehicles.length > 0 ? (
                CustomerData.vehicles.map((vehicles: any, index: number) => (
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
                    <td className="px-6 py-4 text-right">
                      <Link href={`/vehicle/view?vehicleId=${vehicles.id}`} className="inline-flex items-center justify-center w-9 h-9 rounded-full  transition-colors" data-tooltip-id="view-vehicle" data-tooltip-content="View">
                        <Image alt="View" src={Eye} className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">No vehicle found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
        <Tooltip id="view-vehicle" place="top" />
        <ToastContainer />

      </div>
    </div>
  );
}
