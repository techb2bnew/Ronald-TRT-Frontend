"use client";
import React, { useState, useEffect } from 'react';
import CommonHeader from '../../../component/commonHeader';
import { useRouter } from "next/navigation";
import Pagination from '../../../component/pagination';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import Eye from '../../../../../public/eye.svg';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import SortIcon from '@/app/component/sortIcon';

interface Job {
  id: string;
  jobName: string;
  customer: {
    fullName: string;
  };
  technicians: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  assignCustomer: string;
  roleType: string;
  jobDescription: string;
  jobStatus?: boolean;
}

interface GroupJob {
  vin: string;
  count: number;
  groupStatus: string;
  jobs: Job[];
  jobStatusCounts?: {
    completed: number;
    inProgress: number;
  };
  vehicles: any[];
}

interface ActiveJobState {
  jobs: GroupJob[];
  totalGroupJob: GroupJob[];
}

function JobTListing() {
  const [activeJob, setActiveJob] = useState<ActiveJobState>({ jobs: [], totalGroupJob: [] });
  const [sortedJobs, setSortedJobs] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('jobName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isCollapsed } = useSidebar();
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'' | 'completed' | 'inProgress'>('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<GroupJob[]>([]);

  const normalizeJobs = (sourceJobs: GroupJob[]) => {
    const normalized: any[] = [];
    sourceJobs.forEach((group) => {
      if (Array.isArray(group.jobs)) {
        group.jobs.forEach((job) => {
          normalized.push({
            vin: group.vin,
            jobName: job.jobName,
            jobId: job.id,
            fullName: job.customer?.fullName || '',
            assignCustomer: job.assignCustomer,
            roleType: job.roleType,
            groupStatus: group.groupStatus,
            vehicles: group.vehicles,
            jobDescription: job.jobDescription,
            technicians: job.technicians || [],
            uniqueKey: `${group.vin}-${job.id}`,
            jobStatus: job.jobStatus
          });
        });
      }
    });
    return normalized;
  };

  const fetchJobs = async (
    page = 1,
    query = '',
    limit = pageSize,
    filterType: 'completed' | 'inProgress' | '' = ''
  ) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || '';
      const userId = localStorage.getItem('userID');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let endpoint = '';

      if (filterType) {
        endpoint = `/api/groupJob?filterType=${filterType}&roleType=${encodeURIComponent(roleType)}&userId=${userId}`;
      } else if (query.trim()) {
        endpoint =
          roleType === 'superadmin' || roleType === 'manager'
            ? `/api/groupJob?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
            : `/api/groupJob?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}&userId=${userId}`;
      } else {
        endpoint =
          roleType === 'superadmin'
            ? `/api/groupJob?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}&userId=${userId}`
            : `/api/groupJob?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}&userId=${userId}`;
      }

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      if (response.ok) {
        const isSearch = query.trim() !== '';
        const fetchedJobs: GroupJob[] = query.trim()
          ? data.searchGroup || []
          : data.GroupJob || [];

        setIsSearchActive(isSearch);
        if (isSearch) {
          setSearchResults(fetchedJobs);
        }

        const jobsToUse = isSearch ? fetchedJobs : data.totalGroupJob || [];
        const normalized = normalizeJobs(jobsToUse);

        setActiveJob({
          jobs: fetchedJobs,
          totalGroupJob: data.totalGroupJob || [],
        });
        setSortedJobs(normalized);
        setTotalPages(data.jobs?.totalPages || 1);
      } else {
        if (data.error === 'Invalid Token') {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs(currentPage, searchTerm, pageSize);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, pageSize]);

  const handlePageSizeChange = (size: number) => {
    const newTotalPages = Math.ceil(sortedJobs.length / size);
    let newPage = currentPage;
    if (newPage > newTotalPages) {
      newPage = newTotalPages;
    }
    setPageSize(size);
    setCurrentPage(newPage);
  };

  const handlePageChange = (data: { selected: number }) => {
    setCurrentPage(data.selected + 1);
  };

  const handleSort = (column: string) => {
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);

    setSortedJobs(prev => {
      return [...prev].sort((a, b) => {
        const aValue = a[column] || '';
        const bValue = b[column] || '';

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return direction === 'asc'
          ? (aValue > bValue ? 1 : -1)
          : (aValue < bValue ? 1 : -1);
      });
    });
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderRow = (job: any) => {
    const group = activeJob.totalGroupJob?.find(g => g.vin === job.vin);
    if (!group) return null;

    const isChecked = selectedIds.includes(job.assignCustomer);
    const completedCount = group.jobStatusCounts?.completed || 0;
    const totalJobs = group.count || 0;
    return (
      <tr key={job.uniqueKey}>
        <td>

          {job.vehicles?.[0] && (
            <div key={job.vehicles[0].id} className="capitalize">
              {job.vehicles[0].jobName}
            </div>
          )}

        </td>
        <td>
          {job.fullName}
        </td>
        <td>
          {job.vehicles?.map((vehicle: any, i: number) => (
            <div key={`${vehicle.id}-${i}`} className="capitalize">
              {vehicle.assignedTechnicians?.map((tech: any, index: number) => (
                <div key={`${tech.id}-${index}`} className="capitalize">
                  {tech.firstName} {tech.lastName}
                </div>
              ))}
            </div>
          ))}

        </td>
        <td>{job.vin}</td>
        <td>
          <span className={`badge ${job.groupStatus === "completed" ? "bg-[#E6F9DD] text-[#1A932E]" : "bg-[#FFE4E1] text-[#FF0000]"} p-2 pl-4 pr-4 rounded shadow`}>
            {job.groupStatus === "completed" ? "Completed" : "In Progress"}
          </span>
        </td>
        <td><div>{completedCount} / {totalJobs} Work Order</div></td>
        <td>
          <div className="flex items-center gap-3">
            <Link href={`/jobs/job-group/view?vin=${job.vin}&customerId=${job.assignCustomer}&jobId=${job.jobId}`}>
              <Image alt="view" src={Eye} className="w-[16px]" data-tooltip-id="view" data-tooltip-content="View" />
            </Link>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className={`mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[{ label: 'Group Work Orders', href: '/jobs/job-group/listing' }]}
      />
      <CommonHeader
        heading=""
        onPageSizeChange={handlePageSizeChange}
        onSearch={setSearchTerm}
        userRole=''
        buttonLabel=""
        buttonLink=""
        onCompletedClick={() => {
          setFilterType('completed');
          fetchJobs(1, '', pageSize, 'completed');
        }}
        onInProgressClick={() => {
          setFilterType('inProgress');
          fetchJobs(1, '', pageSize, 'inProgress');
        }}
      />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[100px]" onClick={() => handleSort('jobName')}>
                Job Title
                <SortIcon active={sortBy === 'jobName'} direction={sortDirection} />
              </th>
              <th className="w-[150px]" onClick={() => handleSort('fullName')}>
                Customer Name
                <SortIcon active={sortBy === 'fullName'} direction={sortDirection} />
              </th>
              <th className="w-[150px]">Dent Tech Name</th>
              <th className="w-[150px]" onClick={() => handleSort('vin')}>
                VIN
                <SortIcon active={sortBy === 'vin'} direction={sortDirection} />
              </th>
              <th className="w-[100px]" onClick={() => handleSort('groupStatus')}>
                Status
                <SortIcon active={sortBy === 'groupStatus'} direction={sortDirection} />
              </th>
              <th className="w-[100px]">Work Order</th>
              <th className="w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : sortedJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <Empty />
                </td>
              </tr>
            ) : (
              sortedJobs.map(renderRow)
            )}
          </tbody>
        </table>
      </div>
      {sortedJobs.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default JobTListing;