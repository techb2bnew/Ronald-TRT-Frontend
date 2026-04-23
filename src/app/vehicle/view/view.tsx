"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/app/component/SidebarContext';

/** Single URL or JSON string array from API */
function parseInsuranceFileUrls(raw: unknown): string[] {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) {
    return raw.map((u) => String(u).trim()).filter(Boolean);
  }
  const s = String(raw).trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((u) => String(u).trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }
  return [s];
}

function fileLabelFromInsuranceUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = decodeURIComponent(path.split('/').pop() || url);
    return name.replace(/\s+/g, ' ').trim() || url;
  } catch {
    return url;
  }
}

export default function ViewDetails() {
  const { isCollapsed } = useSidebar();
  const searchParams = useSearchParams();
  const [jobData, setJobsData] = useState<any>(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [roleType, setUserType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const isSingleTechnicianWorkOrder = searchParams!.has('singleWorkOrder');
  const fetchCustomerData = async (vehicleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/fetchSingleVehicleInfo?vehicleId=${vehicleId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setJobsData(data.vehicle.vehicle);
      } else {
        toast.error(data.error || 'Error fetching vehicle data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching vehicle data');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const vehicleId = searchParams.get('vehicleId') || '';

    if (vehicleId) {
      fetchCustomerData(vehicleId);
    }
  }, []);

  React.useEffect(() => {
    const type = localStorage.getItem('types');
    setUserType(type);
  }, []);

  if (!jobData) {
    return <div><Loading /></div>;
  }
  const subTotalCost = jobData.jobDescription?.reduce((acc: number, job: any) => {
    return acc + parseFloat(job.cost || '0');
  }, 0);



  const backHref = '/vehicle/listing';

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

  /** Show 'N/A' when value is null, undefined, or empty/whitespace string */
  const na = (v: any) => (v != null && String(v).trim() !== '' ? v : 'N/A');

  const getDescriptionText = (item: any): string => {
    if (item == null) return 'No description found';
    if (typeof item === 'string') {
      try {
        const parsed = JSON.parse(item);
        return parsed?.description ?? parsed?.name ?? String(item);
      } catch {
        return item;
      }
    }
    return (item as any)?.description ?? (item as any)?.name ?? String(item);
  };

  const formatTechType = (type:any) => {
    if (!type) return 'N/A';
  
    if (type === 'R/I/R/R') return 'R&I';
  
    return type;
  };

  return (
    <div className={`mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Vehicles Info', href: '/vehicle/listing' },
          { label: 'View Detail', href: '' }
        ]}
      />

      <div className="mx-auto">
        {/* <div className="flex items-center gap-3 mb-4">
          <Link href={backHref} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <svg className="w-8 h-8 bg-[#1e3e6f] text-white rounded-lg p-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="font-semibold text-lg">Vehicle Detail</span>
          </Link>
        </div> */}

        {/* Vehicle Detail section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center gap-2 bg-[#1e3e6f] text-white px-6 py-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span className="font-bold text-base">Vehicle Detail</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6  ">
            {/* Column 1 */}
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} label="Job Title" value={na(jobData?.jobName)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>} label="Make" value={na(jobData?.make)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>} label="Manufacturer Name" value={na(jobData?.manufacturerName)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} label="Start Date" value={jobData?.startDate ? new Date(jobData.startDate).toLocaleDateString() : 'N/A'} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} label="Plant Country" value={na(jobData?.plantCountry)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} label="Plant State" value={na(jobData?.plantState)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} label="Customer" value={<span className="capitalize">{na(jobData?.customer?.fullName)}</span>} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} label="Customer Email" value={jobData?.customer?.email && String(jobData.customer.email).trim() !== '' ? <a className="hover:underline text-[#383d71]" href={`mailto:${jobData.customer.email}`}>{jobData.customer.email}</a> : 'N/A'} />

            {/* Column 2 */}
            <InfoCard icon={<span className="text-sm font-bold">#</span>} label="VIN" value={na(jobData?.vin)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>} label="Model" value={na(jobData?.model)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>} label="Vehicle Type" value={na(jobData?.vehicleType)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} label="End Date" value={jobData?.endDate ? new Date(jobData.endDate).toLocaleDateString() : 'N/A'} />

            {jobData?.pdr !== 'null' && jobData?.pdr !== null && (
              <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} label="PDR" value={jobData?.pdr && String(jobData.pdr).trim() !== '' ? `$${jobData.pdr}` : <span className="text-gray-500">No price added</span>} />
            )}

            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} label="Insurance Calculated Price" value={jobData?.insuranceCalculatedPrice && String(jobData.insuranceCalculatedPrice).trim() !== '' ? `$${jobData.insuranceCalculatedPrice}` : <span className="text-gray-500">No price added</span>} />
            <InfoCard icon={<>%</>} label="Insurance Percentage" value={jobData?.job?.insurancePercentage != null && String(jobData?.job?.insurancePercentage).trim() !== '' ? `${jobData?.job?.insurancePercentage}%` : <span className="text-gray-500">No percentage added</span>} />
            <InfoCard
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              label="Insurance File"
              value={(() => {
                const urls = parseInsuranceFileUrls(jobData?.job?.insuranceFile);
                if (urls.length === 0) {
                  return <span className="text-gray-500">No insurance file added</span>;
                }
                return (
                  <ul className="space-y-2">
                    {urls.map((url, idx) => (
                      <li key={`${url}-${idx}`}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-start gap-2 text-[#383d71] font-medium hover:underline break-all"
                        >
                          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>
                            <span className="text-gray-500 font-normal mr-1">{idx + 1}.</span>
                            {fileLabelFromInsuranceUrl(url)}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} label="Created By" value={na(jobData?.createdBy)} />
            {/* Column 3 */}
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} label="Vehicle Descriptor" value={na(jobData?.vehicleDescriptor)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} label="Model Year" value={na(jobData?.modelYear)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} label="Body Class" value={na(jobData?.bodyClass)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>} label="Color" value={jobData?.color && String(jobData.color).trim() !== '' ? jobData.color : <span className="text-gray-500">No Color selected</span>} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} label="Plant Company" value={na(jobData?.plantCompanyName)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} label="Estimated By" value={na(jobData?.estimatedBy)} />
            <InfoCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} label="Status" value={<span className={jobData?.vehicleStatus ? 'bg-[#E6F9DD] text-[#1A932E] px-3 py-1 rounded font-medium' : 'bg-[#FFE4E1] text-[#FF0000] px-3 py-1 rounded font-medium'}>{jobData?.vehicleStatus ? 'Completed' : 'In Progress'}</span>} />
          </div>
        </div>

        {/* Work Order Description */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200">
            <svg className="w-7 h-7 " fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="font-bold">Work Order Description</span>
          </div>
          <div className="p-6">
            {(() => {
              const desc = jobData?.jobDescription;
              const hasDescriptions = Array.isArray(desc) && desc.some((item: any) => (getDescriptionText(item) || '').trim() !== '');
              if (!hasDescriptions) {
                return <p className="text-gray-500">No work order descriptions available</p>;
              }
              const validItems = desc!.filter((item: any) => (getDescriptionText(item) || '').trim() !== '');
              return (
                <div className="divide-y divide-gray-200">
                  {validItems.map((item: any, index: number) => (
                    <p key={index} className="py-3 text-gray-700 first:pt-0 last:pb-0" style={{ wordBreak: 'break-all' }}>{getDescriptionText(item)}</p>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
        {/* Work Order Description */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200">
            <svg className="w-7 h-7 " fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="font-bold">Notes</span>
          </div>
          <div className="p-6">
            <p className="text-gray-500">{jobData?.notes || 'N/A'}</p>
          </div>
        </div>
        {/* Assigned Dent Tech */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200">
            <svg className="w-7 h-7 " fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-bold">Assigned Dent Tech</span>
          </div>
          <div className="p-6">
            {jobData?.assignedTechnicians?.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {jobData.assignedTechnicians.map((tech: any) => (
                  <div key={tech.id} className="py-4 first:pt-0">
                    <p className="font-semibold text-gray-900 capitalize">{tech.firstName} {tech.lastName}</p>
                    <p className="text-sm text-gray-600 mt-1">Phone: <a className="hover:underline text-[#383d71]" href={`tel:${tech.phoneNumber || ''}`}>{tech.phoneNumber || 'N/A'}</a></p>
                    <p className="text-sm text-gray-600">
                      Specialty: {formatTechType(tech?.techType)}
                    </p>
                    {tech?.VehicleTechnician?.techPercentageCalculatedAmount && tech?.VehicleTechnician?.techPercentageCalculatedAmount !== '' && (
                      <p className="text-sm text-gray-600">Amount: ${tech?.VehicleTechnician?.techPercentageCalculatedAmount ?? 'N/A'}</p>
                    )}
                    {tech?.VehicleTechnician?.rPercentageCalculatedAmount && tech?.VehicleTechnician?.rPercentageCalculatedAmount !== '' && (
                      <p className="text-sm text-gray-600">Amount: ${tech?.VehicleTechnician?.rPercentageCalculatedAmount ?? 'N/A'}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No technicians assigned</p>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4 mb-4">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="font-bold text-gray-800">Images</span>
          </div>
          <div className="p-6">
            {jobData?.images?.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {jobData.images.map((img: string, index: number) => (
                  <img key={index} src={img} alt={`Vehicle image ${index + 1}`} className="w-32 h-32 object-cover rounded-lg cursor-pointer shadow-sm hover:opacity-90 transition-opacity" onClick={() => setPreviewImage(img)} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No images available</p>
            )}
          </div>
        </div>
      </div>

      <ToastContainer />
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded shadow-lg" />
        </div>
      )}
    </div>
  );
}