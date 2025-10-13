"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSearchParams, usePathname } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';


// Define interfaces for your data structure
interface Technician {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    techType?: string;
    image?: string;
    VehicleTechnician?: {
        rRate?: string;
        techFlatRate?: string;
    };
}

interface Vehicle {
    id: number;
    vin: string;
    make: string;
    model: string;
    assignedTechnicians?: Technician[];
    // Add other vehicle properties as needed
}

interface TechnicianAssignment {
    tech: Technician;
    vehicles: Vehicle[];
    techIndex: number;
}

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





    if (!jobData) {
        return <div><Loading /></div>;
    }




    return (
        <div>
            <Breadcrumb
                items={[
                    isEdit
                        ? { label: 'View Account Details' }
                        : { label: 'Create Technician', href: '/technicians/create-technician' },
                ]}
            />

            <div className='max-w-7xl mx-auto p-4 rounded-lg shadow bg-white'>

                <div className="bg-blue rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-2 pt-4 pl-6 border-b border-[#ccc] pb-3">Account Detail</h2>
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
                            {userType !== 'single-technician' && (
                                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex items-center'><strong className='w-[210px] inline-block'>Manager Name:</strong>
                                    <div className="flex gap-3 items-center capitalize">
                                        {jobData?.manager?.firstName} {jobData?.manager?.lastName}
                                    </div>
                                </div>
                            )}
                            {userType !== 'single-technician' && (
                                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Manager Email:</strong>
                                    <a className="hover:underline" href={`mailto:${jobData?.manager?.email}`}>
                                        {jobData?.manager?.email || 'N/A'}
                                    </a>
                                </div>
                            )}
                            {userType !== 'single-technician' && (
                                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Manager Ph. Number:</strong>
                                    <a className="hover:underline" href={`tel:${jobData?.manager?.phoneNumber}`}>
                                        {jobData?.manager?.phoneNumber || 'N/A'}
                                    </a>
                                </div>
                            )}
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
                                                <strong className="w-[210px] min-w-[210px] inline-block">Technician Name:</strong>
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
                                                <p className="mb-1"><strong className='w-[210px] inline-block text-sm'>R/I/R/R:</strong> ${tech.UserJob.rRate}</p>
                                            )}
                                            {tech.UserJob.techFlatRate !== null && tech.UserJob.techFlatRate !== '' && (
                                                <p className="mb-1"><strong className='w-[210px] inline-block text-sm'>Technician Flat Rate:</strong> ${tech.UserJob.techFlatRate}</p>
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
                            <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex items-center'><strong className='w-[210px] inline-block'>Job Estimate:</strong>
                                    {jobData?.estimatedCost && (
                                <div className="flex gap-3 items-center capitalize">
                                    ${jobData?.estimatedCost || '-'}
                                </div>
                                    ) || '-'}
                            </div>
                            <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex items-center'><strong className='w-[210px] inline-block'>Total Flat Rate:</strong>
                                <div className="flex gap-3 items-center capitalize">
                                    ${jobData?.totalFlatRate || '-'}
                                </div>
                            </div>
                            <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex items-center'><strong className='w-[210px] inline-block'>Total R/I/R/R:</strong>
                                <div className="flex gap-3 items-center capitalize">
                                    ${jobData?.totalRRate || '-'}
                                </div>
                            </div>
                            <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex items-center'><strong className='w-[210px] inline-block'>Total Expense:</strong>
                                <div className="flex gap-3 items-center capitalize">
                                    ${jobData?.totalCombined || '-'}
                                </div>
                            </div>
                            <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex items-center'><strong className='w-[210px] inline-block'>Estimated Profit / loss:</strong>
                                <div className="flex gap-3 items-center capitalize">
                                    <span className={`${jobData.estimatedProfitLoss < 0 ? 'text-red-500' : 'text-green-700'}`}>
                                        ${jobData?.estimatedProfitLoss.toFixed(2) || '-'}
                                    </span>
                                </div>
                            </div>
                            <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex items-center'><strong className='w-[210px] inline-block'>Actual Profit / Loss:</strong>
                                <div className="flex gap-3 items-center capitalize">
                                    <span className={`${jobData.actualProfitLoss < 0 ? 'text-red-500' : 'text-green-700'}`}>
                                        ${jobData?.actualProfitLoss.toFixed(2) || '-'}
                                    </span>

                                </div>
                            </div>
                            {jobData?.estimatedBy !== null && (
                                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Estimated By:</strong> {jobData?.estimatedBy}</div>
                            )}

                            {userType === 'single-technician' || isSingleTechnicianWorkOrder && (
                                <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                                    <strong className='w-[210px] inline-block'>Labour Cost:</strong>
                                    {userType === 'single-technician' || isSingleTechnicianWorkOrder
                                        ? `$${Number(jobData?.labourCost ?? 0).toFixed(2)}`
                                        : '$0.00'}
                                </div>

                            )}
                            <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex items-center'>
                                <strong className='w-[210px] min-w-[210px] inline-block'>Notes: </strong>
                                {jobData?.notes || 'N/A'}
                            </div>
                            <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Job Status:</strong>
                                <span
                                    className={`badge ${jobData.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
                                >
                                    {jobData.jobStatus ? 'Completed' : 'Inprogress'}
                                </span>
                            </div>

                        </div>

                    </div>
                    {userType !== 'single-technician' && (
                        <div className="overflow-x-auto bg-white pt-3">
                            <table className="table w-full table-fixed">
                                <thead className="">
                                    <tr>
                                        <th scope="col">Name</th>
                                        <th scope="col">Vehicle Type</th>
                                        <th scope="col">Email</th>
                                        <th scope="col">Phone</th>
                                        <th scope="col">R/I/R/R</th>
                                        <th scope="col">Flat Rate</th>
                                        <th scope="col">VIN</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {jobData?.vehicles?.flatMap((vehicle: Vehicle) =>
                                        vehicle.assignedTechnicians?.map((tech: Technician, techIndex: number) => ({
                                            tech,
                                            vehicle,
                                            techIndex
                                        }))
                                            ?.reduce((acc: TechnicianAssignment[], current: { tech: Technician; vehicle: Vehicle; techIndex: number }) => {
                                                const existingTech = acc.find(item => item.tech.id === current.tech.id);
                                                if (existingTech) {
                                                    existingTech.vehicles.push(current.vehicle);
                                                } else {
                                                    acc.push({
                                                        tech: current.tech,
                                                        vehicles: [current.vehicle],
                                                        techIndex: current.techIndex
                                                    });
                                                }
                                                return acc;
                                            }, [] as TechnicianAssignment[])
                                            ?.map(({ tech, vehicles, techIndex }: TechnicianAssignment) => (
                                                <tr key={`${tech.id}-${vehicle.id}-${techIndex}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            {tech.image ? (
                                                                <img
                                                                    src={tech.image}
                                                                    alt={`${tech.firstName} ${tech.lastName}`}
                                                                    className="w-8  h-8 rounded-full object-cover cursor-pointer"
                                                                />
                                                            ) : (
                                                                <div className="w-8 min-w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-sm font-semibold">
                                                                    {tech.firstName?.trim()?.[0]?.toUpperCase() || "?"}
                                                                </div>
                                                            )}
                                                            <span className="capitalize">{`${tech.firstName} ${tech.lastName}`}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {tech.techType || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <a className="hover:underline" href={`mailto:${tech.email}`}>
                                                            {tech.email}
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <a className="hover:underline" href={`tel:${tech.phoneNumber}`}>
                                                            {tech.phoneNumber || '-'}
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {tech.VehicleTechnician?.rRate ? `$${tech.VehicleTechnician.rRate}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {tech.VehicleTechnician?.techFlatRate ? `$${tech.VehicleTechnician.techFlatRate}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {vehicles.map((v: any) => v.vin).join(', ')}
                                                    </td>
                                                </tr>
                                            )))
                                    }
                                </tbody>
                            </table>
                        </div>
                    )}
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
