// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react'; 
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import Pagination from '../../component/pagination';
import axios from 'axios';
import Swal from 'sweetalert2'; 
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

const VehicleTable: React.FC = () => {
  const [activeJob, setActiveJob] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Manage sorting column state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);  
  const [loading, setLoading] = useState<boolean>(true); 

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // Implement search logic here
  };
  const handleDeleteSuccess = (deletedId: string) => {
      // toast.success('Technician deleted successfully');
  
      // ✅ Remove the deleted technician from the table
      setActiveJob((prev) => prev.filter((cust) => cust.id !== deletedId));
    };
    const fetchJobs = useCallback(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
  
        const response = await fetch(`${apiUrl}/fetchVehicalInfo?page=${currentPage}`, {
          method: 'GET',
          headers,
        });
  
        const data = await response.json();
        if (response.ok) {
          setActiveJob(data.jobs.jobs); 
          setTotalPages(data.jobs.totalPages);
        } else {
          if (data.error === 'Invalid Token') {
            router.push('/login');
          } else {
            console.error('Error fetching job data:', data.error);
          }
        }
      } catch (error) {
        console.error('Error fetching job data:', error);
      } finally {
        setLoading(false);
      }
    }, [currentPage, router]);
 
  

    useEffect(() => {
      fetchJobs();
    }, [fetchJobs]);



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

  const renderRow = (job: any) => (
    <tr key={job.id}>
      <td>{job.id}</td> 
      <td>{job?.customer?.firstName} {job?.customer?.lastName}</td>
      <td>{job?.customer?.phoneNumber}</td>
      <td>  {job?.technicians?.map((tech: any) => (
    <div key={tech.id}>
      {tech.firstName} {tech.lastName}
    </div>
  ))}</td>
      <td>{job?.technicians?.map((tech: any) => (
    <div key={tech.id}>
      {tech.phoneNumber}
    </div>
  ))}</td>
      <td>{job.vin}</td> 
       <td>red</td>
       <td>red</td>
      <td>
        <TableActions   
          editRoute={`/jobs/create-job/create?jobId=${job.id}`}   
         deleteRoute={`${apiUrl}/deleteJobs`}  // Pass the correct endpoint
         viewRoute={`/jobs/view?jobId=${job.id}`}
           idKey="jobid"
          itemId={job.id}  // Pass the technician ID
          onDeleteSuccess={() => handleDeleteSuccess(job.id)} 
           />
      </td>
    </tr>
  );

  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading="Vehicle Info" onSearch={handleSearch}  onExport={downloadCSV} buttonLabel="" buttonLink="" />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[100px]" onClick={() => handleSort('id')}>
                Vehicle ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th> 
              <th className="w-[120px]" onClick={() => handleSort('customerName')}>
                Job ID
                {sortBy === 'customerName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="w-[150px]">
              VIN
              </th>
              <th className="w-[120px]" >
              Make
              </th> 
              <th className="w-[100px]">Model</th> 
              <th className="w-[60px]">Year</th> 
              <th className="w-[50px]">Color</th>
              <th className="w-[120px]">Stock Number</th>
              <th className="w-[160px]">Action</th>
            </tr>
          </thead>
          <tbody>
              {loading ? (
                          <tr>
                            <td colSpan={9} className="text-center py-10">
                              <Loader />
                            </td>
                          </tr>
                        ) : activeJob.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center py-10">
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

export default VehicleTable;
