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
import { Link } from '@mui/material';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg'
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function ViewDetails() {
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

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Single Technicians', href: '/single-technicians/listing' },
          { label: 'View Detail', href: '' }
        ]}
      />

      <div className='mx-auto p-4 rounded-lg shadow bg-white'>
        <div className="bg-blue rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2 pt-4 pl-6 border-b border-[#ccc] pb-3">Single Technician Details</h2>

          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Left Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <p className=' border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Technician Id:</strong>{technician?.id}</p>
              <p className=' border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Technician Name:</strong>{technician?.firstName} {technician?.lastName}</p>
              <p className=' border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Email:</strong>
                <a className="hover:underline" href={`mailto:${technician?.email}`}>

                  {technician?.email}</a></p>
              <p className=' border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Ph. Number:</strong>
                <a className="hover:underline" href={`tel:${technician?.phoneNumber}`}>
                  {technician?.phoneNumber}</a></p>
              <p className='border-b border-gray-500 mb-3 pb-2'>
                <strong className='w-[200px] inline-block'>Secondary Number:</strong>
                {technician?.secondaryContactName ? (
                  <a className="hover:underline" href={`mailto:${technician.secondaryContactName}`}>
                    <span>{technician.secondaryContactName}</span>
                  </a>
                ) : (
                  <span className="text-gray-400 text-sm">N/A</span>
                )}
              </p>
              <p className='border-b border-gray-500 mb-3 pb-2'>
                <strong className='w-[200px] inline-block'>Secondary Email:</strong>
                {technician?.secondaryEmail ? (
                  <a className="hover:underline" href={`mailto:${technician.secondaryEmail}`}>
                    <span>{technician.secondaryEmail}</span>
                  </a>
                ) : (
                  <span className="text-gray-400 text-sm">N/A</span>
                )}
              </p>

              <p className='mb-2 flex border-b border-gray-500 mb-3 pb-3 items-center'><strong className='w-[200px] inline-block'>Account Status:</strong>
                <td
                  onClick={() => {
                    if (technician.isApproved === 'accept') {
                      handleAccountStatusChanges(technician.id, !technician.accountStatus);
                    }
                  }} // Corrected here
                  style={{ cursor: technician.isApproved || technician.accountStatus ? 'pointer' : 'not-allowed' }}
                >
                  <span
                    className={`badge ${technician.accountStatus
                      ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow block text-center w-[100px]'
                      : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow block text-center w-[100px]'
                      }`}
                  >
                    {technician.accountStatus ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </p>
              <div className='flex mb-2 border-b border-gray-500 mb-3 pb-3 items-center'><strong className='w-[200px] inline-block'>Approval  Status:</strong>

                <div className='flex gap-4 items-center'>
                  {technician.isApproved === 'accept' ? (
                    // Step 2: Show "Accepted", clicking sends 'cancel'
                    <span
                      onClick={() => handleChangeBothStatuses(technician)}
                      className="badge bg-[#E6F9DD] text-[#1A932E] p-2 px-3 rounded shadow block text-center w-[100px] cursor-pointer"
                    >
                      Accepted
                    </span>
                  ) : technician.isApproved === 'cancel' ? (
                    // Step 3: Show "Rejected", clicking sends 'accept'
                    <span
                      onClick={() => handleChangeBothStatuses(technician)}
                      className="badge bg-[#FFE4E1] text-[#FF0000] p-2 px-3 rounded shadow block text-center w-[100px] cursor-pointer"
                    >
                      Rejected
                    </span>
                  ) : (
                    // Step 1: First time — show Accept + Reject
                    <>
                      <span
                        onClick={() => handleChangeBothStatuses(technician)}
                        className="badge bg-[#E6F9DD] text-[#1A932E] p-2 px-3 rounded shadow block text-center w-[100px] cursor-pointer"
                      >
                        Accept
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTechId(technician.id);
                          setShowRejectModal(true);
                        }}
                        className="badges text-sm px-3 p-2 shadow badge-error bg-[#FFE4E1] text-[#FF0000] w-[100px]"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>



              </div>

            </div>

            {/* Right Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <p className='mb-2 border-b border-gray-500 mb-3 pb-2 flex'><strong className='w-[200px] min-w-[200px] inline-block'>Address:</strong>{technician.address || 'N/A'} </p>
              <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Date:</strong>{new Date(technician.updatedAt).toLocaleDateString('en-GB')} </p>
              <p className='mb-2 border-b border-gray-500 mb-3 pb-2'><strong className='w-[200px] inline-block'>Business Name:</strong>{technician?.businessName} </p>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2 flex items-center'>
                <strong className='w-[200px] inline-block'>Business Logo:</strong>


                {technician?.businessLogo ? (
                  <img onClick={() => setPreviewImage(technician.businessLogo)} src={technician.businessLogo} alt="" className="w-[40px] h-[40px] rounded-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-[40px] h-[40px] text-black-400 bg-gray-300 p-2 rounded-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}

              </div>
              <div className='mb-2 border-b border-gray-500 mb-3 pb-2 flex items-center'>
                <strong className='w-[200px] inline-block'>Profile Image:</strong>

                {technician?.image ? (
                  <img
                    onClick={() => setPreviewImage(technician.image)}
                    src={technician.image}
                    alt=""
                    className="w-[40px] h-[40px] rounded-full object-cover"
                  />
                ) : (
                  <div className="w-[40px] h-[40px] rounded-full bg-gray-300 text-black flex items-center justify-center font-semibold text-sm">
                    {technician?.firstName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}


              </div>
              {technician?.taxForms?.length > 0 && (
                <div className="mt-1 m-auto block mb-2 flex flex-wrap gap-4 items-center">
                  {technician.taxForms.map((form: string, index: number) => {
                    const isPDF = form.toLowerCase().endsWith(".pdf"); // Ensure case-insensitivity

                    return (
                      <div key={index} className="relative flex items-center gap-2">
                        <strong className='w-[200px] inline-block'>Tax Form:</strong>
                        {isPDF ? (
                          // PDF Button
                          <button
                            onClick={() => window.open(form, "_blank")}
                            className="flex items-center gap-2 bg-gray-200 px-3 py-1 rounded shadow hover:bg-gray-300 transition"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="orange" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 2H14L20 8V22H6V2Z" stroke="orange" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M14 2V8H20" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-sm text-gray-700 font-medium">View PDF</span>
                          </button>
                        ) : (
                          // Image Thumbnail
                          <img
                            onClick={() => setPreviewImage(form)}
                            src={form}
                            alt={`Tax Form ${index + 1}`}
                            className="w-[60px] h-[60px] rounded-lg border border-gray-300 shadow-md cursor-pointer hover:scale-105 transition"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}


            </div>
          </div>
        </div>
        <Customer />

        <h3 className='bg-white text-[#000] p-3 font-bold pt-3'>Job List</h3>
        <div className="overflow-x-auto bg-white">
          <table className="table w-full table-fixed">
            <thead className=" ">
              <tr>
                <th scope="col">
                  Job Id
                </th>
                <th scope="col">
                  Job Name
                </th>
                <th scope="col">
                  Vehicle Price	
                </th>

                {/* <th scope="col">
                  Tech Rate
                </th>
                <th scope="col">
                  R/I/R/R
                </th> */}
                <th scope="col">
                  Notes
                </th>
                <th scope="col">
                  Start Date
                </th>
                <th scope="col">
                  End Date
                </th>
                <th scope="col">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(technician.jobs) && technician.jobs.length > 0 ? (
                technician.jobs.map((jobs: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {jobs.id || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize">{jobs.jobName || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {jobs.estimatedCost ? `$${jobs.estimatedCost}` : '-'}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      {jobs.UserJob?.techFlatRate ? `$${jobs.UserJob.techFlatRate}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {jobs.UserJob?.rRate ? `$${jobs.UserJob.rRate}` : '-'}
                    </td> */}
                    <td className="px-6 py-4">
                      {jobs.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {jobs.startDate ? new Date(jobs.startDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {jobs.endDate ? new Date(jobs.endDate).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <Link href={`/jobs/view?jobId=${jobs.id}`} >
                        <Image alt='eye' src={Eye} className='w-[16px] ' data-tooltip-id="view"
                          data-tooltip-content="View" />
                      </Link>
                      <Tooltip id="view" place="top" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-gray-500">
                    No job found
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>


        <h3 className='bg-white text-[#000] p-3 font-bold pt-3'>Vehicle List</h3>
        <div className="overflow-x-auto bg-white">
          <table className="table w-full table-fixed">
            <thead className=" ">
              <tr>
                <th scope="col">
                  Job Name
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
                <th scope='col'>
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
              {technician?.jobs?.flatMap((job: any) => job.vehicles || []).length > 0 ? (
                technician.jobs.flatMap((job: any, jobIndex: number) =>
                  (job.vehicles || []).map((vehicle: any, vehicleIndex: number) => (
                    <tr key={`${jobIndex}-${vehicleIndex}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.jobName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="capitalize">{vehicle.vin || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.make || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.model || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.modelYear || '-'}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        ${vehicle.labourCost || '-'}
                      </td> 
                      {/* <td className="px-6 py-4">
                        {Array.isArray(vehicle.jobDescription) &&
                          vehicle.jobDescription.some((desc: string) => desc.trim() !== '')
                          ? vehicle.jobDescription.join(', ')
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {vehicle.notes && vehicle.notes.trim() !== '' ? vehicle.notes : '-'}
                      </td> */}
                      <td>
                        <Link href={`/vehicle/view?vehicleId=${vehicle.id}`} >
                          <Image alt='eye' src={Eye} className='w-[16px] ' data-tooltip-id="view"
                            data-tooltip-content="View" />
                        </Link>
                        <Tooltip id="view" place="top" />
                      </td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No vehicle found
                  </td>
                </tr>
              )}
            </tbody>

          </table>
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

        <RejectReasonModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          technicianId={selectedTechId}
          apiUrl={apiUrl}
          onSuccess={handleRejectionSuccess}
        />
      </div>
    </>
  );
}
