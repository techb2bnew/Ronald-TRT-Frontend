"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Empty from '@/app/component/empty';
import Pagination from '@/app/component/pagination';
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from '@/app/component/breadcrumb';
import Link from 'next/link';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg';
import { Tooltip } from 'react-tooltip';

import { useSidebar } from '@/app/component/SidebarContext';

const LIST_PAGE_SIZE = 10;

function parseJobsPayload(data: any): { items: any[]; totalPages: number } {
  const items: any[] = Array.isArray(data?.jobs)
    ? data.jobs
    : Array.isArray(data?.jobs?.jobs)
      ? data.jobs.jobs
      : Array.isArray(data?.data?.jobs)
        ? data.data.jobs
        : Array.isArray(data?.data)
          ? data.data
          : [];
  const totalPages = Number(
    data?.totalPages ?? data?.jobs?.totalPages ?? data?.pagination?.totalPages ?? 1
  );
  return { items, totalPages: Math.max(1, totalPages) || 1 };
}

function parseVehiclesPayload(data: any): { items: any[]; totalPages: number } {
  const items: any[] = Array.isArray(data?.vehicles)
    ? data.vehicles
    : Array.isArray(data?.vehicles?.vehicles)
      ? data.vehicles.vehicles
      : Array.isArray(data?.data?.vehicles)
        ? data.data.vehicles
        : Array.isArray(data?.data)
          ? data.data
          : [];
  const totalPages = Number(
    data?.totalPages ?? data?.vehicles?.totalPages ?? data?.pagination?.totalPages ?? 1
  );
  return { items, totalPages: Math.max(1, totalPages) || 1 };
}

