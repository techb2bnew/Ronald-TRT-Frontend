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
import { useSidebar } from '@/app/component/SidebarContext';

export default function ViewDetails() {
  const { isCollapsed } = useSidebar();
  const [jobData, setJobsData] = useState<any>(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const backHref = '/reporting/genrated-invoice';

  const isSingleTechnician = searchParams!.has('ActiveWorkOrder');
  const isSingleTechnicianWorkOrder = searchParams!.has('workorder');

  const fetchInvoiceData = async (invoiceId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/fetchSingleInvoice?invoiceId=${invoiceId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setJobsData(data.response.invoice);  // Set the  CustomerData data
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
    const invoiceId = searchParams.get('invoiceId') || '';

    if (invoiceId) {
      setIsEdit(true);  // Set to true if `fetchInvoiceData` exists in the URL
      fetchInvoiceData(invoiceId);
    } else {
      setIsEdit(false);
    }
  }, []);


  if (!jobData) {
    return <div><Loading /></div>;
  }




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

  const DocIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  const PersonIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const MailIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  const PhoneIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
  const CalendarIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  const DollarIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const HashIcon = () => <span className="text-sm font-bold">#</span>;
  const CheckIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const BriefcaseIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  const LinkIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;

  return (
    <div className={`mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Sent Invoice', href: '/reporting/genrated-invoice' },
          { label: 'Invoice Details', href: '' }
        ]}
      />

      <div className="mx-auto">
        {/* <div className="flex items-center gap-3 mb-4">
          <Link href={backHref} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <svg className="w-8 h-8 bg-[#383d71] text-white rounded-lg p-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="font-semibold text-lg">Invoice Detail</span>
          </Link>
        </div> */}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center gap-2 bg-[#1e3e6f] text-white p-3">
            <DocIcon />
            <span className="font-bold text-base">Invoice Detail</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            <InfoCard icon={<HashIcon />} label="Job Id:" value={jobData?.JobId ?? '–'} />
            <InfoCard icon={<BriefcaseIcon />} label="Job Title:" value={jobData?.job?.jobName ?? '–'} />
            <InfoCard icon={<PersonIcon />} label="Customer Name:" value={<span className="capitalize">{jobData?.customer?.fullName ?? '–'}</span>} />
            <InfoCard icon={<MailIcon />} label="Customer Email:" value={<a className="hover:underline text-[#383d71]" href={`mailto:${jobData?.customer?.email}`}>{jobData?.customer?.email || 'N/A'}</a>} />
            <InfoCard icon={<PhoneIcon />} label="Customer Ph. Number:" value={<a className="hover:underline text-[#383d71]" href={`tel:${jobData?.customer?.phoneNumber}`}>{jobData?.customer?.phoneNumber || 'N/A'}</a>} />
            <InfoCard icon={<CalendarIcon />} label="Start Date:" value={jobData?.job?.startDate ? new Date(jobData.job.startDate).toLocaleDateString() : 'N/A'} />
            <InfoCard icon={<CalendarIcon />} label="End Date:" value={jobData?.job?.endDate ? new Date(jobData.job.endDate).toLocaleDateString() : 'N/A'} />

            {userType === 'single-technician' && jobData.technicians?.map((tech: any, index: number) => (
              <React.Fragment key={index}>
                <InfoCard icon={<PersonIcon />} label="Dent Tech Name:" value={
                  <div className="flex items-center gap-2">
                    {tech.image ? (
                      <img onClick={() => setPreviewImage(tech.image)} src={tech.image} alt="" className="w-8 h-8 rounded-full object-cover cursor-pointer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1e3e6f] text-white flex items-center justify-center text-sm font-semibold">{tech.firstName?.trim()?.[0]?.toUpperCase() || '?'}</div>
                    )}
                    <span className="capitalize">{tech.firstName} {tech.lastName}</span>
                  </div>
                } />
                <InfoCard icon={<MailIcon />} label="Dent Tech Email:" value={<a className="hover:underline text-[#383d71]" href={`mailto:${tech.email}`}>{tech.email}</a>} />
                <InfoCard icon={<PhoneIcon />} label="Dent Tech Ph. Number:" value={<a className="hover:underline text-[#383d71]" href={`tel:${tech.phoneNumber}`}>{tech.phoneNumber || 'N/A'}</a>} />
                {tech.UserJob?.rRate != null && tech.UserJob.rRate !== '' && <InfoCard icon={<DollarIcon />} label="RR/I/R:" value={`$${tech.UserJob.rRate}`} />}
                {tech.UserJob?.techFlatRate != null && tech.UserJob.techFlatRate !== '' && <InfoCard icon={<DollarIcon />} label="Dent Tech Flat Rate:" value={`$${tech.UserJob.techFlatRate}`} />}
                {tech.UserJob?.payVehicleType && <InfoCard icon={<DocIcon />} label="Vehicle Type:" value={tech.UserJob.payVehicleType} />}
              </React.Fragment>
            ))}

            <InfoCard icon={<CalendarIcon />} label="Paid Date:" value={jobData?.paidDate ? new Date(jobData.paidDate).toLocaleDateString() : 'N/A'} />
            <InfoCard icon={<DollarIcon />} label="Vehicle Price:" value={`$${jobData?.job?.estimatedCost || '0'}`} />
            {jobData?.estimatedBy != null && <InfoCard icon={<PersonIcon />} label="Created By:" value={jobData?.job?.createdBy ?? '–'} />}
            {jobData?.estimatedBy != null && <InfoCard icon={<PersonIcon />} label="Estimated By:" value={jobData?.job?.estimatedBy ?? '–'} />}
            {(userType !== 'single-technician' || isSingleTechnicianWorkOrder) && (
              <>
                <InfoCard icon={<PersonIcon />} label="Manager Name:" value={<span className="capitalize">{jobData?.job?.manager?.firstName} {jobData?.job?.manager?.lastName}</span>} />
                <InfoCard icon={<MailIcon />} label="Manager Email:" value={<a className="hover:underline text-[#383d71]" href={`mailto:${jobData?.job?.manager?.email}`}>{jobData?.job?.manager?.email || 'N/A'}</a>} />
                <InfoCard icon={<PhoneIcon />} label="Manager Ph. Number:" value={<a className="hover:underline text-[#383d71]" href={`tel:${jobData?.job?.manager?.phoneNumber}`}>{jobData?.job?.manager?.phoneNumber || 'N/A'}</a>} />
              </>
            )}
            {jobData?.notes != null && <InfoCard icon={<DocIcon />} label="Notes:" value={jobData?.job?.notes || 'N/A'} />}
            <InfoCard icon={<CheckIcon />} label="Job Status:" value={
              <span className={jobData?.status === 'paid' ? 'bg-[#E6F9DD] text-[#1A932E] px-3 py-1 rounded font-medium' : 'bg-[#FFE4E1] text-[#FF0000] px-3 py-1 rounded font-medium'}>
                {jobData?.status === 'paid' ? 'Paid' : 'Unpaid'}
              </span>
            } />
            <InfoCard icon={<LinkIcon />} label="Invoice Link:" value={
              jobData?.pdfLink ? (
                <a href={jobData.pdfLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[#383d71] hover:underline" title="View PDF Invoice">
                  <svg width="32" height="24" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2h24l12 12v48c0 1.1-.9 2-2 2H16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2z" fill="#fff" stroke="currentColor" strokeWidth="2" />
                    <polyline points="40 2 40 14 52 14" fill="#fff" stroke="currentColor" strokeWidth="2" />
                    <line x1="20" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="20" y1="36" x2="44" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="20" y1="44" x2="44" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <rect x="8" y="10" width="28" height="14" rx="2" fill="#e53e3e" />
                    <text x="22" y="21" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">PDF</text>
                  </svg>
                </a>
              ) : (
                <span className="text-gray-500">No invoice available</span>
              )
            } />
          </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4 p-3">
            <h3 className="font-bold p-3">Assign Dent Tech</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Name</th>
                    {userType !== 'single-technician' && <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Type</th>}
                    <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Email</th>
                    <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Phone</th>
                    {userType !== 'single-technician' && <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">R&I</th>}
                    {userType !== 'single-technician' && <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Flat Rate</th>}
                    {userType === 'single-technician' && <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Labour Cost</th>}
                    <th className="text-right text-sm font-semibold text-gray-700 px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobData?.job?.vehicles?.flatMap((vehicle: any) =>
                    vehicle.assignedTechnicians?.length > 0
                      ? vehicle.assignedTechnicians.map((tech: any, index: number) => (
                          <tr key={`${vehicle.id}-${tech.id}-${index}`} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {tech.image ? (
                                  <img onClick={() => setPreviewImage(tech.image)} src={tech.image} alt="" className="w-8 h-8 rounded-full object-cover cursor-pointer" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#1e3e6f] text-white flex items-center justify-center text-sm font-semibold">{tech.firstName?.trim()?.[0]?.toUpperCase() || '?'}</div>
                                )}
                                <span className="capitalize">{tech.firstName} {tech.lastName}</span>
                              </div>
                            </td>
                            {userType !== 'single-technician' && <td className="px-6 py-4">{tech.techType || 'N/A'}</td>}
                            <td className="px-6 py-4"><a className="hover:underline text-[#383d71]" href={`mailto:${tech.email}`}>{tech.email}</a></td>
                            <td className="px-6 py-4"><a className="hover:underline text-[#383d71]" href={`tel:${tech.phoneNumber}`}>{tech.phoneNumber || 'N/A'}</a></td>
                            {userType !== 'single-technician' && <td className="px-6 py-4">{tech.VehicleTechnician?.rPercentageCalculatedAmount ? `$${tech.VehicleTechnician.rPercentageCalculatedAmount}` : 'N/A'}</td>}
                            {userType !== 'single-technician' && <td className="px-6 py-4">{tech.VehicleTechnician?.techPercentageCalculatedAmount ? `$${tech.VehicleTechnician.techPercentageCalculatedAmount}` : 'N/A'}</td>}
                            {userType === 'single-technician' && <td className="px-6 py-4">{tech.VehicleTechnician?.labourCost ? `$${tech.VehicleTechnician.labourCost}` : 'N/A'}</td>}
                            <td className="px-6 py-4 text-right">
                              <Link href={`/technicians/view?technicianId=${tech.id}`} className="inline-flex items-center justify-center w-9 h-9 rounded-full  transition-colors" data-tooltip-id="view-tech" data-tooltip-content="View">
                                <Image alt="View" src={Eye} className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      : []
                  )}
                  {jobData?.job?.vehicles?.every((v: any) => !v.assignedTechnicians?.length) && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">No technicians assigned to any vehicle</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Tooltip id="view-tech" place="top" />

          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4 p-3">
            <h3 className="font-bold p-3">Vehicle List</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Dent Tech Name</th>
                    <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">VIN</th>
                    <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Make</th>
                    <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Model</th>
                    <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Model Year</th>
                    {/* <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Description</th>
                    <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Notes</th> */}
                    <th className="text-right text-sm font-semibold text-gray-700 px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(jobData?.job?.vehicles) && jobData.job.vehicles.length > 0 ? (
                    jobData.job.vehicles.map((vehicles: any, index: number) => (
                      <tr key={vehicles.id ?? index} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <span className="capitalize">
                            {Array.isArray(vehicles.assignedTechnicians) && vehicles.assignedTechnicians.length > 0
                              ? vehicles.assignedTechnicians.map((tech: any) => `${tech.firstName} ${tech.lastName}`).join(', ')
                              : '–'}
                          </span>
                        </td>
                        <td className="px-6 py-4 capitalize">{vehicles.vin || '–'}</td>
                        <td className="px-6 py-4">{vehicles.make || 'N/A'}</td>
                        <td className="px-6 py-4">{vehicles.model || '–'}</td>
                        <td className="px-6 py-4">{vehicles.modelYear || '–'}</td>
                        {/* <td className="px-6 py-4">
                          {Array.isArray(vehicles.jobDescription) && vehicles.jobDescription.some((desc: string) => desc.trim() !== '')
                            ? vehicles.jobDescription.join(', ')
                            : '–'}
                        </td>
                        <td className="px-6 py-4">{vehicles.notes && vehicles.notes.trim() !== '' ? vehicles.notes : '–'}</td> */}
                        <td className="px-6 py-4 text-right">
                          <Link href={`/vehicle/view?vehicleId=${vehicles.id}`} className="inline-flex items-center justify-center w-9 h-9 rounded-full  transition-colors" data-tooltip-id="view-vehicle" data-tooltip-content="View">
                            <Image alt="View" src={Eye} className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">No vehicle found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Tooltip id="view-vehicle" place="top" />
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
