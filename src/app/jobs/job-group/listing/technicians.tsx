// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';  
import CommonHeader from '../../../component/commonHeader';
import { useRouter } from "next/navigation"; 
import Pagination from '../../../component/pagination';
import axios from 'axios';
import Swal from 'sweetalert2'; 
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import Eye from '../../../../../public/eye.svg'
import Image from 'next/image';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here
interface Jobs {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
}
const JobTable: React.FC = () => {
  const [activeJob, setActiveJob] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Manage sorting column state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);  
  const [loading, setLoading] = useState<boolean>(true); 
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // Implement search logic here
  };
  const handleDeleteSuccess = (deletedId: string) => {
      // toast.success('Technician deleted successfully');
  
      // ✅ Remove the deleted technician from the table
      setActiveJob((prev) => prev.filter((cust) => cust.id !== deletedId));
    };
    const fetchJobs = async (page = 1, query = '') => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const roleType = localStorage.getItem('types') || "";
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const endpoint = query.trim()
        ? `${apiUrl}/searchGroupJob?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : `${apiUrl}/fetchGroupJob?page=${page}&roleType=${encodeURIComponent(roleType)}`;

        const response = await fetch(endpoint, { method: 'GET', headers });
  
        const data = await response.json();
        if (response.ok) {
          const fetchedTechnicians: Jobs[] = query.trim()
          ? data.searchGroup || []
          : data.GroupJob || [];
        //  const filteredTechnicians = fetchedTechnicians.filter(technician => !technician.deletedStatus);

         setActiveJob(fetchedTechnicians);
        setTotalPages(data.jobs?.totalPages || 1); 
 
        } else {
          if (data.error === 'Invalid Token') {
            router.push('/');
          } else {
            console.error('Error fetching job data:', data.error);
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
      fetchJobs(currentPage, searchTerm);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm]);


  



  // Function to handle sorting logic
  const handleSort = (column: string) => {
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);

    const sortedJobs = [...activeJob].sort((a, b) => {
      if (column === 'customerName') {
        const nameA = `${a?.customer?.firstName} ${a?.customer?.lastName}`;
        const nameB = `${b?.customer?.firstName} ${b?.customer?.lastName}`;
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (column === 'technicianName') {
        const nameF = `${a?.technician?.firstName} ${a?.technician?.lastName}`;
        const nameL = `${b?.technician?.firstName} ${b?.technician?.lastName}`;
        return direction === 'asc' ? nameF.localeCompare(nameL) : nameL.localeCompare(nameF);
      }

      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setActiveJob(sortedJobs);
  };


  const toggleApproval = async (jobId: number, currentApprovalStatus: boolean) => {
    // Show a confirmation dialog before proceeding
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to change the status of this job?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF502E',
      cancelButtonColor: 'black',
      confirmButtonText: 'Yes, change it!'
    });
  
    // Check if the user confirmed the action
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
  
        const config = {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        };
  
        const response = await axios.post(`${apiUrl}/updateJobStatus`, {
          jobId,
          jobStatus: !currentApprovalStatus
        }, config);
  
        if (response.data.status ) {
          // Optimistically update the local state
          setActiveJob(prev => prev.map(job => {
            if (job.id === jobId) {
              return { ...job, jobStatus: !job.jobStatus };
            }
            return job;
          }));
          Swal.fire({
            title: 'Success!',
            text: 'Job status updated successfully.',
            confirmButtonColor:'#EF502E',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } else {
          console.error('Failed to update job status');
          Swal.fire({
            title: 'Error!',
            text: 'Failed to update job status.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      } catch (error) {
        console.error('Error updating job status:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Error updating job status.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } else {
      // User clicked 'Cancel', do nothing
      Swal.fire({
        title: 'Cancelled',
        text: 'Technician status change was cancelled.',
        icon: 'info',
        confirmButtonText: 'OK'
      });
    }
  };

  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

  // CSV Export Functions
const convertToCSV = (data:any) => {
  const csvRows = [];
  // Get headers
  csvRows.push(Object.keys(data[0]).join(','));
  // Convert data to csv
  for (const row of data) {
    csvRows.push(Object.values(row).join(','));
  }
  return csvRows.join('\n');
};

const downloadCSV = () => {
  const csvData = convertToCSV(activeJob);
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'jobs.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};


  const renderRow = (job: any) => {

    
    
    return (
    <tr key={job.vin}>
      {/* <td>{job.vinCount}</td>  */}
      <td>{job?.customer?.firstName} {job?.customer?.lastName}</td>  
      <td>{job?.customer?.email}</td>  
      <td>{job?.customer?.phoneNumber}</td>  
      <td>{job?.vin}</td> 
       
      <td>
        <span
          className={`badge ${job.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
        >
          {job.jobStatus ? 'Completed' : 'In Progress'}
        </span>
      </td> 
      <td> 

            <Link className="p-1" href={`/jobs/job-group/view?vin=${job?.vin}`}>
                 <Image alt='eye' src={Eye} className='w-[16px]' /> 
                 </Link>
      </td>
    </tr>
    )
  };

  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading="Work Order By Customers" onSearch={(term) => setSearchTerm(term)} userRole='' onExport={downloadCSV} buttonLabel="" buttonLink="" />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              {/* <th   onClick={() => handleSort('id')}>
                Count
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>  */}
              <th   onClick={() => handleSort('customerName')}>
                Customer Name
                {sortBy === 'customerName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>  
              <th  >Email</th>  
              <th  >Phone Number</th>  
              <th  >VIN</th>  
              <th>Status</th>
              <th  >Action</th>
            </tr>
          </thead>
          <tbody>
              {loading ? (
                          <tr>
                            <td colSpan={6} className="text-center py-10">
                              <Loader />
                            </td>
                          </tr>
                        ) : activeJob.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-10">
                              <Empty />
                            </td>
                          </tr>
                        ) : (
                          activeJob.map((job) => renderRow(job))
                        )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default JobTable;
