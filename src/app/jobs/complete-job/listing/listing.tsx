// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react'; 
import TableActions from '../../../component/action';
import CommonHeader from '../../../component/commonHeader';
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import Pagination from '../../../component/pagination';
import axios from 'axios';
import Swal from 'sweetalert2'; 
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

const JobTable: React.FC = () => {
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
      toast.success('Technician deleted successfully');
  
      // ✅ Remove the deleted technician from the table
      setActiveJob((prev) => prev.filter((cust) => cust.id !== deletedId));
    };

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const fetchCompleteJobs = async () => {
      setLoading(true); 
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (token) headers['Authorization'] = `Token ${token}`;

        const response = await fetch(`${apiUrl}/fetchCompleteJobStatus`, {
          method: 'GET',
          headers,
        });

        const data = await response.json();

        if (response.ok) {
          setActiveJob(data.jobs);
          // setTotalPages(data.jobs.totalPages); // Set the total pages from API response
          // setCurrentPage(data.jobs.currentPage); // Update current page from API
        } else {
          if (data.error && data.error === 'Invalid Token') {
            router.push('/login');
          } else {
            console.error('Error fetching technician data:', data.error);
          }
        }
      } catch (error) {
        console.error('Error fetching technician data:', error);
      }finally {
        setLoading(false);  // Hide loader after fetching
      }
    };

    fetchCompleteJobs();
  }, [router]);

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
        const nameA = `${a?.technician?.firstName} ${a?.technician?.lastName}`;
        const nameB = `${b?.technician?.firstName} ${b?.technician?.lastName}`;
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }

      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setActiveJob(sortedJobs);
  };

 
  // const handlePageChange = (data: { selected: number }) => {
  //   console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
  //   setCurrentPage(data.selected + 1);
  // };

  const renderRow = (completejob: any) => (
    <tr key={completejob.id}>
      <td>{completejob.id}</td>
      <td>{completejob.jobDescription}</td>
      <td>{completejob?.customer?.firstName} {completejob?.customer?.lastName}</td>
      <td>{completejob?.technician?.firstName} {completejob?.technician?.lastName}</td> 
      <td>{completejob.vin}</td>
      <td>{completejob.make}</td>  
      <td>{new Date(completejob.createdAt).toLocaleDateString('en-GB')}</td>
      <td>{new Date(completejob.updatedAt).toLocaleDateString('en-GB')}</td>
      <td>
        <TableActions   
          editRoute={`/jobs/create-job/create?jobId=${completejob.id}`}   
         deleteRoute={`${apiUrl}/deleteJobs`}  // Pass the correct endpoint
         viewRoute={`/technicians/view?technicianId=${completejob.id}`} 
         idKey="jobid"
          itemId={completejob.id}  // Pass the technician ID
          onDeleteSuccess={() => handleDeleteSuccess(completejob.id)} 
           />
      </td>
    </tr>
  );

  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading="Completed Jobs" onSearch={handleSearch} buttonLabel=" " buttonLink="" />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[50px]" onClick={() => handleSort('id')}>
                ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-green-500' : 'text-red-500'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="w-[150px]" onClick={() => handleSort('jobDescription')}>
                Job Description
                {sortBy === 'jobDescription' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-green-500' : 'text-red-500'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="w-[120px]" onClick={() => handleSort('customerName')}>
                Customer Name
                {sortBy === 'customerName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-green-500' : 'text-red-500'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="w-[120px]" onClick={() => handleSort('technicianName')}>
                Technician Name
                {sortBy === 'technicianName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-green-500' : 'text-red-500'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>  

              <th className="w-[160px]">VIN</th>
              <th className="w-[100px]">Vehicle Make</th> 
              <th className="w-[100px]">Start Date</th>
              <th className="w-[160px]">Completion Date</th>
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
                          activeJob.map((completejob) => renderRow(completejob))
                        )}
          </tbody>
        </table>
      </div>
      {/* <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /> */}
    </div>
  );
};

export default JobTable;
