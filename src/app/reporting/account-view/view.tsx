"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/app/component/SidebarContext';


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
    const { isCollapsed } = useSidebar();
    const [jobData, setJobsData] = useState<any>(null);
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [userType, setUserType] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const pathname = usePathname();
    const searchParams = useSearchParams();
    const backHref = '/reporting/account-reports';

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




    const estimatedProfit = jobData?.estimatedProfitLoss != null ? Number(jobData.estimatedProfitLoss) : null;
    const actualProfit = jobData?.actualProfitLoss != null ? Number(jobData.actualProfitLoss) : null;

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

    return (
        <div className={`mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
            <Breadcrumb
                items={[
                    { label: 'Account Reports', href: '/reporting/account-reports' },
                    { label: 'View Account Details', href: '' },
                ]}
            />

            <div className="mx-auto">
                 

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="flex items-center gap-2 bg-[#1e3e6f] text-white px-6 py-3">
                        <DocIcon />
                        <span className="font-bold text-base">Account Detail</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        <InfoCard icon={<HashIcon />} label="Job Id:" value={jobData?.id ?? '–'} />
                        <InfoCard icon={<BriefcaseIcon />} label="Job Title:" value={jobData?.jobName ?? '–'} />
                        <InfoCard icon={<PersonIcon />} label="Customer Name:" value={<span className="capitalize">{jobData?.customer?.fullName ?? '–'}</span>} />
                        <InfoCard icon={<MailIcon />} label="Customer Email:" value={<a className="hover:underline text-[#383d71]" href={`mailto:${jobData?.customer?.email}`}>{jobData?.customer?.email || 'N/A'}</a>} />
                        <InfoCard icon={<PhoneIcon />} label="Customer Ph. Number:" value={<a className="hover:underline text-[#383d71]" href={`tel:${jobData?.customer?.phoneNumber}`}>{jobData?.customer?.phoneNumber || 'N/A'}</a>} />
                        {userType !== 'single-technician' && (
                            <>
                                <InfoCard icon={<PersonIcon />} label="Manager Name:" value={<span className="capitalize">{jobData?.manager?.firstName} {jobData?.manager?.lastName}</span>} />
                                <InfoCard icon={<MailIcon />} label="Manager Email:" value={<a className="hover:underline text-[#383d71]" href={`mailto:${jobData?.manager?.email}`}>{jobData?.manager?.email || 'N/A'}</a>} />
                                <InfoCard icon={<PhoneIcon />} label="Manager Ph. Number:" value={<a className="hover:underline text-[#383d71]" href={`tel:${jobData?.manager?.phoneNumber}`}>{jobData?.manager?.phoneNumber || 'N/A'}</a>} />
                            </>
                        )}
                        <InfoCard icon={<CalendarIcon />} label="Start Date:" value={jobData?.startDate ? new Date(jobData.startDate).toLocaleDateString() : '–'} />
                        <InfoCard icon={<CalendarIcon />} label="End Date:" value={jobData?.endDate ? new Date(jobData.endDate).toLocaleDateString() : '–'} />

                        {userType === 'single-technician' && jobData.technicians?.length > 0 && jobData.technicians.map((tech: any, index: number) => (
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

                        <InfoCard icon={<DollarIcon />} label="Job Estimate:" value={jobData?.estimatedCost != null ? `$${jobData.estimatedCost}` : '–'} />
                        <InfoCard icon={<DollarIcon />} label="Total Flat Rate:" value={jobData?.totalFlatRate != null ? `$${jobData.totalFlatRate}` : '–'} />
                        <InfoCard icon={<DollarIcon />} label="Total RR/I/R:" value={jobData?.totalRRate != null ? `$${jobData.totalRRate}` : '–'} />
                        <InfoCard icon={<DollarIcon />} label="Total Expense:" value={jobData?.totalCombined != null ? `$${jobData.totalCombined}` : '–'} />
                        <InfoCard icon={<DollarIcon />} label="Estimated Profit / loss:" value={
                            estimatedProfit != null ? <span className={estimatedProfit < 0 ? 'text-red-500' : 'text-green-700'}>{`$${estimatedProfit.toFixed(2)}`}</span> : '–'
                        } />
                        <InfoCard icon={<DollarIcon />} label="Actual Profit / Loss:" value={
                            actualProfit != null ? <span className={actualProfit < 0 ? 'text-red-500' : 'text-green-700'}>{`$${actualProfit.toFixed(2)}`}</span> : '–'
                        } />
                        {jobData?.estimatedBy != null && <InfoCard icon={<PersonIcon />} label="Estimated By:" value={jobData.estimatedBy} />}
                        {(userType === 'single-technician' || isSingleTechnicianWorkOrder) && (
                            <InfoCard icon={<DollarIcon />} label="Labour Cost:" value={`$${Number(jobData?.labourCost ?? 0).toFixed(2)}`} />
                        )}
                        <InfoCard icon={<DocIcon />} label="Notes:" value={jobData?.notes || 'N/A'} />
                        <InfoCard icon={<CheckIcon />} label="Job Status:" value={
                            <span className={jobData?.jobStatus ? 'bg-[#E6F9DD] text-[#1A932E] px-3 py-1 rounded font-medium' : 'bg-[#FFE4E1] text-[#FF0000] px-3 py-1 rounded font-medium'}>
                                {jobData?.jobStatus ? 'Completed' : 'Inprogress'}
                            </span>
                        } />
                    </div>
                </div> 


                    {userType !== 'single-technician' && (
                        <div className="mt-4 p-4 rounded-lg shadow-md bg-white">
                        <h3 className="text-lg font-bold mb-4">Vehicle List</h3>
                        <div className="border-t border-gray-200">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                                            <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Name</th>
                                            <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Vehicle Type</th>
                                            <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Email</th>
                                            <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Phone</th>
                                            <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">RR/I/R</th>
                                            <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Flat Rate</th>
                                            <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">VIN</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(() => {
                                            const pairs = jobData?.vehicles?.flatMap((vehicle: Vehicle) =>
                                                (vehicle.assignedTechnicians ?? []).map((tech: Technician, techIndex: number) => ({ tech, vehicle, techIndex }))
                                            ) ?? [];
                                            const grouped = pairs.reduce((acc: TechnicianAssignment[], current: { tech: Technician; vehicle: Vehicle; techIndex: number }) => {
                                                const existing = acc.find(item => item.tech.id === current.tech.id);
                                                if (existing) { existing.vehicles.push(current.vehicle); } else { acc.push({ tech: current.tech, vehicles: [current.vehicle], techIndex: current.techIndex }); }
                                                return acc;
                                            }, []);
                                            if (grouped.length === 0) {
                                                return <tr><td colSpan={7} className="text-center py-8 text-gray-500">No data</td></tr>;
                                            }
                                            return grouped.map(({ tech, vehicles }: TechnicianAssignment) => (
                                                <tr key={`${tech.id}-${vehicles.map((v: any) => v.id).join('-')}`} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            {tech.image ? (
                                                                <img src={tech.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-[#1e3e6f] text-white flex items-center justify-center text-sm font-semibold">{tech.firstName?.trim()?.[0]?.toUpperCase() || '?'}</div>
                                                            )}
                                                            <span className="capitalize">{tech.firstName} {tech.lastName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{tech.techType || '–'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap"><a className="hover:underline text-[#383d71]" href={`mailto:${tech.email}`}>{tech.email}</a></td>
                                                    <td className="px-6 py-4 whitespace-nowrap"><a className="hover:underline text-[#383d71]" href={`tel:${tech.phoneNumber}`}>{tech.phoneNumber || '–'}</a></td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{tech.VehicleTechnician?.rRate ? `$${tech.VehicleTechnician.rRate}` : '–'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{tech.VehicleTechnician?.techFlatRate ? `$${tech.VehicleTechnician.techFlatRate}` : '–'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{vehicles.map((v: any) => v.vin).join(', ')}</td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </div>
                    )}
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
