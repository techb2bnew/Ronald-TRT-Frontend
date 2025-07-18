"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Breadcrumb from '@/app/component/breadcrumb';
import { Country, State } from 'country-state-city';
import { Link } from '@mui/material';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg'
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
export default function ViewDetails() {
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
  if (!CustomerData) {
    return <div><Loading /></div>;
  }



  return (
    <>

      <Breadcrumb
        items={[
          {
            label: isSingleTechnician ? 'All Customer' : 'Customer',
            href: isSingleTechnician
              ? '/single-technicians/listing'
              : '/client/listing',
          },
          { label: 'View Detail', href: '' }
        ]}
      />
      <div className='mx-auto p-4 rounded-lg shadow bg-white'>
        <div className="bg-blue rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 pt-4 pl-6 border-b border-[#ccc] mb-2 pb-3">Customer Detail</h2>
          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Left Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Customer Id:</strong> {CustomerData?.id}</p>
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4 capitalize'><strong className='w-[200px] inline-block'>Customer Name:</strong> {CustomerData?.fullName} {CustomerData?.lastName}</p>
              {/* <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Role Type:</strong> {CustomerData?.roleType}</p> */}
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Email:</strong>
                <a className="hover:underline" href={`mailto:${CustomerData?.email}`}> {CustomerData?.email || 'N/A'}</a></p>


            </div>

            {/* Right Section */}
            <div className='shadow-lg p-5 bg-white rounded'>

              <p className='mb-4 border-b border-gray-500 mb-3 pb-4'><strong className='w-[200px] inline-block'>Ph. Number:</strong>
                <a className="hover:underline" href={`tel:${CustomerData?.phoneNumber}`}> {CustomerData?.phoneNumber || 'N/A'}</a>
              </p>
              <p className='mb-4 border-b border-gray-500 mb-3 pb-4 flex'><strong className='w-[200px] min-w-[200px] inline-block'>Address:</strong> {CustomerData.address ? CustomerData.address.replace(/^,|\s*,\s*/g, '') : 'N/A'}  </p>
              <p className="mb-4 border-b border-gray-500 pb-4">
                <strong className='w-[200px] inline-block'>Vehicles / Work Orders:</strong> {completedVehicles} /  {totalVehicles}
              </p>
 

            </div>
          </div>
        </div>
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
                  Estimated Cost
                </th>
                <th scope="col">
                  Notes
                </th>
                <th scope="col">
                  Start Date
                </th>
                <th scope="col">
                  End Date
                </th>
                <th>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(CustomerData.jobs) && CustomerData.jobs.length > 0 ? (
                CustomerData.jobs.map((jobs: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 ">
                      {jobs.id || '-'}
                    </td>
                    <td className="px-6 py-4 ">
                      <span className="capitalize">{jobs.jobName || '-'}</span>
                    </td>
                    <td className="px-6 py-4 ">
                      {jobs.estimatedCost ? `$${jobs.estimatedCost}` : '-'}
                    </td>
                    <td className="px-6 py-4 ">
                      {jobs.notes || '-'}
                    </td>
                    <td className="px-6 py-4 ">
                      {jobs.startDate ? new Date(jobs.startDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 ">
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
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No jobs found
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
        {userType !== 'single-technician' && (
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
        )}
        <h3 className='bg-white text-[#000] p-3 font-bold pt-3'>Vehicle List</h3>
        <div className="overflow-x-auto bg-white">
          <table className="table w-full table-fixed">
            <thead className=" ">
              <tr>
                <th scope="col">
                  Technician Name
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
                  Description
                </th>
                <th scope="col">
                  Notes
                </th>
                <th scope='col'>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(CustomerData.vehicles) && CustomerData.vehicles.length > 0 ? (
                CustomerData.vehicles.map((vehicles: any, index: number) => (
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

                    <td className="px-6 py-4 ">
                      <span className="capitalize">{vehicles.vin || '-'}</span>
                    </td>
                    <td className="px-6 py-4 ">
                      {vehicles.make || 'N/A'}
                    </td>
                    <td className="px-6 py-4 ">
                      {vehicles.model || '-'}
                    </td>
                    <td className="px-6 py-4 ">
                      {vehicles.modelYear || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {Array.isArray(vehicles.jobDescription) &&
                        vehicles.jobDescription.some((desc: string) => desc.trim() !== '')
                        ? vehicles.jobDescription.join(', ')
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {vehicles.notes && vehicles.notes.trim() !== '' ? vehicles.notes : '-'}
                    </td>
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
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No vehicle found
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
        <ToastContainer />

      </div>
    </>
  );
}