export default function ViewDetails() {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [CustomerData, setCustomerData] = useState<any>(null);
  const [customerId, setCustomerId] = useState<string>('');
  const [customerJobs, setCustomerJobs] = useState<any[]>([]);
  const [customerVehicles, setCustomerVehicles] = useState<any[]>([]);
  const [jobsPage, setJobsPage] = useState(1);
  const [vehiclesPage, setVehiclesPage] = useState(1);
  const [jobsTotalPages, setJobsTotalPages] = useState(1);
  const [vehiclesTotalPages, setVehiclesTotalPages] = useState(1);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const isSingleTechnician = searchParams?.has('allTrtCustomer') ?? false;

  const fetchCustomerData = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/fetchSingleCustomer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customerId: id }),
      });

      const data = await response.json();

      if (response.ok) {
        setCustomerData(data.customers.customer);
      } else {
        toast.error(data.error || 'Error fetching customer data');
      }
    } catch {
      toast.error('An error occurred while fetching customer data');
    }
  };

  const fetchCustomerJobsList = async (id: string, page = 1) => {
    setJobsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `/api/fetchCustomerJobs?customerId=${encodeURIComponent(id)}&page=${page}&limit=${LIST_PAGE_SIZE}`,
        { method: 'GET', headers }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || data?.message || 'Failed to load jobs');
        setCustomerJobs([]);
        setJobsTotalPages(1);
        return;
      }
      const { items, totalPages } = parseJobsPayload(data);
      setCustomerJobs(items);
      setJobsTotalPages(totalPages);
    } catch {
      toast.error('An error occurred while fetching jobs');
      setCustomerJobs([]);
      setJobsTotalPages(1);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchCustomerVehiclesList = async (id: string, page = 1) => {
    setVehiclesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `/api/fetchCustomerVehicles?customerId=${encodeURIComponent(id)}&page=${page}&limit=${LIST_PAGE_SIZE}`,
        { method: 'GET', headers }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || data?.message || 'Failed to load vehicles');
        setCustomerVehicles([]);
        setVehiclesTotalPages(1);
        return;
      }
      const { items, totalPages } = parseVehiclesPayload(data);
      setCustomerVehicles(items);
      setVehiclesTotalPages(totalPages);
    } catch {
      toast.error('An error occurred while fetching vehicles');
      setCustomerVehicles([]);
      setVehiclesTotalPages(1);
    } finally {
      setVehiclesLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams?.get('customerId') || '';
    if (id) {
      setCustomerId(id);
      fetchCustomerData(id);
      setJobsPage(1);
      setVehiclesPage(1);
    } else {
      setCustomerId('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!customerId) return;
    fetchCustomerJobsList(customerId, jobsPage);
  }, [customerId, jobsPage]);

  useEffect(() => {
    if (!customerId) return;
    fetchCustomerVehiclesList(customerId, vehiclesPage);
  }, [customerId, vehiclesPage]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`)).catch(() => toast.error('Failed to copy'));
  };

  if (!CustomerData) {
    return <div><Loading /></div>;
  }

  const completedVehicles = Number(CustomerData?.completedVehicles ?? CustomerData?.completedWorkOrders ?? 0);
  const totalVehicles = Number(
    CustomerData?.totalVehicles ?? CustomerData?.totalWorkOrders ?? CustomerData?.vehicleCount ?? 0
  );

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
              value={
                totalVehicles > 0 || completedVehicles > 0 ? (
                  <><span className="text-green-600 font-medium">{completedVehicles}</span> / {totalVehicles} <span className="text-gray-500">(Completed / Total)</span></>
                ) : (
                  '–'
                )
              }
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
                  {/* <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Estimated Cost</th> */}
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Start Date</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">End Date</th>
                  <th className="text-right text-sm font-semibold text-gray-700 px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobsLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      <Loading />
                    </td>
                  </tr>
                ) : customerJobs.length > 0 ? (
                  customerJobs.map((job: any, index: number) => (
                    <tr key={job.id ?? index} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-gray-900">{job.id || '–'}</td>
                      <td className="px-6 py-4"><span className="capitalize">{job.jobName || '–'}</span></td>
                      {/* <td className="px-6 py-4">{job.estimatedCost ? `$${job.estimatedCost}` : '–'}</td> */}
                      <td className="px-6 py-4 text-gray-700">{job.startDate ? new Date(job.startDate).toLocaleDateString() : '–'}</td>
                      <td className="px-6 py-4 text-gray-700">{job.endDate ? new Date(job.endDate).toLocaleDateString() : '–'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/jobs/view?jobId=${job.id}&ActiveWorkOrder`} className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[#383d71] transition-colors" data-tooltip-id="view-job" data-tooltip-content="View">
                          <Image alt="View" src={Eye} className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      <Empty />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {customerJobs.length > 0 && jobsTotalPages > 1 && (
            <Pagination
              currentPage={jobsPage}
              totalPages={jobsTotalPages}
              onPageChange={(data) => setJobsPage(data.selected + 1)}
            />
          )}
        </div>
        <Tooltip id="view-job" place="top" />

        {/* Vehicle List */}
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
                {vehiclesLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <Loading />
                    </td>
                  </tr>
                ) : customerVehicles.length > 0 ? (
                  customerVehicles.map((vehicle: any, index: number) => (
                    <tr key={vehicle.id ?? index} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <span className="capitalize d-block">
                          {Array.isArray(vehicle.assignedTechnicians) &&
                            vehicle.assignedTechnicians.length > 0 ? (
                            vehicle.assignedTechnicians.map((tech: any, index: number) => (
                              <div key={index}>
                                {tech.firstName} {tech.lastName}
                              </div>
                            ))
                          ) : (
                            '–'
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4"><span className="capitalize">{vehicle.vin || '–'}</span></td>
                      <td className="px-6 py-4">{vehicle.make || 'N/A'}</td>
                      <td className="px-6 py-4">{vehicle.model || '–'}</td>
                      <td className="px-6 py-4">{vehicle.modelYear || '–'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/vehicle/view?vehicleId=${vehicle.id}`} className="inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors" data-tooltip-id="view-vehicle" data-tooltip-content="View">
                          <Image alt="View" src={Eye} className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      <Empty />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {customerVehicles.length > 0 && vehiclesTotalPages > 1 && (
            <Pagination
              currentPage={vehiclesPage}
              totalPages={vehiclesTotalPages}
              onPageChange={(data) => setVehiclesPage(data.selected + 1)}
            />
          )}
        </div>
        <Tooltip id="view-vehicle" place="top" />
        <ToastContainer />

      </div>
    </div>
  );
}
