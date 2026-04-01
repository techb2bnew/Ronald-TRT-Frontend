"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';
import { Country, State } from 'country-state-city';
import Swal from 'sweetalert2';
import axios from 'axios';
import RejectReasonModal from '@/app/component/rejectReasonModal';
import Customer from '../customer/listing';
import Link from 'next/link';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg';
import { Tooltip } from 'react-tooltip';
 
import Empty from '@/app/component/empty';
import { useSidebar } from '@/app/component/SidebarContext';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function ViewDetails() {
  const { isCollapsed } = useSidebar();
  const [technician, setTechnician] = useState<any>(null);  // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [rejectionError, setRejectionError] = useState("");
  const handleRejectionSuccess = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const techId = searchParams.get('technicianId') || '';
    fetchTechnicianData(techId);

  };
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

      const response = await fetch(`/api/viewTechnician`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ technicianId }),
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



  const handleAccountStatusChange = async (techId: number, accountStatus: boolean) => {
    const newStatus = accountStatus ? 'Active' : 'Inactive';


    try {
      const token = localStorage.getItem('token');

      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };
      const searchParams = new URLSearchParams(window.location.search);
      const techId = searchParams.get('technicianId') || '';
      const response = await axios.post(
        `/api/updateTechnicianAccountStatus`,
        {
          technicianId: techId,
          accountStatus: accountStatus,
        },
        config
      );


      if (techId) {
        fetchTechnicianData(techId);
      }


      if (response.data.status) {
        await Swal.fire({
          title: 'Success!',
          text: `Account status changed to ${newStatus}.`,
          icon: 'success',
          confirmButtonColor: '#383d71',
        });
      } else {
        throw new Error('Account status API failed');
      }
    } catch (error) {
      console.error('Error updating account status:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Error updating account status.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleAccountStatusChanges = async (techId: number, accountStatus: boolean) => {
    const newStatus = accountStatus ? 'Active' : 'Inactive';

    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to ${newStatus} this technician?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#383d71',
        cancelButtonColor: 'black',
        confirmButtonText: `Yes, ${newStatus}`,
      });

      if (!result.isConfirmed) return;

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const response = await axios.post(
        `/api/updateTechnicianAccountStatus`,
        {
          technicianId: techId,
          accountStatus: accountStatus,
        },
        config
      );

      if (response.data.status) {
        await Swal.fire({
          title: 'Success!',
          text: `Account status changed to ${newStatus}.`,
          icon: 'success',
          confirmButtonColor: '#383d71',
        });
        const searchParams = new URLSearchParams(window.location.search);
        const techId = searchParams.get('technicianId') || '';

        if (techId) {

          fetchTechnicianData(techId);
        }
      } else {
        throw new Error(response.data.message || 'Account status update failed');
      }
    } catch (error) {
      console.error('Error updating account status:', error);
      Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Error updating account status',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };


  const handleApprovalChange = async (techId: number, isApproved: string, tech: any) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      await axios.post(
        `/api/technicianActiveUnactiveAccount`,
        {
          technicianId: techId,
          isApproved: isApproved,
        },
        config
      );

    } catch (error) {
      console.error('Error updating approval status:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Error updating approval status.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleChangeBothStatuses = async (tech: any) => {
    try {
      // Determine the new status (toggle between 'accept' and 'reject')
      const newApprovalStatus = tech.isApproved === 'accept' ? 'cancel' : 'accept';
      const newAccountStatus = newApprovalStatus === 'accept'; // true for active, false for inactive
      const statusText = newApprovalStatus.toLowerCase() === 'cancel' ? 'Reject' : newApprovalStatus.charAt(0).toUpperCase() + newApprovalStatus.slice(1);

      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to ${statusText} this technician?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#383d71',
        cancelButtonColor: 'black',
        confirmButtonText: `Yes, ${statusText}`,
      });

      if (result.isConfirmed) {
        // Update account status first
        await handleAccountStatusChange(tech.id, newAccountStatus);

        // Then update approval status
        await handleApprovalChange(tech.id, newApprovalStatus, tech);

        // Refresh the list
        const searchParams = new URLSearchParams(window.location.search);
        const techId = searchParams.get('technicianId') || '';

        if (techId) {
          fetchTechnicianData(techId);
        }
      }

    } catch (error) {
      console.error('Error updating both statuses:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Error updating technician statuses.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };

  if (!technician) {
    return <div><Loading /></div>;
  }

  const displayAddress = technician?.address ? technician.address.replace(/^,\s*/g, '').replace(/\s*,\s*/g, ', ').trim() : 'N/A';

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

  const formattedDate = (() => {
    const d = new Date(technician.updatedAt);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  })();

  const PhoneIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
  const MailIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  const DocIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  const CalendarIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  const CheckIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const HashIcon = () => <span className="text-sm font-bold">#</span>;
  const LocationIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  const BuildingIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
  const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

  return (
    <div className={`mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Single Technicians', href: '/single-technicians/listing' },
          { label: 'View Detail', href: '' }
        ]}
      />

      <div className="mx-auto">
        {/* Profile banner - dark blue with avatar + contact */}
        <div className="bg-[#1e3e6f] rounded-lg shadow-md overflow-hidden">
          <div className="flex gap-6 p-6 items-center">
            {technician?.image ? (
              <img
                onClick={() => setPreviewImage(technician.image)}
                src={technician.image}
                alt="Technician"
                className="w-24 h-24 rounded-full object-cover bg-white shadow-lg cursor-pointer flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-gray-700 font-bold text-3xl shadow-lg flex-shrink-0">
                {technician?.firstName?.charAt(0)?.toUpperCase() || 'T'}
              </div>
            )}
            <div className="flex-1 min-w-0 text-white space-y-2">
              <h2 className="text-xl font-bold capitalize truncate">{technician?.firstName} {technician?.lastName}</h2>
              <p className="flex items-center gap-2 flex-wrap">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <a href={`mailto:${technician?.email}`} className="hover:underline truncate">{technician?.email || 'N/A'}</a>
              </p>
              <p className="flex items-center gap-2 flex-wrap">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="truncate">{displayAddress}</span>
              </p>
              <p className="flex items-center gap-2 flex-wrap">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <a href={`tel:${technician?.phoneNumber}`} className="hover:underline">{technician?.phoneNumber || 'N/A'}</a>
              </p>
            </div>
          </div>
        </div>

        {/* Single Technician Details - InfoCard grid */}
        <div className="overflow-hidden mt-4">
          <h3 className="font-bold text-lg mb-4">Technician Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-100">
            <InfoCard icon={<HashIcon />} label="Technician Id" value={technician?.id ?? 'N/A'} />
            <InfoCard icon={<UserIcon />} label="Technician Name" value={<span className="capitalize">{technician?.firstName} {technician?.lastName}</span>} />
            <InfoCard icon={<MailIcon />} label="Email" value={technician?.email ? <a href={`mailto:${technician.email}`} className="hover:underline text-[#383d71]">{technician.email}</a> : 'N/A'} />
            <InfoCard icon={<PhoneIcon />} label="Ph. Number" value={technician?.phoneNumber ? <a href={`tel:${technician.phoneNumber}`} className="hover:underline text-[#383d71]">{technician.phoneNumber}</a> : 'N/A'} />
            <InfoCard
              icon={<PhoneIcon />}
              label="Secondary Number"
              value={technician?.secondaryContactName ? <a href={`tel:${technician.secondaryContactName}`} className="hover:underline text-[#383d71]">{technician.secondaryContactName}</a> : 'N/A'}
            />
            <InfoCard
              icon={<MailIcon />}
              label="Secondary Email"
              value={technician?.secondaryEmail ? <a href={`mailto:${technician.secondaryEmail}`} className="hover:underline text-[#383d71]">{technician.secondaryEmail}</a> : 'N/A'}
            />
            {(technician?.techType != null && technician.techType !== '') && (
              <InfoCard icon={<DocIcon />} label="Type" value={<span className="capitalize">{technician.techType === 'technician' ? 'Dent Tech' : technician.techType}</span>} />
            )}
            <InfoCard icon={<CalendarIcon />} label="Date" value={formattedDate} />
            <InfoCard icon={<LocationIcon />} label="Address" value={(technician?.address || 'N/A').replace(/^,\s*,\s*/g, '')} />
            <InfoCard icon={<BuildingIcon />} label="Business Name" value={technician?.businessName || 'N/A'} />
            <InfoCard
              icon={<BuildingIcon />}
              label="Business Logo"
              value={
                technician?.businessLogo ? (
                  <img onClick={() => setPreviewImage(technician.businessLogo)} src={technician.businessLogo} alt="Business Logo" className="w-10 h-10 rounded-full object-cover cursor-pointer" />
                ) : (
                  <span className="text-gray-500">N/A</span>
                )
              }
            />
            <InfoCard
              icon={<UserIcon />}
              label="Profile Image"
              value={
                technician?.image ? (
                  <img onClick={() => setPreviewImage(technician.image)} src={technician.image} alt="Profile" className="w-10 h-10 rounded-full object-cover cursor-pointer" />
                ) : (
                  <span className="text-gray-500">N/A</span>
                )
              }
            />
            <InfoCard
              icon={<CheckIcon />}
              label="Account Status"
              value={
                <div onClick={() => { if (technician.isApproved === 'accept') { handleAccountStatusChanges(technician.id, !technician.accountStatus); } }} style={{ cursor: technician.isApproved || technician.accountStatus ? 'pointer' : 'not-allowed' }}>
                  <span className={technician?.accountStatus ? 'bg-[#E6F9DD] text-[#1A932E] px-3 py-1 rounded font-medium inline-block' : 'bg-[#FFE4E1] text-[#FF0000] px-3 py-1 rounded font-medium inline-block'}>
                    {technician?.accountStatus ? 'Active' : 'Inactive'}
                  </span>
                </div>
              }
            />
            <InfoCard
              icon={<CheckIcon />}
              label="Approval Status"
              value={
                <div className="flex gap-2 items-center flex-wrap">
                  {technician.isApproved === 'accept' ? (
                    <span onClick={() => handleChangeBothStatuses(technician)} className="bg-[#E6F9DD] text-[#1A932E] px-3 py-1 rounded font-medium cursor-pointer inline-block">Accepted</span>
                  ) : technician.isApproved === 'cancel' ? (
                    <span onClick={() => handleChangeBothStatuses(technician)} className="bg-[#FFE4E1] text-[#FF0000] px-3 py-1 rounded font-medium cursor-pointer inline-block">Rejected</span>
                  ) : (
                    <>
                      <span onClick={() => handleChangeBothStatuses(technician)} className="bg-[#E6F9DD] text-[#1A932E] px-3 py-1 rounded font-medium cursor-pointer inline-block">Accept</span>
                      <button type="button" onClick={() => { setSelectedTechId(technician.id); setShowRejectModal(true); }} className="bg-[#FFE4E1] text-[#FF0000] px-3 py-1 rounded font-medium text-sm">Reject</button>
                    </>
                  )}
                </div>
              }
            />
            <InfoCard
              icon={<DocIcon />}
              label="Tax Form"
              value={
                technician?.taxForms?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    {technician.taxForms.map((form: string, index: number) => {
                      const isPDF = form.toLowerCase().endsWith('.pdf');
                      return (
                        <span key={index}>
                          {isPDF ? (
                            <button type="button" onClick={() => window.open(form, '_blank')} className="flex items-center gap-2 bg-gray-200 px-2 py-1 rounded shadow cursor-pointer text-[#383d71] hover:underline text-sm">
                              View PDF
                            </button>
                          ) : (
                            <img onClick={() => setPreviewImage(form)} src={form} alt={`Tax Form ${index + 1}`} className="w-10 h-10 rounded object-cover shadow cursor-pointer" />
                          )}
                        </span>
                      );
                    })}
                  </div>
                ) : 'N/A'
              }
            />
          </div>
        </div>
        <div className="shadow-lg p-4 bg-white rounded-lg mt-4">
        <Customer />
        </div>
        {/* Job List */}
        <div className="shadow-lg p-4 bg-white rounded-lg mt-4">
          <h3 className="font-bold text-gray-800 mb-4">Job List</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Job Id</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Job Name</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Start Date</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">End Date</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Vehicle Price</th>
                  <th className="text-right text-sm font-semibold text-gray-700 px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Array.isArray(technician.jobs) && technician.jobs.length > 0 ? (
                  technician.jobs.map((jobs: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 whitespace-nowrap">{jobs.id || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="capitalize">{jobs.jobName || '-'}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">{jobs.startDate ? new Date(jobs.startDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{jobs.endDate ? new Date(jobs.endDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{jobs.estimatedCost ? `$${jobs.estimatedCost}` : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/jobs/view?jobId=${jobs.id}`} className="inline-flex items-center justify-center w-9 h-9 rounded-full  transition-colors" data-tooltip-id="view-job" data-tooltip-content="View">
                          <Image alt="View" src={Eye} className="w-4 h-4  " />
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
        <Tooltip id="view-job" place="top" />

        {/* Vehicle List */}
        <div className="shadow-lg p-4 bg-white rounded-lg mt-4 mb-4">
          <h3 className="font-bold text-gray-800 mb-4">Vehicle List</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Job Name</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">VIN</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Make</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Model</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Model Year</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Vehicle Override Price</th>
                  <th className="text-right text-sm font-semibold text-gray-700 px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {technician?.jobs?.flatMap((job: any) => job.vehicles || []).length > 0 ? (
                  technician.jobs.flatMap((job: any, jobIndex: number) =>
                    (job.vehicles || []).map((vehicle: any, vehicleIndex: number) => (
                      <tr key={`${jobIndex}-${vehicleIndex}`} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 whitespace-nowrap">{vehicle.jobName || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className="capitalize">{vehicle.vin || '-'}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">{vehicle.make || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{vehicle.model || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{vehicle.modelYear || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">${vehicle.labourCost || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/vehicle/view?vehicleId=${vehicle.id}`} className="inline-flex items-center justify-center w-9 h-9 rounded-full  transition-colors" data-tooltip-id="view-vehicle" data-tooltip-content="View">
                            <Image alt="View" src={Eye} className="w-4 h-4  " />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500"><Empty /></td>
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
      <RejectReasonModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        technicianId={selectedTechId}
        apiUrl={apiUrl}
        onSuccess={handleRejectionSuccess}
      />
    </div>
  );
}
